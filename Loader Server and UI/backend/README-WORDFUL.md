# Wordful Deployment Guide

This document provides a complete guide for deploying applications to the Wordful platform.

## Quick Start

### Prerequisites

- Google Cloud SDK installed and configured
- MongoDB Atlas account
- Node.js and npm installed

### Deployment Steps

1. **Set up Google Cloud Project**
   ```bash
   # Create or select a project
   gcloud config set project [YOUR_PROJECT_ID]
   
   # Enable necessary APIs
   gcloud services enable appengine.googleapis.com secretmanager.googleapis.com
   ```

2. **Set up Secrets**
   ```bash
   npm run setup:secrets
   ```
   Follow the prompts to enter MongoDB password, session secret, and JWT secret.

3. **Verify Configuration**
   ```bash
   npm run setup:wordful
   ```
   Ensure all configuration checks pass.

4. **Deploy Application**
   ```bash
   npm run deploy:wordful
   ```

5. **Verify Deployment**
   - Access the deployed URL
   - Test API endpoints
   - Verify WebSocket connections

## File Descriptions

- `app.yaml` - Google App Engine configuration file
- `.env.production` - Production environment variables configuration
- `deploy-wordful.js` - Pre-deployment validation script
- `setup-secrets.js` - Secret management script
- `WORDFUL_DEPLOYMENT.md` - Detailed deployment documentation
- `DEPLOYMENT_CHECKLIST.md` - Deployment checklist

## Script Descriptions

- `npm run setup:secrets` - Set up secrets in Google Cloud Secret Manager
- `npm run setup:wordful` - Verify deployment configuration
- `npm run deploy:wordful` - Run pre-deployment checks and deploy the application
- `npm run test:wordful [deploymentURL]` - Test the configuration of the deployed application

## Troubleshooting

If you encounter deployment issues, check:

1. Google Cloud project configuration
2. Secret Manager key settings
3. MongoDB Atlas connection string
4. App Engine service account permissions

## Monitoring and Logging

After deployment, you can monitor the application through:

1. App Engine dashboard in Google Cloud Console
2. Cloud Logging to view application logs
3. Cloud Monitoring to set up alerts

## Security Considerations

- Rotate keys regularly
- Monitor unusual access patterns
- Keep dependencies updated
- Review service account permissions periodically