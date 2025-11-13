# Vercel Deployment - Step by Step

## Prerequisites
- [ ] Backend URL from Render (from previous step)
- [ ] Vercel account (create at https://vercel.com if needed)

## Step 1: Import Project to Vercel

1. Go to: https://vercel.com/new
2. Click "Import Git Repository"
3. If not connected, click "Connect GitHub Account"
4. Search for: `loopjs`
5. Click "Import" next to your loopjs repository

## Step 2: Configure Project

**Framework Preset:**
- Vercel should auto-detect: `Vite`

**Root Directory:**
- Click "Edit" next to Root Directory
- Enter: `frontend`
- Click "Continue"

**Build Settings:**
- Build Command: `npm run build` (auto-detected)
- Output Directory: `build` (auto-detected)
- Install Command: `npm install` (auto-detected)

## Step 3: Add Environment Variables

Click "Environment Variables" section

### Add Variable 1:
- Key: `VITE_API_URL`
- Value: Your Render backend URL (from previous step)
  ```
  https://your-backend.onrender.com
  ```
  ⚠️ **NO TRAILING SLASH!**
  ⚠️ **NO /api at the end!** (the service adds it automatically)

### Add Variable 2:
- Key: `VITE_WS_URL`
- Value: Your Render WebSocket URL (same as backend but with wss://)
  ```
  wss://your-backend.onrender.com/ws
  ```

**Select Environment:** All (Production, Preview, Development)

## Step 4: Deploy

1. Review configuration
2. Click "Deploy"
3. Wait 2-3 minutes for build to complete

## Step 5: Watch Build Process

Look for these in logs:
```
✅ Installing dependencies...
✅ Running build command...
✅ Build completed in ~7s
✅ Deployment complete!
```

## Step 6: Save Your Frontend URL

After deployment, you'll see:
```
https://your-app-XXXX.vercel.app
```

**COPY THIS URL!**

## Step 7: Update Backend CORS

Now we need to allow your frontend URL in the backend:

1. Go back to: https://dashboard.render.com
2. Select your "loopjs-backend" service
3. Click "Environment" tab
4. Find `ALLOWED_ORIGINS` variable
5. Click "Edit"
6. Update value to include your Vercel URL:
   ```
   https://your-app.vercel.app
   ```
7. Click "Save Changes"
8. Wait ~1 minute for redeploy

## Step 8: Test Frontend

1. Open your Vercel URL: `https://your-app.vercel.app`
2. Press F12 to open DevTools → Console
3. Check for errors:
   - ✅ No CORS errors
   - ✅ No 404 errors
   - ✅ Environment variables loaded

4. Try to login/register:
   - Create a test account
   - Verify authentication works

---

✅ Frontend deployed!
Next: Final Testing
