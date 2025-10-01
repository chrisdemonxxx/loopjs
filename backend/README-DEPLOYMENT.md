# Wordful Deployment Guide

## Overview

This document provides a comprehensive guide to deploying the Wordful application. It serves as an index to the various deployment-related documents and scripts available in this repository.

## Quick Start

For a complete automated deployment experience, use the comprehensive deployment script:

```bash
npm run deploy:wordful:complete
```

This script will:
1. Verify all prerequisites are met
2. Set up necessary environment variables and secrets
3. Validate configurations
4. Deploy the application to Google App Engine
5. Verify the deployment

## Deployment Documentation

### Core Documentation

- [**WORDFUL_DEPLOYMENT.md**](./WORDFUL_DEPLOYMENT.md) - Detailed step-by-step deployment instructions
- [**DEPLOYMENT_CHECKLIST.md**](./DEPLOYMENT_CHECKLIST.md) - Pre-deployment and post-deployment checklist
- [**VERIFICATION_GUIDE.md**](./VERIFICATION_GUIDE.md) - How to verify your deployment is working correctly
- [**MONITORING_GUIDE.md**](./MONITORING_GUIDE.md) - Setting up monitoring and logging for your deployment

### Configuration Files

- `app.yaml` - Google App Engine configuration
- `.env.production` - Production environment variables template

## Deployment Scripts

| Script | Description | Usage |
|--------|-------------|-------|
| `deploy-wordful-complete.js` | Comprehensive deployment script | `npm run deploy:wordful:complete` |
| `deploy-wordful.js` | Basic deployment preparation | `npm run deploy:wordful` |
| `setup-secrets.js` | Set up environment secrets | `npm run setup:secrets` |
| `test-wordful-config.js` | Test configuration | `npm run test:wordful` |

## Deployment Process

### 1. Prerequisites

Before deploying, ensure you have:

- Google Cloud SDK installed and configured
- MongoDB Atlas account set up
- Node.js and npm installed
- Required API keys and secrets

See [WORDFUL_DEPLOYMENT.md](./WORDFUL_DEPLOYMENT.md) for detailed prerequisites.

### 2. Configuration

Set up your configuration files:

- Copy `.env.example` to `.env.production`
- Update the values in `.env.production`
- Review and update `app.yaml` if needed

### 3. Deployment

Choose one of the following deployment methods:

#### Option 1: Comprehensive Deployment (Recommended)

```bash
npm run deploy:wordful:complete
```

#### Option 2: Step-by-Step Deployment

```bash
# Set up secrets
npm run setup:secrets

# Test configuration
npm run test:wordful

# Deploy
npm run deploy:wordful
```

### 4. Verification

After deployment, verify that everything is working correctly using the steps in [VERIFICATION_GUIDE.md](./VERIFICATION_GUIDE.md).

### 5. Monitoring

Set up monitoring and logging as described in [MONITORING_GUIDE.md](./MONITORING_GUIDE.md).

## Troubleshooting

If you encounter issues during deployment:

1. Check the deployment logs:
   ```bash
   gcloud app logs read
   ```

2. Verify your Google Cloud project configuration:
   ```bash
   gcloud config list
   ```

3. Ensure all required APIs are enabled:
   ```bash
   gcloud services list
   ```

4. Verify environment variables and secrets are correctly set

5. Check MongoDB connection string and credentials

For more detailed troubleshooting steps, refer to the "Troubleshooting" section in [WORDFUL_DEPLOYMENT.md](./WORDFUL_DEPLOYMENT.md).

## Security Notes

- Regularly rotate API keys and secrets
- Monitor for unusual access patterns
- Keep dependencies updated
- Never commit sensitive information to the repository

## Additional Resources

- [Google App Engine Documentation](https://cloud.google.com/appengine/docs)
- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/)
- [Node.js Deployment Best Practices](https://nodejs.org/en/docs/guides/nodejs-docker-webapp/)