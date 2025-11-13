const { Sequelize } = require('sequelize');

// Database configuration
const config = {
    development: {
        url: process.env.DATABASE_URL || process.env.POSTGRES_URI || 'postgresql://localhost:5432/loopjs',
        dialect: 'postgres',
        logging: console.log,
        pool: {
            max: 5,
            min: 0,
            acquire: 30000,
            idle: 10000
        }
    },
    production: {
        url: process.env.DATABASE_URL || process.env.POSTGRES_URI,
        dialect: 'postgres',
        logging: false,
        pool: {
            max: 10,
            min: 2,
            acquire: 60000,
            idle: 10000
        },
        dialectOptions: {
            ssl: {
                require: true,
                rejectUnauthorized: false
            }
        }
    }
};

const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

// Initialize Sequelize
const sequelize = new Sequelize(dbConfig.url, {
    dialect: dbConfig.dialect,
    logging: dbConfig.logging,
    pool: dbConfig.pool,
    dialectOptions: dbConfig.dialectOptions || {},
    define: {
        timestamps: true,
        underscored: false,
        freezeTableName: true
    }
});

// Test connection with retry logic
async function connectDB(retries = 5) {
    for (let i = 0; i < retries; i++) {
        try {
            await sequelize.authenticate();
            console.log('✅ PostgreSQL connection established successfully');

            // Sync models in development
            if (env === 'development') {
                await sequelize.sync({ alter: true });
                console.log('✅ Database models synchronized');
            } else {
                // In production, just sync without altering
                await sequelize.sync();
                console.log('✅ Database models loaded');
            }

            return sequelize;
        } catch (error) {
            console.error(`❌ PostgreSQL connection attempt ${i + 1}/${retries} failed:`, error.message);

            if (i < retries - 1) {
                const delay = Math.min(1000 * Math.pow(2, i), 30000);
                console.log(`⏳ Retrying in ${delay/1000} seconds...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            } else {
                console.error('❌ Failed to connect to PostgreSQL after all retries');
                throw error;
            }
        }
    }
}

module.exports = { sequelize, connectDB };
