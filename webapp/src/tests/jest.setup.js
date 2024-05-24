if (typeof global.TextEncoder === 'undefined') {
  global.TextEncoder = require('util').TextEncoder;
}
if (typeof global.TextDecoder === 'undefined') {
  global.TextDecoder = require('util').TextDecoder;
}

global.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import dotenv from 'dotenv';


dotenv.config();

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();

  global.__MONGO_URI__ = mongoUri;
  
  await mongoose.connect(mongoUri, {
    // useNewUrlParser: true,
    // useUnifiedTopology: true
  });
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      if (collections.hasOwnProperty(key)) {
        const collection = collections[key];
        await collection.deleteMany();
      }
    }
});
