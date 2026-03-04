const express = require('express');
const router = express.Router();

// GET /api/analytics/dashboard - Obter dados do dashboard
router.get('/dashboard', async (req, res) => {
  try {
    const { organization_id, datacenter_id, date_from, date_to } = req.query;
    
    // Métricas gerais
    let metricsQuery = `
      SELECT 
        COUNT(DISTINCT a.id) as total_assets,
        COUNT(DISTINCT dc.id) as total_datacenters,
        COUNT(DISTINCT o.id) as total_organizations,
        COALESCE(SUM(em.energy_consumption_kwh), 0) as total_energy_consumption,
        COALESCE(SUM(em.carbon_emission_kg), 0) as total_carbon_emission,
        COALESCE(AVG(em.energy_efficiency_percent), 0) as avg_energy_efficiency,
        COALESCE(AVG(em.power_usage_efficiency_percent), 0) as avg_pue_efficiency,
        COALESCE(AVG(em.carbon_intensity), 0) as avg_carbon_intensity
      FROM assets a
      JOIN datacenters dc ON a.datacenter_id = dc.id
      JOIN organizations o ON dc.organization_id = o.id
      LEFT JOIN energy_measurements em ON a.id = em.asset_id
      WHERE 1=1
    `;
    
    const params = [];
    let paramIndex = 1;
    
    if (organization_id) {
      metricsQuery += ` AND dc.organization_id = $${paramIndex++}`;
      params.push(organization_id);
    }
    
    if (datacenter_id) {
      metricsQuery += ` AND a.datacenter_id = $${paramIndex++}`;
      params.push(datacenter_id);
    }
    
    if (date_from) {
      metricsQuery += ` AND (em.measurement_date >= $${paramIndex++} OR em.measurement_date IS NULL)`;
      params.push(date_from);
    }
    
    if (date_to) {
      metricsQuery += ` AND (em.measurement_date <= $${paramIndex++} OR em.measurement_date IS NULL)`;
      params.push(date_to);
    }
    
    const metricsResult = await req.db.query(metricsQuery, params);
    
    // Consumo por tipo de ativo
    const consumptionByTypeQuery = `
      SELECT 
        at.name as asset_type,
        COUNT(a.id) as asset_count,
        COALESCE(SUM(em.energy_consumption_kwh), 0) as total_consumption,
        COALESCE(SUM(em.carbon_emission_kg), 0) as total_emission
      FROM asset_types at
      LEFT JOIN assets a ON at.id = a.asset_type_id
      LEFT JOIN energy_measurements em ON a.id = em.asset_id
      ${organization_id || datacenter_id ? `
      JOIN datacenters dc ON a.datacenter_id = dc.id
      ` : ''}
      WHERE 1=1
    `;
    
    const typeParams = [];
    let typeIndex = 1;
    
    if (organization_id) {
      consumptionByTypeQuery += ` AND dc.organization_id = $${typeIndex++}`;
      typeParams.push(organization_id);
    }
    
    if (datacenter_id) {
      consumptionByTypeQuery += ` AND a.datacenter_id = $${typeIndex++}`;
      typeParams.push(datacenter_id);
    }
    
    consumptionByTypeQuery += ` GROUP BY at.id, at.name ORDER BY total_consumption DESC`;
    
    const typeResult = await req.db.query(consumptionByTypeQuery, typeParams);
    
    // Tendência temporal
    const trendQuery = `
      SELECT 
        DATE_TRUNC('month', em.measurement_date) as month,
        SUM(em.energy_consumption_kwh) as monthly_consumption,
        SUM(em.carbon_emission_kg) as monthly_emission,
        AVG(em.energy_efficiency_percent) as avg_efficiency
      FROM energy_measurements em
      JOIN assets a ON em.asset_id = a.id
      ${organization_id || datacenter_id ? `
      JOIN datacenters dc ON a.datacenter_id = dc.id
      ` : ''}
      WHERE em.measurement_date >= NOW() - INTERVAL '12 months'
    `;
    
    const trendParams = [];
    let trendIndex = 1;
    
    if (organization_id) {
      trendQuery += ` AND dc.organization_id = $${trendIndex++}`;
      trendParams.push(organization_id);
    }
    
    if (datacenter_id) {
      trendQuery += ` AND a.datacenter_id = $${trendIndex++}`;
      trendParams.push(datacenter_id);
    }
    
    trendQuery += ` GROUP BY DATE_TRUNC('month', em.measurement_date) ORDER BY month`;
    
    const trendResult = await req.db.query(trendQuery, trendParams);
    
    // Top ativos por consumo
    const topAssetsQuery = `
      SELECT 
        a.id,
        a.name,
        at.name as asset_type,
        em.energy_consumption_kwh,
        em.carbon_emission_kg,
        em.energy_efficiency_percent,
        dc.name as datacenter_name
      FROM assets a
      JOIN asset_types at ON a.asset_type_id = at.id
      JOIN datacenters dc ON a.datacenter_id = dc.id
      JOIN energy_measurements em ON a.id = em.asset_id
      WHERE em.measurement_date = (
        SELECT MAX(measurement_date) 
        FROM energy_measurements 
        WHERE asset_id = a.id
      )
    `;
    
    const topAssetsParams = [];
    let topAssetsIndex = 1;
    
    if (organization_id) {
      topAssetsQuery += ` AND dc.organization_id = $${topAssetsIndex++}`;
      topAssetsParams.push(organization_id);
    }
    
    if (datacenter_id) {
      topAssetsQuery += ` AND a.datacenter_id = $${topAssetsIndex++}`;
      topAssetsParams.push(datacenter_id);
    }
    
    topAssetsQuery += ` ORDER BY em.energy_consumption_kwh DESC LIMIT 10`;
    
    const topAssetsResult = await req.db.query(topAssetsQuery, topAssetsParams);
    
    res.json({
      metrics: metricsResult.rows[0],
      consumptionByType: typeResult.rows,
      trend: trendResult.rows,
      topAssets: topAssetsResult.rows
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

// GET /api/analytics/spider-chart - Dados para gráfico de teia de aranha
router.get('/spider-chart', async (req, res) => {
  try {
    const { asset_ids } = req.query;
    
    if (!asset_ids) {
      return res.status(400).json({ error: 'Asset IDs are required' });
    }
    
    const assetIdArray = Array.isArray(asset_ids) ? asset_ids : [asset_ids];
    
    const query = `
      SELECT 
        a.id,
        a.name,
        em.energy_efficiency_percent,
        em.power_usage_efficiency_percent,
        em.utilization_percent,
        em.efficiency_percent,
        CASE 
          WHEN em.carbon_intensity <= 0.05 THEN 100
          WHEN em.carbon_intensity <= 0.1 THEN 70
          ELSE 40
        END as carbon_efficiency,
        CASE 
          WHEN gc.name IS NOT NULL AND gc.name != 'none' THEN 80
          ELSE 50
        END as certification_score
      FROM assets a
      JOIN energy_measurements em ON a.id = em.asset_id
      LEFT JOIN green_certifications gc ON em.green_certification_id = gc.id
      WHERE a.id = ANY($1)
        AND em.measurement_date = (
          SELECT MAX(measurement_date) 
          FROM energy_measurements 
          WHERE asset_id = a.id
        )
    `;
    
    const result = await req.db.query(query, [assetIdArray]);
    
    // Formatar dados para o gráfico de radar
    const datasets = result.rows.map((asset, index) => ({
      label: asset.name,
      data: [
        parseFloat(asset.energy_efficiency_percent) || 0,
        parseFloat(asset.power_usage_efficiency_percent) || 0,
        parseFloat(asset.utilization_percent) || 0,
        parseFloat(asset.efficiency_percent) || 0,
        parseFloat(asset.carbon_efficiency) || 0,
        parseFloat(asset.certification_score) || 0
      ]
    }));
    
    res.json({
      labels: [
        'Eficiência Energética',
        'Eficiência PUE',
        'Utilização',
        'Eficiência Operacional',
        'Baixa Intensidade de Carbono',
        'Certificação Verde'
      ],
      datasets
    });
  } catch (error) {
    console.error('Error fetching spider chart data:', error);
    res.status(500).json({ error: 'Failed to fetch spider chart data' });
  }
});

// GET /api/analytics/efficiency-comparison - Comparação de eficiência
router.get('/efficiency-comparison', async (req, res) => {
  try {
    const { period = 'month', limit = 12 } = req.query;
    
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
    
    const query = `
      SELECT 
        ${groupBy} as period,
        AVG(em.energy_efficiency_percent) as avg_energy_efficiency,
        AVG(em.power_usage_efficiency_percent) as avg_pue_efficiency,
        AVG(em.utilization_percent) as avg_utilization,
        COUNT(DISTINCT em.asset_id) as asset_count
      FROM energy_measurements em
      WHERE em.measurement_date >= NOW() - INTERVAL '1 year'
      GROUP BY ${groupBy}
      ORDER BY period DESC
      LIMIT $1
    `;
    
    const result = await req.db.query(query, [parseInt(limit)]);
    
    res.json({
      data: result.rows.reverse(), // Ordenar cronologicamente
      period
    });
  } catch (error) {
    console.error('Error fetching efficiency comparison:', error);
    res.status(500).json({ error: 'Failed to fetch efficiency comparison' });
  }
});

// GET /api/analytics/carbon-footprint - Análise de pegada de carbono
router.get('/carbon-footprint', async (req, res) => {
  try {
    const { organization_id, datacenter_id, year } = req.query;
    
    let yearCondition = '';
    const params = [];
    let paramIndex = 1;
    
    if (year) {
      yearCondition = ` AND EXTRACT(YEAR FROM em.measurement_date) = $${paramIndex++}`;
      params.push(year);
    } else {
      yearCondition = ` AND em.measurement_date >= DATE_TRUNC('year', CURRENT_DATE)`;
    }
    
    const query = `
      SELECT 
        o.name as organization,
        dc.name as datacenter,
        at.name as asset_type,
        COUNT(a.id) as asset_count,
        SUM(em.energy_consumption_kwh) as total_consumption,
        SUM(em.carbon_emission_kg) as total_emission,
        AVG(em.carbon_intensity) as avg_intensity,
        es.name as energy_source
      FROM organizations o
      JOIN datacenters dc ON o.id = dc.organization_id
      JOIN assets a ON dc.id = a.datacenter_id
      JOIN asset_types at ON a.asset_type_id = at.id
      JOIN energy_measurements em ON a.id = em.asset_id
      LEFT JOIN energy_sources es ON em.energy_source_id = es.id
      WHERE 1=1
    `;
    
    if (organization_id) {
      query += ` AND o.id = $${paramIndex++}`;
      params.push(organization_id);
    }
    
    if (datacenter_id) {
      query += ` AND dc.id = $${paramIndex++}`;
      params.push(datacenter_id);
    }
    
    query += yearCondition + ` GROUP BY o.id, dc.id, at.id, es.id ORDER BY total_emission DESC`;
    
    const result = await req.db.query(query, params);
    
    // Calcular totais
    const totals = result.rows.reduce((acc, row) => ({
      total_consumption: acc.total_consumption + parseFloat(row.total_consumption),
      total_emission: acc.total_emission + parseFloat(row.total_emission),
      asset_count: acc.asset_count + parseInt(row.asset_count)
    }), { total_consumption: 0, total_emission: 0, asset_count: 0 });
    
    res.json({
      details: result.rows,
      totals,
      year: year || new Date().getFullYear()
    });
  } catch (error) {
    console.error('Error fetching carbon footprint:', error);
    res.status(500).json({ error: 'Failed to fetch carbon footprint' });
  }
});

// GET /api/analytics/recommendations - Recomendações de otimização
router.get('/recommendations', async (req, res) => {
  try {
    const { datacenter_id } = req.query;
    
    // Identificar ativos com baixa eficiência
    const inefficientAssetsQuery = `
      SELECT 
        a.id,
        a.name,
        at.name as asset_type,
        em.energy_efficiency_percent,
        em.power_usage_efficiency_percent,
        em.carbon_intensity,
        em.temperature_celsius,
        dc.name as datacenter_name
      FROM assets a
      JOIN asset_types at ON a.asset_type_id = at.id
      JOIN datacenters dc ON a.datacenter_id = dc.id
      JOIN energy_measurements em ON a.id = em.asset_id
      WHERE em.measurement_date = (
        SELECT MAX(measurement_date) 
        FROM energy_measurements 
        WHERE asset_id = a.id
      )
    `;
    
    const params = [];
    let paramIndex = 1;
    
    if (datacenter_id) {
      inefficientAssetsQuery += ` AND a.datacenter_id = $${paramIndex++}`;
      params.push(datacenter_id);
    }
    
    inefficientAssetsQuery += ` AND (em.energy_efficiency_percent < 60 OR em.power_usage_efficiency_percent < 70)`;
    
    const inefficientAssets = await req.db.query(inefficientAssetsQuery, params);
    
    // Gerar recomendações baseadas nos dados
    const recommendations = [];
    
    inefficientAssets.rows.forEach(asset => {
      if (asset.energy_efficiency_percent < 60) {
        recommendations.push({
          type: 'efficiency',
          priority: 'high',
          asset_id: asset.id,
          asset_name: asset.name,
          message: `Ativo ${asset.name} com baixa eficiência energética (${asset.energy_efficiency_percent}%). Considere upgrade ou otimização.`,
          suggestion: 'Verificar configurações de power management, considerar hardware mais eficiente'
        });
      }
      
      if (asset.power_usage_efficiency_percent < 70) {
        recommendations.push({
          type: 'pue',
          priority: 'medium',
          asset_id: asset.id,
          asset_name: asset.name,
          message: `PUE ineficiente detectado para ${asset.name} (${asset.power_usage_efficiency_percent}%).`,
          suggestion: 'Otimizar sistemas de refrigeração e distribuição de energia'
        });
      }
      
      if (asset.temperature_celsius > 25) {
        recommendations.push({
          type: 'temperature',
          priority: 'medium',
          asset_id: asset.id,
          asset_name: asset.name,
          message: `Temperatura elevada detectada: ${asset.temperature_celsius}°C`,
          suggestion: 'Verificar fluxo de ar e sistemas de refrigeração'
        });
      }
    });
    
    // Ordenar por prioridade
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    recommendations.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]);
    
    res.json({
      recommendations: recommendations.slice(0, 20), // Limitar a 20 recomendações
      summary: {
        total: recommendations.length,
        high_priority: recommendations.filter(r => r.priority === 'high').length,
        medium_priority: recommendations.filter(r => r.priority === 'medium').length,
        low_priority: recommendations.filter(r => r.priority === 'low').length
      }
    });
  } catch (error) {
    console.error('Error generating recommendations:', error);
    res.status(500).json({ error: 'Failed to generate recommendations' });
  }
});

module.exports = router;
