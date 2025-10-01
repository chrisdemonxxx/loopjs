# Environment Configuration for LoopJS Backend

## MongoDB Configuration Options

### Option 1: Local MongoDB (Recommended for Development)
```bash
# Install MongoDB locally or use Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest

# Then set in your .env file:
MONGODB_URI=mongodb://localhost:27017/loopjs-dev
```

### Option 2: MongoDB Atlas (Cloud)
```bash
# 1. Go to https://cloud.mongodb.com/
# 2. Create a free cluster
# 3. Add your IP address to the whitelist (0.0.0.0/0 for development)
# 4. Get connection string and set in .env:
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority
```

### Option 3: Run Without Database (Current Fallback)
The application is already configured to run without MongoDB. It will show:
- "MongoDB connection failed" warning
- "Continuing to run without a database connection"

## Required Environment Variables

Create a `.env` file in the backend directory with:

```env
# Server Configuration
PORT=8080
NODE_ENV=development

# Database (optional)
MONGODB_URI=mongodb://localhost:27017/loopjs-dev

# JWT Configuration
JWT_SECRET=dev-secret-key-change-in-production
JWT_EXPIRES_IN=7d

# Security Configuration
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## Quick Fix for MongoDB Atlas IP Whitelist

1. Go to MongoDB Atlas dashboard
2. Click "Network Access" in the left sidebar
3. Click "Add IP Address"
4. Either:
   - Add your current IP address
   - Or add `0.0.0.0/0` for development (NOT recommended for production)
5. Wait 2-3 minutes for changes to propagate
6. Restart your application

