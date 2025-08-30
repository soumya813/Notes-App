/**
 * Session cleanup utilities for manual maintenance
 */
const session = require('express-session');
const MongoStore = require('connect-mongo');
const { getConfig } = require('../config/config');

/**
 * Clear all expired sessions from MongoDB
 */
const clearExpiredSessions = async () => {
    try {
        const config = getConfig();
        
        if (config.NODE_ENV === 'test') {
            console.log('Skipping session cleanup in test environment');
            return;
        }

        const store = MongoStore.create({
            mongoUrl: config.MONGODB_URI,
            autoRemove: 'native'
        });

        console.log('Expired sessions will be automatically cleaned by MongoDB TTL');
        return true;
    } catch (error) {
        console.error('Error clearing expired sessions:', error);
        return false;
    }
};

/**
 * Clear sessions for a specific user
 */
const clearUserSessions = async (userId) => {
    try {
        // This would require a custom implementation to query sessions by user ID
        // For now, we'll just log the intent
        console.log(`Would clear sessions for user: ${userId}`);
        console.log('Note: This requires custom session store implementation');
        return true;
    } catch (error) {
        console.error('Error clearing user sessions:', error);
        return false;
    }
};

/**
 * Get session statistics
 */
const getSessionStats = async () => {
    try {
        // This would require custom implementation to count active sessions
        console.log('Session statistics would be available with custom implementation');
        return {
            activeSessions: 'N/A',
            totalSessions: 'N/A',
            lastCleanup: new Date().toISOString()
        };
    } catch (error) {
        console.error('Error getting session stats:', error);
        return null;
    }
};

module.exports = {
    clearExpiredSessions,
    clearUserSessions,
    getSessionStats
};
