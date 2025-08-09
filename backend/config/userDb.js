// config/userDb.js
const { MongoClient } = require('mongodb');

const userDbConnections = new Map();

async function connectUserDb(dbUrl, dbName, jwtToken) {
  if (userDbConnections.has(jwtToken)) {
    return userDbConnections.get(jwtToken);
  }

  const client = new MongoClient(dbUrl, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });

  await client.connect();
  console.log(`✅ Connected to User DB: ${dbName}`);

  const db = client.db(dbName);
  userDbConnections.set(jwtToken, db);
  return db;
}

function getUserDb(jwtToken) {
  return userDbConnections.get(jwtToken);
}

function disconnectUserDb(jwtToken) {
  if (userDbConnections.has(jwtToken)) {
    const db = userDbConnections.get(jwtToken);
    db.client?.close?.();
    userDbConnections.delete(jwtToken);
  }
}

module.exports = { connectUserDb, getUserDb, disconnectUserDb };
