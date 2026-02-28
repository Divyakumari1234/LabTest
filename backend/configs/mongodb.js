import mongoose from 'mongoose';

const connectDB = async () => {
    try {
        if (!process.env.MONGODB_URI) {
            throw new Error('MONGODB_URI is not defined');
        }

        
        mongoose.connection.on('connected', () => {
            console.log('Database connected successfully');
        });
        
        mongoose.connection.on('error', (err) => {
            console.error('Database connection error:', err);
        });
        
       

        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
    } catch (error) {
        console.error('Failed to connect to database:', error.message);
        throw error; 
    }
};

export default connectDB;