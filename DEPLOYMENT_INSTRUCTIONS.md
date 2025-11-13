# LoopJS Deployment Instructions

## ✅ Migration Complete: MongoDB → PostgreSQL

Your backend has been successfully migrated from MongoDB to PostgreSQL with Sequelize ORM.

---

## 🚀 Deploy Backend to Render

### Database (Already Created)
Your PostgreSQL database is already provisioned:
- **Name**: loopjs
- **ID**: dpg-d4b5olnpm1nc739kfgng-a
- **Connection String**:
  ```
  postgresql://loopjs_user:CnXurlpfmxzUsztQI8gVcJhVuU8zrDq5@dpg-d4b5olnpm1nc739kfgng-a.oregon-postgres.render.com:5432/loopjs
  ```

### Create Web Service

1. **Go to Render Dashboard**
   - Visit: https://dashboard.render.com

2. **Create New Web Service**
   - Click "New +" → "Web Service"
   - Select your GitHub repository: `chrisdemonxxx/loopjs`
   - Branch: `claude/frontend-ui-rebuild-01XAcyr1NCQ3VamfXgARfpg9`

3. **Configure Service**
   ```
   Name: loopjs-backend
   Root Directory: backend
   Runtime: Node
   Region: Oregon
   Branch: claude/frontend-ui-rebuild-01XAcyr1NCQ3VamfXgARfpg9
   Build Command: npm ci --production=false
   Start Command: npm start
   Plan: Free
   ```

4. **Set Environment Variables**
   Add these in the "Environment" section:

   ```
   NODE_ENV=production
   PORT=10000
   DATABASE_URL=postgresql://loopjs_user:CnXurlpfmxzUsztQI8gVcJhVuU8zrDq5@dpg-d4b5olnpm1nc739kfgng-a.oregon-postgres.render.com:5432/loopjs
   JWT_ACCESS_TOKEN_EXPIRATION=15m
   JWT_REFRESH_TOKEN_EXPIRATION=24h
   LOG_LEVEL=info
   RATE_LIMIT_WINDOW_MS=900000
   RATE_LIMIT_MAX_REQUESTS=100
   WS_HEARTBEAT_INTERVAL=30000
   WS_CONNECTION_TIMEOUT=60000
   ```

   **Auto-generate these** (click "Generate" button):
   ```
   JWT_SECRET
   SESSION_SECRET
   ```

   **Add after frontend deployed**:
   ```
   ALLOWED_ORIGINS=https://your-app.vercel.app
   ```

5. **Advanced Settings**
   - Health Check Path: `/health`
   - Auto-Deploy: `Yes`

6. **Click "Create Web Service"**

7. **Wait for deployment** (~3-5 minutes)

8. **Save your backend URL**:
   - Example: `https://loopjs-backend.onrender.com`
   - Test it: `https://loopjs-backend.onrender.com/health`

---

## 🎨 Deploy Frontend to Vercel

### Option 1: Vercel Dashboard (Recommended)

1. **Go to Vercel**
   - Visit: https://vercel.com/new

2. **Import Repository**
   - Click "Import Project"
   - Select: `chrisdemonxxx/loopjs`
   - Branch: `claude/frontend-ui-rebuild-01XAcyr1NCQ3VamfXgARfpg9`

3. **Configure Project**
   ```
   Project Name: loopjs-frontend
   Framework Preset: React
   Root Directory: frontend
   Build Command: npm run build
   Output Directory: build
   Install Command: npm install
   ```

4. **Environment Variables**
   Add these before deploying:
   ```
   VITE_API_URL=https://your-backend.onrender.com
   VITE_WS_URL=wss://your-backend.onrender.com/ws
   VITE_APP_ENV=production
   VITE_DEBUG=false
   ```
   *(Replace `your-backend.onrender.com` with your actual Render backend URL)*

5. **Click "Deploy"**

6. **Wait for deployment** (~2-3 minutes)

7. **Save your frontend URL**:
   - Example: `https://loopjs-frontend.vercel.app`

### Option 2: Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
cd /mnt/projects/loopjs/frontend
vercel --prod

