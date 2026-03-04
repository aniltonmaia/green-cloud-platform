const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const { Pool } = require('pg');
const assetRoutes = require('./routes/assets');
const organizationRoutes = require('./routes/organizations');
const datacenterRoutes = require('./routes/datacenters');
const analyticsRoutes = require('./routes/analytics');

const app = express();
const PORT = process.env.PORT || 3001;

// Configuração do pool de conexões PostgreSQL
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'green_cloud_db',
  user: process.env.DB_USER || 'greencloud',
  password: process.env.DB_PASSWORD || 'greencloud123',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Middleware
app.use(helmet());
app.use(compression());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // limite de 100 requisições por IP
  message: {
    error: 'Muitas requisições. Tente novamente mais tarde.'
  }
});

app.use(limiter);
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Adicionar pool de conexões ao objeto request
app.use((req, res, next) => {
  req.db = pool;
  next();
});

// Rotas de saúde
app.get('/health', async (req, res) => {
  try {
    const result = await req.db.query('SELECT NOW()');
    res.json({
      status: 'healthy',
      timestamp: result.rows[0].now,
      uptime: process.uptime()
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: error.message
    });
  }
});

// Rotas da API
app.use('/api/assets', assetRoutes);
app.use('/api/organizations', organizationRoutes);
app.use('/api/datacenters', datacenterRoutes);
app.use('/api/analytics', analyticsRoutes);

// Rota de documentação
app.get('/api', (req, res) => {
  res.json({
    name: 'Green Cloud Analytics API',
    version: '1.0.0',
    description: 'API para análise de eficiência energética e carbono em datacenters',
    endpoints: {
      health: '/health',
      assets: '/api/assets',
      organizations: '/api/organizations',
      datacenters: '/api/datacenters',
      analytics: '/api/analytics'
    },
    documentation: 'https://github.com/green-cloud/analytics-docs'
  });
});

// Middleware de tratamento de erros
app.use((error, req, res, next) => {
  console.error('Error:', error);
  
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation Error',
      details: error.details
    });
  }
  
  if (error.code === '23505') { // Unique violation
    return res.status(409).json({
      error: 'Resource already exists',
      message: 'The resource you are trying to create already exists'
    });
  }
  
  if (error.code === '23503') { // Foreign key violation
    return res.status(400).json({
      error: 'Invalid reference',
      message: 'The referenced resource does not exist'
    });
  }
  
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

// Rota não encontrada
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.originalUrl} not found`
  });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  await pool.end();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully');
  await pool.end();
  process.exit(0);
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Green Cloud Backend API running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`📚 API documentation: http://localhost:${PORT}/api`);
});

module.exports = app;
