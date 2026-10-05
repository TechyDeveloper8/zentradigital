import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/zentra_digital';

export const baseSchemaOptions = {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  toJSON: {
    virtuals: true,
    transform: (doc, ret) => {
      if (ret._id) {
        ret.id = ret._id.toString();
      }
      delete ret.__v;
      return ret;
    }
  },
  toObject: {
    virtuals: true,
    transform: (doc, ret) => {
      if (ret._id) {
        ret.id = ret._id.toString();
      }
      delete ret.__v;
      return ret;
    }
  }
};

let isConnected = false;

export async function connectDB() {
  if (isConnected) return mongoose.connection;

  try {
    const conn = await mongoose.connect(MONGODB_URI, {
      maxPoolSize: 20,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    isConnected = true;
    console.log(`[MongoDB] Connected successfully: ${conn.connection.host}/${conn.connection.name}`);
    return conn.connection;
  } catch (error) {
    console.error(`[MongoDB] Connection error:`, error.message);
    throw error;
  }
}

mongoose.connection.on('disconnected', () => {
  isConnected = false;
  console.warn('[MongoDB] Disconnected from database.');
});

mongoose.connection.on('reconnected', () => {
  isConnected = true;
  console.log('[MongoDB] Reconnected to database.');
});

export default mongoose;
