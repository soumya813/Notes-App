const express = require('express');
const router = express.Router();
const { checkDatabaseHealth } = require('../config/db');
const { getConfig } = require('../config/config');

/**
 * GET /health
 * Application health check endpoint
 */
router.get('/health', async (req, res) => {
    try {
        const config = getConfig();
        const dbHealth = checkDatabaseHealth();
        
        const healthStatus = {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            version: process.env.npm_package_version || '1.0.0',
            environment: config.NODE_ENV,
            uptime: process.uptime(),
            database: {
                connected: dbHealth.connected,
                readyState: dbHealth.readyState,
                host: dbHealth.host,
                name: dbHealth.name
            },
            memory: {
                used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
                total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + ' MB'
            }
        };

        // Check if database is connected
        if (!dbHealth.connected) {
            healthStatus.status = 'unhealthy';
            healthStatus.issues = ['Database not connected'];
        }

        const statusCode = healthStatus.status === 'healthy' ? 200 : 503;
        res.status(statusCode).json(healthStatus);
        
    } catch (error) {
        console.error('Health check error:', error);
        res.status(503).json({
            status: 'error',
            timestamp: new Date().toISOString(),
            message: 'Health check failed',
            error: error.message
        });
    }
});

/**
 * GET /health/ready
 * Readiness probe for deployment environments
 */
router.get('/health/ready', (req, res) => {
    const dbHealth = checkDatabaseHealth();
    
    if (dbHealth.connected) {
        res.status(200).json({
            status: 'ready',
            timestamp: new Date().toISOString()
        });
    } else {
        res.status(503).json({
            status: 'not ready',
            timestamp: new Date().toISOString(),
            reason: 'Database not connected'
        });
    }
});

/**
 * GET /health/live
 * Liveness probe for deployment environments
 */
router.get('/health/live', (req, res) => {
    res.status(200).json({
        status: 'alive',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

module.exports = router;
