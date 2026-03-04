const express = require('express');
const { v4: uuidv4 } = require('uuid');
const Joi = require('joi');

const router = express.Router();

// Schema de validação para datacenters
const datacenterSchema = Joi.object({
  organization_id: Joi.string().uuid().required(),
  name: Joi.string().min(1).max(255).required(),
  location: Joi.string().max(255).optional(),
  total_area_m2: Joi.number().positive().optional(),
  total_power_capacity_kw: Joi.number().positive().optional()
});

// GET /api/datacenters - Listar datacenters
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 50, organization_id } = req.query;
    
    let query = `
      SELECT 
        dc.*,
        o.name as organization_name,
        o.industry,
        COUNT(DISTINCT a.id) as asset_count,
        COALESCE(SUM(em.energy_consumption_kwh), 0) as total_energy_consumption,
        COALESCE(SUM(em.carbon_emission_kg), 0) as total_carbon_emission,
        COALESCE(AVG(em.energy_efficiency_percent), 0) as avg_energy_efficiency
      FROM datacenters dc
      JOIN organizations o ON dc.organization_id = o.id
      LEFT JOIN assets a ON dc.id = a.datacenter_id
      LEFT JOIN energy_measurements em ON a.id = em.asset_id
      WHERE 1=1
    `;
    
    const params = [];
    let paramIndex = 1;
    
    if (organization_id) {
      query += ` AND dc.organization_id = $${paramIndex++}`;
      params.push(organization_id);
    }
    
    query += ` GROUP BY dc.id, o.id ORDER BY dc.created_at DESC`;
    
    const offset = (page - 1) * limit;
    query += ` LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    params.push(limit, offset);
    
    const result = await req.db.query(query, params);
    
    // Contar total de registros
    let countQuery = 'SELECT COUNT(*) FROM datacenters dc WHERE 1=1';
    const countParams = [];
    let countIndex = 1;
    
    if (organization_id) {
      countQuery += ` AND dc.organization_id = $${countIndex++}`;
      countParams.push(organization_id);
    }
    
    const countResult = await req.db.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].count);
    
    res.json({
      datacenters: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching datacenters:', error);
    res.status(500).json({ error: 'Failed to fetch datacenters' });
  }
});

// GET /api/datacenters/:id - Obter datacenter específico
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const query = `
      SELECT 
        dc.*,
        o.name as organization_name,
        o.industry,
        COUNT(DISTINCT a.id) as asset_count,
        COALESCE(SUM(em.energy_consumption_kwh), 0) as total_energy_consumption,
        COALESCE(SUM(em.carbon_emission_kg), 0) as total_carbon_emission,
        COALESCE(AVG(em.energy_efficiency_percent), 0) as avg_energy_efficiency,
        COALESCE(AVG(em.power_usage_efficiency_percent), 0) as avg_pue_efficiency
      FROM datacenters dc
      JOIN organizations o ON dc.organization_id = o.id
      LEFT JOIN assets a ON dc.id = a.datacenter_id
      LEFT JOIN energy_measurements em ON a.id = em.asset_id
      WHERE dc.id = $1
      GROUP BY dc.id, o.id
    `;
    
    const result = await req.db.query(query, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Datacenter not found' });
    }
    
    // Obter ativos do datacenter
    const assetsQuery = `
      SELECT 
        a.*,
        at.name as asset_type,
        at.category,
        em.measurement_date,
        em.energy_consumption_kwh,
        em.carbon_emission_kg,
        em.energy_efficiency_percent
      FROM assets a
      JOIN asset_types at ON a.asset_type_id = at.id
      LEFT JOIN LATERAL (
        SELECT * FROM energy_measurements 
        WHERE asset_id = a.id 
        ORDER BY measurement_date DESC 
        LIMIT 1
      ) em ON true
      WHERE a.datacenter_id = $1
      ORDER BY a.name
    `;
    
    const assetsResult = await req.db.query(assetsQuery, [id]);
    
    res.json({
      datacenter: result.rows[0],
      assets: assetsResult.rows
    });
  } catch (error) {
    console.error('Error fetching datacenter:', error);
    res.status(500).json({ error: 'Failed to fetch datacenter' });
  }
});

// POST /api/datacenters - Criar novo datacenter
router.post('/', async (req, res) => {
  try {
    const { error, value } = datacenterSchema.validate(req.body);
    
    if (error) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: error.details 
      });
    }
    
    const id = uuidv4();
    const { organization_id, name, location, total_area_m2, total_power_capacity_kw } = value;
    
    const query = `
      INSERT INTO datacenters (
        id, organization_id, name, location, total_area_m2, total_power_capacity_kw
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    
    const result = await req.db.query(query, [
      id, organization_id, name, location, total_area_m2, total_power_capacity_kw
    ]);
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating datacenter:', error);
    res.status(500).json({ error: 'Failed to create datacenter' });
  }
});

// PUT /api/datacenters/:id - Atualizar datacenter
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { error, value } = datacenterSchema.validate(req.body);
    
    if (error) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: error.details 
      });
    }
    
    const { organization_id, name, location, total_area_m2, total_power_capacity_kw } = value;
    
    const query = `
      UPDATE datacenters SET
        organization_id = $2,
        name = $3,
        location = $4,
        total_area_m2 = $5,
        total_power_capacity_kw = $6,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `;
    
    const result = await req.db.query(query, [
      id, organization_id, name, location, total_area_m2, total_power_capacity_kw
    ]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Datacenter not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating datacenter:', error);
    res.status(500).json({ error: 'Failed to update datacenter' });
  }
});

