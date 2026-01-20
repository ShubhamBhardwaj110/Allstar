/**
 * Database Connection Test Script (JavaScript)
 * This file tests if your MongoDB connection is working properly
 */

require('dotenv').config();
const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI || '';

async function testDatabaseConnection() {
  console.log('🔍 Starting Database Connection Test...\n');

  // Check 1: Verify MONGO_URI is set
  console.log('✅ Check 1: Environment Variable');
  if (!MONGO_URI) {
    console.error('❌ MONGO_URI not found in environment variables');
    console.log('   Make sure you have a .env.local file with MONGO_URI defined\n');
    return false;
  }
  console.log('✅ MONGO_URI is set');
  console.log(`   Value: ${MONGO_URI.substring(0, 50)}...\n`);

  // Check 2: Attempt connection
  console.log('✅ Check 2: Connecting to MongoDB');
  try {
    const conn = await mongoose.connect(MONGO_URI, {
      bufferCommands: false,
    });

    console.log('✅ Successfully connected to MongoDB!\n');

    // Check 3: Verify connection details
    console.log('✅ Check 3: Connection Details');
    console.log(`   Host: ${conn.connection.host}`);
    console.log(`   Port: ${conn.connection.port}`);
    console.log(`   Database: ${conn.connection.db?.databaseName || 'N/A'}`);
    console.log(`   Ready State: ${conn.connection.readyState === 1 ? 'Connected ✅' : 'Not Connected ❌'}\n`);

    // Check 4: Test a simple operation
    console.log('✅ Check 4: Testing Simple Operation');
    const collections = await conn.connection.db?.listCollections().toArray();
    console.log(`   Collections found: ${collections?.length || 0}`);
    if (collections && collections.length > 0) {
      console.log(`   Collections: ${collections.map((c) => c.name).join(', ')}`);
    }
    console.log();

    // Disconnect
    await mongoose.disconnect();
    console.log('✅ Test completed successfully! Your database is working.\n');
    console.log('🎉 All tests passed!\n');
    return true;
  } catch (error) {
    console.error('❌ Connection Failed!');
    if (error instanceof Error) {
      console.error(`   Error: ${error.message}\n`);
    }
    return false;
  }
}

// Run the test
testDatabaseConnection().then((success) => {
  process.exit(success ? 0 : 1);
});
