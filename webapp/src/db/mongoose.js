import mongoose from 'mongoose';
import '../models/Room';
import '../models/User';

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  throw new Error('Please define the MONGO_URI environment variable inside .env.local');
}

// Using a global variable to store the cache.
if (!global._mongoConnCache) {
  global._mongoConnCache = { conn: null, promise: null };
}

const cached = global._mongoConnCache;

async function connectDB() {
  if (cached.conn) {
    console.log("Using existing database connection");
    return cached.conn;
  }

  const uri = global.__MONGO_URI__ || MONGO_URI;  // optionally use mock databaase

  if (!cached.promise) {
    const opts = {
      // useNewUrlParser: true,
      // useUnifiedTopology: true,
      bufferCommands: false, // Disable mongoose buffering
    };

    cached.promise = mongoose.connect(uri, opts).then((mongoose) => {
      console.log("New database connection established");
      return mongoose;
    }).catch(err => {
      console.log("Database connection error:", err);
      throw err;  // Ensure errors are not silently swallowed
    });
  }
  
  cached.conn = await cached.promise;
  return cached.conn;
}

export default connectDB;
