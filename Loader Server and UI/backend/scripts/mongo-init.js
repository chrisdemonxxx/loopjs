// MongoDB initialization script for Docker
// This script runs when the MongoDB container starts for the first time

// Switch to the loopjs database
db = db.getSiblingDB('loopjs');

// Create application user with read/write permissions
db.createUser({
  user: 'loopjs_user',
  pwd: process.env.MONGO_APP_PASSWORD || 'defaultpassword',
  roles: [
    {
      role: 'readWrite',
      db: 'loopjs'
    }
  ]
});

// Create collections with validation schemas
db.createCollection('users', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['username', 'email', 'password'],
      properties: {
        username: {
          bsonType: 'string',
          minLength: 3,
          maxLength: 50
        },
        email: {
          bsonType: 'string',
          pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        },
        password: {
          bsonType: 'string',
          minLength: 60 // bcrypt hash length
        },
        createdAt: {
          bsonType: 'date'
        },
        updatedAt: {
          bsonType: 'date'
        }
      }
    }
  }
});

db.createCollection('clients', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['clientId', 'type', 'status'],
      properties: {
        clientId: {
          bsonType: 'string'
        },
        type: {
          bsonType: 'string',
          enum: ['web', 'stealth']
        },
        status: {
          bsonType: 'string',
          enum: ['connected', 'disconnected', 'error']
        },
        capabilities: {
          bsonType: 'object'
        },
        lastSeen: {
          bsonType: 'date'
        },
        createdAt: {
          bsonType: 'date'
        }
      }
    }
  }
});

db.createCollection('tasks', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['clientId', 'command', 'status'],
      properties: {
        clientId: {
          bsonType: 'string'
        },
        command: {
          bsonType: 'string'
        },
        parameters: {
          bsonType: 'object'
        },
        status: {
          bsonType: 'string',
          enum: ['pending', 'executing', 'completed', 'failed']
        },
        result: {
          bsonType: 'string'
        },
        createdAt: {
          bsonType: 'date'
        },
        completedAt: {
          bsonType: 'date'
        }
      }
    }
  }
});

// Create indexes for better performance
db.users.createIndex({ 'username': 1 }, { unique: true });
db.users.createIndex({ 'email': 1 }, { unique: true });
db.clients.createIndex({ 'clientId': 1 }, { unique: true });
db.clients.createIndex({ 'type': 1 });
db.clients.createIndex({ 'status': 1 });
db.tasks.createIndex({ 'clientId': 1 });
db.tasks.createIndex({ 'status': 1 });
db.tasks.createIndex({ 'createdAt': 1 });

print('MongoDB initialization completed successfully');