# Set environment variables in Vercel dashboard
# Then redeploy:
vercel --prod
```

---

## 🔧 Post-Deployment Configuration

### 1. Update Backend CORS

Go back to your Render backend service:
1. Navigate to "Environment" tab
2. Add/Update `ALLOWED_ORIGINS` with your Vercel URL:
   ```
   ALLOWED_ORIGINS=https://your-app.vercel.app
   ```
3. Save and wait for auto-redeploy

### 2. Test Backend Health

```bash
curl https://your-backend.onrender.com/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2025-11-13T...",
  "uptime": 123.45,
  "port": 10000,
  "initialized": true
}
```

### 3. Test Frontend

1. Open your Vercel URL in browser
2. Open DevTools (F12) → Console
3. Check for:
   - ✅ No CORS errors
   - ✅ Successful API connection
   - ✅ WebSocket connected

Test API connection:
```javascript
fetch(import.meta.env.VITE_API_URL + '/health')
  .then(r => r.json())
  .then(d => console.log('✅ Backend:', d))
  .catch(e => console.error('❌ Error:', e));
```

### 4. Create Admin User

```bash
curl -X POST https://your-backend.onrender.com/api/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "SecurePass123!",
    "email": "admin@example.com",
    "role": "admin"
  }'
```

---

## 📊 What Changed: MongoDB → PostgreSQL

### Models Migrated
✅ User
✅ Client
✅ Task
✅ RefreshToken
✅ Settings
✅ AgentBuild
✅ AgentTemplate
✅ AuditLog
✅ CommandPattern

### Technical Changes
- **ORM**: Mongoose → Sequelize
- **Database**: MongoDB → PostgreSQL 17
- **IDs**: MongoDB ObjectId → PostgreSQL UUID
- **Embedded Docs**: Mongoose subdocs → JSONB columns
- **Indexes**: MongoDB indexes → PostgreSQL B-tree indexes
- **Relationships**: Virtual populate → Sequelize associations

### Benefits
- ✅ ACID compliance
- ✅ Better query performance with indexes
- ✅ Strong data integrity
- ✅ Free PostgreSQL on Render
- ✅ Standard SQL support
- ✅ JSONB for flexible data

---

## 🧪 Testing Checklist

### Backend Tests
- [ ] Health endpoint returns 200
- [ ] PostgreSQL connection successful
- [ ] Tables created automatically
- [ ] JWT authentication works
- [ ] WebSocket connects

### Frontend Tests
- [ ] Frontend loads without errors
- [ ] Can access login page
- [ ] CORS working (no console errors)
- [ ] API calls successful
- [ ] WebSocket connection established
- [ ] Dashboard displays correctly

### Integration Tests
- [ ] User registration works
- [ ] User login works
- [ ] JWT refresh token works
- [ ] Client connections work
- [ ] Task creation works
- [ ] Real-time updates via WebSocket

---

## 🚨 Troubleshooting

### Backend Won't Start
1. Check Render logs for errors
2. Verify DATABASE_URL is set correctly
3. Ensure all required env vars are set
4. Check PostgreSQL database is "available"

### Frontend Can't Connect
1. Verify VITE_API_URL is set correctly
2. Check CORS settings in backend
3. Ensure ALLOWED_ORIGINS includes Vercel URL
4. Check browser console for errors

### Database Connection Errors
1. Verify connection string format
2. Check database status in Render dashboard
3. Ensure database is in same region as service
4. Review database logs

### WebSocket Not Connecting
1. Verify VITE_WS_URL uses `wss://` not `ws://`
2. Check backend WebSocket server initialized
3. Verify firewall/proxy settings
4. Test with WebSocket client tool

---

## 📈 Next Steps

1. **Monitor Deployment**
   - Check Render dashboard for build status
   - Monitor logs for errors
   - Verify health endpoint

2. **Set Up Custom Domain** (Optional)
   - Configure in Vercel dashboard
   - Update backend ALLOWED_ORIGINS

3. **Enable Analytics**
   - Vercel Analytics
   - Render Metrics

4. **Performance Optimization**
   - Enable caching
   - Optimize database queries
   - Add CDN for static assets

5. **Security Hardening**
   - Rotate secrets regularly
   - Enable rate limiting
   - Review CORS settings
   - Set up monitoring alerts

---

## 📞 Support Resources

- **Render Docs**: https://render.com/docs
- **Vercel Docs**: https://vercel.com/docs
- **Sequelize Docs**: https://sequelize.org/docs
- **PostgreSQL Docs**: https://www.postgresql.org/docs/

---

## ✨ Summary

**PostgreSQL Migration**: ✅ Complete
**Code Changes**: ✅ Committed & Pushed
**Database**: ✅ Created on Render
**Backend**: ⏳ Ready to deploy (manual step)
**Frontend**: ⏳ Ready to deploy (manual step)

**Your backend connection string is**:
```
postgresql://loopjs_user:CnXurlpfmxzUsztQI8gVcJhVuU8zrDq5@dpg-d4b5olnpm1nc739kfgng-a.oregon-postgres.render.com:5432/loopjs
```

**Follow the deployment steps above to get your app live!** 🚀
