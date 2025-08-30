const mongoose = require('mongoose');
const { getConfig } = require('./config');

mongoose.set('strictQuery', false);

const connectDB = async () => {
    try {
        const config = getConfig();
        const mongoUri = config.MONGODB_URI;
        
        if (!mongoUri) {
            throw new Error('MONGODB_URI not set in environment variables');
        }

        // Connection options for better reliability
        const options = {
            maxPoolSize: 10, // Maintain up to 10 socket connections
            serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
            socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
            family: 4 // Use IPv4, skip trying IPv6
        };

        await mongoose.connect(mongoUri, options);
        
        if (process.env.NODE_ENV !== 'test') {
            console.log(`Database Connected: ${mongoose.connection.host}`);
        }
    } catch (error) {
        console.error('MongoDB connection error:', error);
        
        // Exit process with failure if not in test environment
        if (process.env.NODE_ENV !== 'test') {
            process.exit(1);
        } else {
            throw error; // Re-throw for tests
        }
    }
};

// Connection event listeners for robustness
if (process.env.NODE_ENV !== 'test') {
    mongoose.connection.on('connected', () => {
        console.log('Mongoose connected to DB');
    });
    
    mongoose.connection.on('error', (err) => {
        console.error('Mongoose connection error:', err);
    });
    
    mongoose.connection.on('disconnected', () => {
        console.warn('Mongoose disconnected from DB');
        
        // Attempt to reconnect after 5 seconds
        setTimeout(() => {
            console.log('Attempting to reconnect to MongoDB...');
            mongoose.connect(process.env.MONGODB_URI);
        }, 5000);
    });
    
    // Graceful shutdown handlers
    process.on('SIGINT', async () => {
        try {
            await mongoose.connection.close();
            console.log('Mongoose connection closed due to app termination (SIGINT)');
            process.exit(0);
        } catch (error) {
            console.error('Error during graceful shutdown:', error);
            process.exit(1);
        }
    });
    
    process.on('SIGTERM', async () => {
        try {
            await mongoose.connection.close();
            console.log('Mongoose connection closed due to app termination (SIGTERM)');
            process.exit(0);
        } catch (error) {
            console.error('Error during graceful shutdown:', error);
            process.exit(1);
        }
    });
}

/**
 * Check database connection health
 */
const checkDatabaseHealth = () => {
    return {
        connected: mongoose.connection.readyState === 1,
        readyState: mongoose.connection.readyState,
        host: mongoose.connection.host,
        name: mongoose.connection.name
    };
};

module.exports = {
    connectDB,
    checkDatabaseHealth
};