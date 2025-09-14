# LoopJS C2 Server Deployment Guide

This guide will help you deploy the LoopJS C2 server and web panel to Google Cloud Run using Google Cloud Shell.

## Prerequisites

1. **Google Cloud Project**: You need an active Google Cloud project with billing enabled
2. **Google Cloud Shell**: Access to Google Cloud Shell (available in the Google Cloud Console)
3. **Repository Access**: Your code should be in a Git repository (GitHub, GitLab, etc.)

## Quick Deployment

### Step 1: Open Google Cloud Shell

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click the Cloud Shell icon in the top-right corner
3. Wait for the shell to initialize

### Step 2: Clone Your Repository

```bash
# Clone your repository
git clone https://github.com/chrisdemonxxx/loopjs.git
cd loopjs
```

### Step 3: Set Your Project ID

```bash
# Set your Google Cloud project ID
gcloud config set project YOUR_PROJECT_ID

# Verify the project is set correctly
gcloud config get-value project
```

### Step 4: Configure Environment Variables

1. Update the `backend/.env` file with your production values:

```bash
# Edit the environment file
nano backend/.env
```

2. Make sure to set secure values for:
   - `MONGO_URI`: Your MongoDB connection string
   - `JWT_SECRET`: A strong JWT secret key
   - `SESSION_SECRET`: A strong session secret key

### Step 5: Run the Deployment Script

```bash
# Make the script executable
chmod +x deploy-to-gcp.sh

# Run the deployment
./deploy-to-gcp.sh
```

## Manual Deployment Steps

If you prefer to deploy manually or need more control:

### 1. Enable Required APIs

```bash
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable containerregistry.googleapis.com
gcloud services enable secretmanager.googleapis.com
```

### 2. Create Secrets

```bash
# Create secrets for sensitive environment variables
echo "your_mongo_uri_here" | gcloud secrets create MONGO_URI --data-file=-
echo "your_jwt_secret_here" | gcloud secrets create JWT_SECRET --data-file=-
echo "your_session_secret_here" | gcloud secrets create SESSION_SECRET --data-file=-
```

### 3. Deploy Backend Service

```bash
cd backend
gcloud builds submit --config=cloudbuild.yaml
cd ..
```

### 4. Deploy Frontend Service

```bash
cd frontend
gcloud builds submit --config=cloudbuild.yaml
cd ..
```

### 5. Get Service URLs

```bash
# Get backend URL
gcloud run services describe loopjs-backend --region=us-central1 --format='value(status.url)'

# Get frontend URL
gcloud run services describe loopjs-frontend --region=us-central1 --format='value(status.url)'
```

## Configuration Details

### Backend Configuration

- **Service Name**: `loopjs-backend`
- **Port**: 3000
- **Memory**: 1Gi
- **CPU**: 1
- **Max Instances**: 10
- **Region**: us-central1

### Frontend Configuration

- **Service Name**: `loopjs-frontend`
- **Port**: 80
- **Memory**: 512Mi
- **CPU**: 1
- **Max Instances**: 5
- **Region**: us-central1

## Environment Variables

### Backend Environment Variables

- `NODE_ENV`: Set to `production`
- `MONGO_URI`: MongoDB connection string (stored as secret)
- `JWT_SECRET`: JWT signing secret (stored as secret)
- `SESSION_SECRET`: Session signing secret (stored as secret)
- `PORT`: Automatically set to 3000

### Frontend Environment Variables

- `VITE_BACKEND_URL`: Automatically set to the backend service URL

## Security Considerations

1. **Secrets Management**: All sensitive data is stored in Google Secret Manager
2. **HTTPS**: All services are automatically served over HTTPS
3. **Authentication**: The backend includes JWT-based authentication
4. **CORS**: Configure CORS settings in the backend for your domain

## Monitoring and Logging

### View Logs

```bash
# Backend logs
gcloud logs tail --service=loopjs-backend

# Frontend logs
gcloud logs tail --service=loopjs-frontend
```

### Monitor Performance

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to Cloud Run
3. Click on your service to view metrics and logs

## Updating Your Deployment

### Update Backend

```bash
cd backend
gcloud builds submit --config=cloudbuild.yaml
cd ..
```

### Update Frontend

```bash
cd frontend
gcloud builds submit --config=cloudbuild.yaml
cd ..
```

## Troubleshooting

### Common Issues

1. **Build Failures**:
   - Check that all dependencies are properly listed in `package.json`
   - Verify Docker files are correct
   - Check build logs: `gcloud builds log [BUILD_ID]`

2. **Service Not Starting**:
   - Check service logs: `gcloud logs tail --service=[SERVICE_NAME]`
   - Verify environment variables and secrets
   - Check port configuration

3. **Connection Issues**:
   - Verify the frontend is using the correct backend URL
   - Check CORS configuration in the backend
   - Ensure services are in the same region

### Getting Help

```bash
# View service details
gcloud run services describe [SERVICE_NAME] --region=us-central1

# View recent logs
gcloud logs read --service=[SERVICE_NAME] --limit=50

# Check service status
gcloud run services list
```

## Cost Optimization

1. **Auto-scaling**: Services automatically scale to zero when not in use
2. **Resource Limits**: Configured with appropriate CPU and memory limits
3. **Regional Deployment**: Deployed in a single region to minimize costs

## Next Steps

After deployment:

1. **Configure DNS**: Point your domain to the Cloud Run services
2. **Set up Monitoring**: Configure alerts and monitoring
3. **Backup Strategy**: Implement database backup procedures
4. **CI/CD Pipeline**: Set up automated deployments from your Git repository

## Support

For issues with this deployment:

1. Check the troubleshooting section above
2. Review Google Cloud Run documentation
3. Check the application logs for specific error messages

---

**Note**: This deployment configuration is optimized for production use with proper security, scaling, and monitoring considerations.