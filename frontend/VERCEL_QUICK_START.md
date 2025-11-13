# Vercel Quick Start - LoopJS Frontend

## 30-Second Deployment

### Using Vercel Dashboard (Easiest)

1. Push code to GitHub
2. Go to [vercel.com](https://vercel.com) → Import Project
3. Select repository: `loopjs`
4. Set root directory: `frontend`
5. Add environment variables:
   - `VITE_API_URL`: `https://your-backend-url.com`
   - `VITE_WS_URL`: `wss://your-backend-url.com/ws`
6. Click "Deploy"

### Using Vercel CLI (For Developers)

```bash
# Install CLI
npm install -g vercel

# Login
vercel login

# Deploy
cd /home/user/loopjs/frontend
vercel --prod

# Set environment variables
vercel env add VITE_API_URL production
vercel env add VITE_WS_URL production

# Redeploy with env vars
vercel --prod
```

---

## Required Environment Variables

| Variable | Example Value | Description |
|----------|---------------|-------------|
| `VITE_API_URL` | `https://backend.render.com` | Backend REST API URL |
| `VITE_WS_URL` | `wss://backend.render.com/ws` | WebSocket connection URL |

---

## Post-Deployment Testing

### 1. Check Health

```javascript
// Open browser console (F12) on your deployed site
fetch(import.meta.env.VITE_API_URL + '/health')
  .then(r => r.json())
  .then(d => console.log('✅ Backend:', d))
  .catch(e => console.error('❌ Error:', e));
```

### 2. Test WebSocket

```javascript
const ws = new WebSocket(import.meta.env.VITE_WS_URL);
ws.onopen = () => console.log('✅ WebSocket connected');
ws.onerror = (e) => console.error('❌ WebSocket error:', e);
```

### 3. Check CORS

Open browser console and look for:
- ✅ No CORS errors
- ✅ API requests succeeding
- ❌ "blocked by CORS policy" = Backend needs to allow your Vercel URL

---

## Common Issues

### Build Fails
```bash
# Test locally first
cd /home/user/loopjs/frontend
npm run build
```

### Environment Variables Not Working
- Must start with `VITE_`
- Redeploy after adding variables
- Check: `console.log(import.meta.env.VITE_API_URL)`

### CORS Errors
Your backend already allows `*.vercel.app` domains (line 50-53 in `backend/index.js`)
If issues persist, check backend logs for CORS messages.

### 404 on Page Refresh
Already fixed in `vercel.json` with rewrites configuration.

---

## Project Status

✅ **vercel.json**: Configured
✅ **Build**: Succeeds (7.04s)
✅ **Git**: All committed
✅ **Output**: 467.32 kB bundle
✅ **CORS**: Backend ready for Vercel

---

## Useful Commands

```bash
# View deployments
vercel ls

# View logs
vercel logs

# Rollback to previous deployment
vercel rollback

# Open project dashboard
vercel --open
```

---

For detailed instructions, see: [VERCEL_DEPLOYMENT_GUIDE.md](./VERCEL_DEPLOYMENT_GUIDE.md)
