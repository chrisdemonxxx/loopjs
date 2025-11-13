# 🔐 Create Admin User

## Current Status

✅ **MongoDB configured in Render** - Backend will redeploy in 2-3 minutes

---

## Option 1: Login Now (Development Mode)

**While waiting for database connection**, you can login with:

```
Username: admin
Password: admin123
```

This uses development mode (no database persistence).

---

## Option 2: Create Real Admin User (After Redeploy)

**Wait 3 minutes** for Render to redeploy, then run:

```bash
curl -X POST https://loopjs-backend-s3ja.onrender.com/api/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "email": "admin@loopjs.local",
    "password": "YourSecurePassword123!",
    "role": "admin"
  }'
```

Replace `YourSecurePassword123!` with your desired password.

**Then login** at https://loopjs-xi.vercel.app with your new credentials!

---

## Verify Database Connection

After Render redeploys (3 minutes), test:

```bash
curl -X POST https://loopjs-backend-s3ja.onrender.com/api/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

**If database is connected:**
- You'll get: `{"error":"Invalid username or password"}`
- ✅ This means database is working! (admin user doesn't exist yet)

**If still development mode:**
- You'll get a successful login with `"message":"Logged in (development mode)"`
- ⏳ Wait a bit longer for redeploy

---

## Create Your Own Admin

### Using curl:

```bash
curl -X POST https://loopjs-backend-s3ja.onrender.com/api/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "yourusername",
    "email": "your@email.com",
    "password": "SecurePassword123!",
    "role": "admin"
  }'
```

### Using JavaScript:

```javascript
const response = await fetch('https://loopjs-backend-s3ja.onrender.com/api/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    username: 'yourusername',
    email: 'your@email.com',
    password: 'SecurePassword123!',
    role: 'admin'
  })
});

const result = await response.json();
console.log(result);
```

---

## User Roles

When creating users, you can set different roles:

- `admin` - Full access to all features
- `user` - Standard access
- `viewer` - Read-only access

---

## Security Notes

1. **Change default password**: The development mode password (`admin123`) only works when database is disconnected

2. **Use strong passwords**: Minimum 8 characters recommended

3. **Production best practice**: Create your admin user immediately after database connection, then disable the `/register` endpoint in production

---

## Troubleshooting

### "User already exists"
If you get this error, the user already exists in the database. Try logging in instead.

### "Server error during registration"
- Check database connection
- Verify MongoDB Atlas allows connections from anywhere (0.0.0.0/0)
- Check Render logs for detailed error

### Still in development mode after 5 minutes
1. Check Render dashboard: https://dashboard.render.com
2. Look for deployment status
3. Check logs for database connection errors
4. Verify MONGODB_URI is set correctly

---

## MongoDB Atlas Configuration

If database connection fails, check MongoDB Atlas:

1. Go to: https://cloud.mongodb.com
2. Click "Network Access" in left sidebar
3. Ensure "Allow Access from Anywhere" (0.0.0.0/0) is enabled
4. Or add Render's IP ranges

---

## Quick Test Script

Save this as `test-login.sh`:

```bash
#!/bin/bash

echo "Testing login..."
curl -X POST https://loopjs-backend-s3ja.onrender.com/api/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' \
  2>&1 | grep -q "development mode"

if [ $? -eq 0 ]; then
  echo "❌ Still in development mode"
  echo "⏳ Wait for Render to redeploy"
else
  echo "✅ Database connected!"
  echo "📝 Create your admin user now"
fi
```

---

**Current Status:**
- ✅ Frontend deployed
- ✅ Backend deployed
- ✅ CORS configured
- ✅ MongoDB Atlas ready
- ⏳ Waiting for backend redeploy (2-3 min)

**Next:** Create your admin user after redeploy completes!
