const express = require('express');
const { v4: uuidv4 } = require('uuid');
const Joi = require('joi');

const router = express.Router();

// Schema de validação para ativos
const assetSchema = Joi.object({
  name: Joi.string().min(1).max(255).required(),
  datacenter_id: Joi.string().uuid().required(),
  asset_type_id: Joi.number().integer().positive().required(),
  model: Joi.string().max(255).optional(),
  manufacturer: Joi.string().max(255).optional(),
  serial_number: Joi.string().max(100).optional(),
  purchase_date: Joi.date().optional(),
  warranty_expiry: Joi.date().optional(),
  status: Joi.string().valid('active', 'inactive', 'maintenance', 'decommissioned').default('active')
});

// Schema de validação para medições energéticas
const measurementSchema = Joi.object({
  asset_id: Joi.string().uuid().required(),
  measurement_date: Joi.date().required(),
  energy_consumption_kwh: Joi.number().positive().required(),
  pue: Joi.number().positive().required(),
  utilization_percent: Joi.number().min(0).max(100).required(),
  temperature_celsius: Joi.number().required(),
  efficiency_percent: Joi.number().min(0).max(100).required(),
  energy_source_id: Joi.number().integer().positive().optional(),
  green_certification_id: Joi.number().integer().positive().optional(),
  notes: Joi.string().max(1000).optional()
});

