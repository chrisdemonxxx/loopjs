# MongoDB Atlas Quick Setup Guide

## Step 1: Create Account
1. Go to: https://www.mongodb.com/cloud/atlas/register
2. Sign up with Google/GitHub or email
3. Choose FREE tier

## Step 2: Create Cluster
1. Click "Build a Database"
2. Select "FREE" (M0 Sandbox)
3. Choose AWS / Oregon region
4. Click "Create"

## Step 3: Create Database User
1. Choose "Username and Password"
2. Username: `loopjs-admin`
3. Click "Autogenerate Secure Password" → **COPY AND SAVE THIS PASSWORD**
4. Click "Create User"

## Step 4: Allow Network Access
1. Click "Add IP Address"
2. Select "Allow Access from Anywhere" (0.0.0.0/0)
3. Click "Confirm"

## Step 5: Get Connection String
1. Click "Connect" on your cluster
2. Select "Drivers"
3. Copy the connection string (looks like):
   ```
   mongodb+srv://loopjs-admin:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
4. Replace `<password>` with your actual password from Step 3
5. Add database name before the `?`:
   ```
   mongodb+srv://loopjs-admin:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/loopjs?retryWrites=true&w=majority
   ```

**SAVE THIS CONNECTION STRING - YOU'LL NEED IT IN 2 MINUTES!**

---

Time: 5 minutes
Next: Deploy to Render
