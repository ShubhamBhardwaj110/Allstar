import mongoose from 'mongoose';

const MONGO_URI = process.env.MONGO_URI || '';

declare global {
    var mongooseCache: {
        conn: typeof mongoose | null;
        promise: Promise<typeof mongoose> | null;
    }
}

let cached = global.mongooseCache;

if (!cached) {
    cached = global.mongooseCache = { conn: null, promise: null };
}

export const connectToDatabase = async () => {
    if (!MONGO_URI) throw new Error('Please define the MONGO_URI environment variable inside .env.local');
    if (cached.conn) {
        return cached.conn;
    }
    if (!cached.promise) {
        cached.promise = mongoose.connect(MONGO_URI, { bufferCommands: false });
    }
    try {
        cached.conn = await cached.promise;
    } catch (e) {
        cached.promise = null;
        throw e;
    }
    console.log(`Connected to database${process.env.NODE_ENV} - ${MONGO_URI}`);
}
