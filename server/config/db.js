const mongoose = require('mongoose');
mongoose.set('strictQuery', false);

const connectDB = async () => {
    try {
        const mongoUri = process.env.MONGODB_URI;
        if (!mongoUri) {
            throw new Error('MONGODB_URI not set in environment variables');
        }
        await mongoose.connect(mongoUri);
        if (process.env.NODE_ENV !== 'test') {
            console.log(`Database Connected: ${mongoose.connection.host}`);
        }
    } catch (error) {
        console.error('MongoDB connection error:', error);
        process.exit(1);
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
    });
    process.on('SIGINT', async () => {
        await mongoose.connection.close();
        console.log('Mongoose connection closed due to app termination');
        process.exit(0);
    });
}

module.exports = connectDB;