// GET /api/assets - Listar todos os ativos
router.get('/', async (req, res) => {
  try {
    const { datacenter_id, asset_type_id, status, page = 1, limit = 50 } = req.query;
    
    let query = `
      SELECT 
        a.id,
        a.name,
        a.model,
        a.manufacturer,
        a.serial_number,
        a.purchase_date,
        a.warranty_expiry,
        a.status,
        a.created_at,
        a.updated_at,
        at.name as asset_type,
        at.category,
        dc.name as datacenter_name,
        o.name as organization_name,
        em.measurement_date,
        em.energy_consumption_kwh,
        em.carbon_emission_kg,
        em.energy_efficiency_percent,
        em.power_usage_efficiency_percent,
        em.carbon_intensity
      FROM assets a
      JOIN asset_types at ON a.asset_type_id = at.id
      JOIN datacenters dc ON a.datacenter_id = dc.id
      JOIN organizations o ON dc.organization_id = o.id
      LEFT JOIN LATERAL (
        SELECT * FROM energy_measurements 
        WHERE asset_id = a.id 
        ORDER BY measurement_date DESC 
        LIMIT 1
      ) em ON true
      WHERE 1=1
    `;
    
    const params = [];
    let paramIndex = 1;
    
    if (datacenter_id) {
      query += ` AND a.datacenter_id = $${paramIndex++}`;
      params.push(datacenter_id);
    }
    
    if (asset_type_id) {
      query += ` AND a.asset_type_id = $${paramIndex++}`;
      params.push(asset_type_id);
    }
    
    if (status) {
      query += ` AND a.status = $${paramIndex++}`;
      params.push(status);
    }
    
    query += ` ORDER BY a.created_at DESC`;
    
    const offset = (page - 1) * limit;
    query += ` LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    params.push(limit, offset);
    
    const result = await req.db.query(query, params);
    
    // Contar total de registros
    let countQuery = 'SELECT COUNT(*) FROM assets a WHERE 1=1';
    const countParams = [];
    let countIndex = 1;
    
    if (datacenter_id) {
      countQuery += ` AND a.datacenter_id = $${countIndex++}`;
      countParams.push(datacenter_id);
    }
    
    if (asset_type_id) {
      countQuery += ` AND a.asset_type_id = $${countIndex++}`;
      countParams.push(asset_type_id);
    }
    
    if (status) {
      countQuery += ` AND a.status = $${countIndex++}`;
      countParams.push(status);
    }
    
    const countResult = await req.db.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].count);
    
    res.json({
      assets: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching assets:', error);
    res.status(500).json({ error: 'Failed to fetch assets' });
  }
});

// GET /api/assets/:id - Obter ativo específico
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const query = `
      SELECT 
        a.*,
        at.name as asset_type,
        at.category,
        dc.name as datacenter_name,
        o.name as organization_name
      FROM assets a
      JOIN asset_types at ON a.asset_type_id = at.id
      JOIN datacenters dc ON a.datacenter_id = dc.id
      JOIN organizations o ON dc.organization_id = o.id
      WHERE a.id = $1
    `;
    
    const result = await req.db.query(query, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Asset not found' });
    }
    
    // Obter medições históricas
    const measurementsQuery = `
      SELECT 
        em.*,
        es.name as energy_source,
        gc.name as green_certification
      FROM energy_measurements em
      LEFT JOIN energy_sources es ON em.energy_source_id = es.id
      LEFT JOIN green_certifications gc ON em.green_certification_id = gc.id
      WHERE em.asset_id = $1
      ORDER BY em.measurement_date DESC
    `;
    
    const measurementsResult = await req.db.query(measurementsQuery, [id]);
    
    res.json({
      asset: result.rows[0],
      measurements: measurementsResult.rows
    });
  } catch (error) {
    console.error('Error fetching asset:', error);
    res.status(500).json({ error: 'Failed to fetch asset' });
  }
});

// POST /api/assets - Criar novo ativo
router.post('/', async (req, res) => {
  try {
    const { error, value } = assetSchema.validate(req.body);
    
    if (error) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: error.details 
      });
    }
    
    const id = uuidv4();
    const {
      name,
      datacenter_id,
      asset_type_id,
      model,
      manufacturer,
      serial_number,
      purchase_date,
      warranty_expiry,
      status
    } = value;
    
    const query = `
      INSERT INTO assets (
        id, name, datacenter_id, asset_type_id, model, 
        manufacturer, serial_number, purchase_date, 
        warranty_expiry, status
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10
      ) RETURNING *
    `;
    
    const result = await req.db.query(query, [
      id, name, datacenter_id, asset_type_id, model,
      manufacturer, serial_number, purchase_date,
      warranty_expiry, status
    ]);
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating asset:', error);
    res.status(500).json({ error: 'Failed to create asset' });
  }
});

// PUT /api/assets/:id - Atualizar ativo
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { error, value } = assetSchema.validate(req.body);
    
    if (error) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: error.details 
      });
    }
    
    const {
      name,
      datacenter_id,
      asset_type_id,
      model,
      manufacturer,
      serial_number,
      purchase_date,
      warranty_expiry,
      status
    } = value;
    
    const query = `
      UPDATE assets SET
        name = $2,
        datacenter_id = $3,
        asset_type_id = $4,
        model = $5,
        manufacturer = $6,
        serial_number = $7,
        purchase_date = $8,
        warranty_expiry = $9,
        status = $10,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `;
    
    const result = await req.db.query(query, [
      id, name, datacenter_id, asset_type_id, model,
      manufacturer, serial_number, purchase_date,
      warranty_expiry, status
    ]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Asset not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating asset:', error);
    res.status(500).json({ error: 'Failed to update asset' });
  }
});

// DELETE /api/assets/:id - Excluir ativo
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await req.db.query('DELETE FROM assets WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Asset not found' });
    }
    
    res.json({ message: 'Asset deleted successfully' });
  } catch (error) {
    console.error('Error deleting asset:', error);
    res.status(500).json({ error: 'Failed to delete asset' });
  }
});

// POST /api/assets/:id/measurements - Adicionar medição energética
router.post('/:id/measurements', async (req, res) => {
  try {
    const { id } = req.params;
    const { error, value } = measurementSchema.validate({ ...req.body, asset_id: id });
    
    if (error) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: error.details 
      });
    }
    
    const measurementId = uuidv4();
    const {
      asset_id,
      measurement_date,
      energy_consumption_kwh,
      pue,
      utilization_percent,
      temperature_celsius,
      efficiency_percent,
      energy_source_id,
      green_certification_id,
      notes
    } = value;
    
    const query = `
      INSERT INTO energy_measurements (
        id, asset_id, measurement_date, energy_consumption_kwh, pue,
        utilization_percent, temperature_celsius, efficiency_percent,
        energy_source_id, green_certification_id, notes
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11
      ) RETURNING *
    `;
    
    const result = await req.db.query(query, [
      measurementId, asset_id, measurement_date, energy_consumption_kwh, pue,
      utilization_percent, temperature_celsius, efficiency_percent,
      energy_source_id, green_certification_id, notes
    ]);
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error adding measurement:', error);
    res.status(500).json({ error: 'Failed to add measurement' });
  }
});

// GET /api/assets/types - Obter tipos de ativos
router.get('/types/list', async (req, res) => {
  try {
    const result = await req.db.query('SELECT * FROM asset_types ORDER BY name');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching asset types:', error);
    res.status(500).json({ error: 'Failed to fetch asset types' });
  }
});

module.exports = router;