// DELETE /api/datacenters/:id - Excluir datacenter
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await req.db.query('DELETE FROM datacenters WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Datacenter not found' });
    }
    
    res.json({ message: 'Datacenter deleted successfully' });
  } catch (error) {
    console.error('Error deleting datacenter:', error);
    res.status(500).json({ error: 'Failed to delete datacenter' });
  }
});

// GET /api/datacenters/:id/assets - Listar ativos de um datacenter
router.get('/:id/assets', async (req, res) => {
  try {
    const { id } = req.params;
    const { asset_type_id, status, page = 1, limit = 50 } = req.query;
    
    let query = `
      SELECT 
        a.*,
        at.name as asset_type,
        at.category,
        em.measurement_date,
        em.energy_consumption_kwh,
        em.carbon_emission_kg,
        em.energy_efficiency_percent,
        em.power_usage_efficiency_percent,
        em.carbon_intensity
      FROM assets a
      JOIN asset_types at ON a.asset_type_id = at.id
      LEFT JOIN LATERAL (
        SELECT * FROM energy_measurements 
        WHERE asset_id = a.id 
        ORDER BY measurement_date DESC 
        LIMIT 1
      ) em ON true
      WHERE a.datacenter_id = $1
    `;
    
    const params = [id];
    let paramIndex = 2;
    
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
    let countQuery = 'SELECT COUNT(*) FROM assets a WHERE a.datacenter_id = $1';
    const countParams = [id];
    let countIndex = 2;
    
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
    console.error('Error fetching datacenter assets:', error);
    res.status(500).json({ error: 'Failed to fetch datacenter assets' });
  }
});

// GET /api/datacenters/:id/analytics - Análises específicas do datacenter
router.get('/:id/analytics', async (req, res) => {
  try {
    const { id } = req.params;
    const { period = 'month' } = req.query;
    
    let groupBy;
    switch (period) {
      case 'day':
        groupBy = 'DATE_TRUNC(\'day\', em.measurement_date)';
        break;
      case 'week':
        groupBy = 'DATE_TRUNC(\'week\', em.measurement_date)';
        break;
      case 'month':
        groupBy = 'DATE_TRUNC(\'month\', em.measurement_date)';
        break;
      case 'year':
        groupBy = 'DATE_TRUNC(\'year\', em.measurement_date)';
        break;
      default:
        groupBy = 'DATE_TRUNC(\'month\', em.measurement_date)';
    }
    
    // Consumo ao longo do tempo
    const consumptionQuery = `
      SELECT 
        ${groupBy} as period,
        SUM(em.energy_consumption_kwh) as total_consumption,
        SUM(em.carbon_emission_kg) as total_emission,
        AVG(em.energy_efficiency_percent) as avg_efficiency,
        COUNT(DISTINCT em.asset_id) as active_assets
      FROM energy_measurements em
      JOIN assets a ON em.asset_id = a.id
      WHERE a.datacenter_id = $1
        AND em.measurement_date >= NOW() - INTERVAL '1 year'
      GROUP BY ${groupBy}
      ORDER BY period DESC
      LIMIT 12
    `;
    
    const consumptionResult = await req.db.query(consumptionQuery, [id]);
    
    // Distribuição por tipo de ativo
    const distributionQuery = `
      SELECT 
        at.name as asset_type,
        COUNT(a.id) as asset_count,
        COALESCE(SUM(em.energy_consumption_kwh), 0) as total_consumption,
        COALESCE(SUM(em.carbon_emission_kg), 0) as total_emission,
        COALESCE(AVG(em.energy_efficiency_percent), 0) as avg_efficiency
      FROM asset_types at
      LEFT JOIN assets a ON at.id = a.asset_type_id
      LEFT JOIN energy_measurements em ON a.id = em.asset_id
      WHERE a.datacenter_id = $1
      GROUP BY at.id, at.name
      ORDER BY total_consumption DESC
    `;
    
    const distributionResult = await req.db.query(distributionQuery, [id]);
    
    // Top ativos por consumo
    const topAssetsQuery = `
      SELECT 
        a.id,
        a.name,
        at.name as asset_type,
        em.energy_consumption_kwh,
        em.carbon_emission_kg,
        em.energy_efficiency_percent,
        em.measurement_date
      FROM assets a
      JOIN asset_types at ON a.asset_type_id = at.id
      JOIN energy_measurements em ON a.id = em.asset_id
      WHERE a.datacenter_id = $1
        AND em.measurement_date = (
          SELECT MAX(measurement_date) 
          FROM energy_measurements 
          WHERE asset_id = a.id
        )
      ORDER BY em.energy_consumption_kwh DESC
      LIMIT 10
    `;
    
    const topAssetsResult = await req.db.query(topAssetsQuery, [id]);
    
    res.json({
      consumption_trend: consumptionResult.rows.reverse(),
      asset_distribution: distributionResult.rows,
      top_assets: topAssetsResult.rows
    });
  } catch (error) {
    console.error('Error fetching datacenter analytics:', error);
    res.status(500).json({ error: 'Failed to fetch datacenter analytics' });
  }
});

module.exports = router;
