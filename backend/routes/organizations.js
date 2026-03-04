const express = require('express');
const { v4: uuidv4 } = require('uuid');
const Joi = require('joi');

const router = express.Router();

// Schema de validação para organizações
const organizationSchema = Joi.object({
  name: Joi.string().min(1).max(255).required(),
  description: Joi.string().max(1000).optional(),
  cnpj: Joi.string().max(20).optional(),
  industry: Joi.string().max(100).optional()
});

// Schema de validação para datacenters
const datacenterSchema = Joi.object({
  organization_id: Joi.string().uuid().required(),
  name: Joi.string().min(1).max(255).required(),
  location: Joi.string().max(255).optional(),
  total_area_m2: Joi.number().positive().optional(),
  total_power_capacity_kw: Joi.number().positive().optional()
});

// GET /api/organizations - Listar organizações
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 50, industry } = req.query;
    
    let query = `
      SELECT 
        o.*,
        COUNT(DISTINCT dc.id) as datacenter_count,
        COUNT(DISTINCT a.id) as asset_count,
        COALESCE(SUM(em.energy_consumption_kwh), 0) as total_energy_consumption,
        COALESCE(SUM(em.carbon_emission_kg), 0) as total_carbon_emission
      FROM organizations o
      LEFT JOIN datacenters dc ON o.id = dc.organization_id
      LEFT JOIN assets a ON dc.id = a.datacenter_id
      LEFT JOIN energy_measurements em ON a.id = em.asset_id
      WHERE 1=1
    `;
    
    const params = [];
    let paramIndex = 1;
    
    if (industry) {
      query += ` AND o.industry = $${paramIndex++}`;
      params.push(industry);
    }
    
    query += ` GROUP BY o.id ORDER BY o.created_at DESC`;
    
    const offset = (page - 1) * limit;
    query += ` LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    params.push(limit, offset);
    
    const result = await req.db.query(query, params);
    
    // Contar total de registros
    let countQuery = 'SELECT COUNT(*) FROM organizations o WHERE 1=1';
    const countParams = [];
    let countIndex = 1;
    
    if (industry) {
      countQuery += ` AND o.industry = $${countIndex++}`;
      countParams.push(industry);
    }
    
    const countResult = await req.db.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].count);
    
    res.json({
      organizations: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching organizations:', error);
    res.status(500).json({ error: 'Failed to fetch organizations' });
  }
});

// GET /api/organizations/:id - Obter organização específica
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const query = `
      SELECT 
        o.*,
        COUNT(DISTINCT dc.id) as datacenter_count,
        COUNT(DISTINCT a.id) as asset_count,
        COALESCE(SUM(em.energy_consumption_kwh), 0) as total_energy_consumption,
        COALESCE(SUM(em.carbon_emission_kg), 0) as total_carbon_emission,
        COALESCE(AVG(em.energy_efficiency_percent), 0) as avg_energy_efficiency
      FROM organizations o
      LEFT JOIN datacenters dc ON o.id = dc.organization_id
      LEFT JOIN assets a ON dc.id = a.datacenter_id
      LEFT JOIN energy_measurements em ON a.id = em.asset_id
      WHERE o.id = $1
      GROUP BY o.id
    `;
    
    const result = await req.db.query(query, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Organization not found' });
    }
    
    // Obter datacenters da organização
    const datacentersQuery = `
      SELECT 
        dc.*,
        COUNT(DISTINCT a.id) as asset_count,
        COALESCE(SUM(em.energy_consumption_kwh), 0) as total_energy_consumption
      FROM datacenters dc
      LEFT JOIN assets a ON dc.id = a.datacenter_id
      LEFT JOIN energy_measurements em ON a.id = em.asset_id
      WHERE dc.organization_id = $1
      GROUP BY dc.id
      ORDER BY dc.name
    `;
    
    const datacentersResult = await req.db.query(datacentersQuery, [id]);
    
    res.json({
      organization: result.rows[0],
      datacenters: datacentersResult.rows
    });
  } catch (error) {
    console.error('Error fetching organization:', error);
    res.status(500).json({ error: 'Failed to fetch organization' });
  }
});

// POST /api/organizations - Criar nova organização
router.post('/', async (req, res) => {
  try {
    const { error, value } = organizationSchema.validate(req.body);
    
    if (error) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: error.details 
      });
    }
    
    const id = uuidv4();
    const { name, description, cnpj, industry } = value;
    
    const query = `
      INSERT INTO organizations (id, name, description, cnpj, industry)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    
    const result = await req.db.query(query, [id, name, description, cnpj, industry]);
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating organization:', error);
    res.status(500).json({ error: 'Failed to create organization' });
  }
});

// PUT /api/organizations/:id - Atualizar organização
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { error, value } = organizationSchema.validate(req.body);
    
    if (error) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: error.details 
      });
    }
    
    const { name, description, cnpj, industry } = value;
    
    const query = `
      UPDATE organizations SET
        name = $2,
        description = $3,
        cnpj = $4,
        industry = $5,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `;
    
    const result = await req.db.query(query, [id, name, description, cnpj, industry]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Organization not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating organization:', error);
    res.status(500).json({ error: 'Failed to update organization' });
  }
});

// DELETE /api/organizations/:id - Excluir organização
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await req.db.query('DELETE FROM organizations WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Organization not found' });
    }
    
    res.json({ message: 'Organization deleted successfully' });
  } catch (error) {
    console.error('Error deleting organization:', error);
    res.status(500).json({ error: 'Failed to delete organization' });
  }
});

// GET /api/organizations/:id/datacenters - Listar datacenters de uma organização
router.get('/:id/datacenters', async (req, res) => {
  try {
    const { id } = req.params;
    
    const query = `
      SELECT 
        dc.*,
        COUNT(DISTINCT a.id) as asset_count,
        COALESCE(SUM(em.energy_consumption_kwh), 0) as total_energy_consumption,
        COALESCE(SUM(em.carbon_emission_kg), 0) as total_carbon_emission
      FROM datacenters dc
      LEFT JOIN assets a ON dc.id = a.datacenter_id
      LEFT JOIN energy_measurements em ON a.id = em.asset_id
      WHERE dc.organization_id = $1
      GROUP BY dc.id
      ORDER BY dc.name
    `;
    
    const result = await req.db.query(query, [id]);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching datacenters:', error);
    res.status(500).json({ error: 'Failed to fetch datacenters' });
  }
});

// POST /api/organizations/:id/datacenters - Criar novo datacenter
router.post('/:id/datacenters', async (req, res) => {
  try {
    const { id } = req.params;
    const { error, value } = datacenterSchema.validate({ ...req.body, organization_id: id });
    
    if (error) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: error.details 
      });
    }
    
    const datacenterId = uuidv4();
    const { organization_id, name, location, total_area_m2, total_power_capacity_kw } = value;
    
    const query = `
      INSERT INTO datacenters (
        id, organization_id, name, location, total_area_m2, total_power_capacity_kw
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    
    const result = await req.db.query(query, [
      datacenterId, organization_id, name, location, total_area_m2, total_power_capacity_kw
    ]);
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating datacenter:', error);
    res.status(500).json({ error: 'Failed to create datacenter' });
  }
});

module.exports = router;
