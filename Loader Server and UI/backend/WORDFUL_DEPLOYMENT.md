# Wordful Deployment Guide

This document provides detailed steps for deploying applications to Wordful.

## Prerequisites

- Google Cloud Platform account
- Google Cloud SDK installed and configured
- MongoDB Atlas account (for database)

## Deployment Steps

### 1. Backend Deployment

#### Preparation

The backend project has been configured with necessary files:
- `app.yaml` - Google App Engine configuration file
- `Dockerfile` - Containerized deployment configuration
- `cloudbuild.yaml` - Google Cloud Build configuration
- `.env.production` - Production environment variables

#### Setting up Google Cloud Project

1. Create or select a Google Cloud project:
   ```bash
   gcloud projects create [PROJECT_ID]
   # or
   gcloud config set project [PROJECT_ID]
   ```

2. Enable necessary APIs:
   ```bash
   gcloud services enable appengine.googleapis.com secretmanager.googleapis.com
   ```

#### Setting up Environment Variables and Secrets

1. Run the secrets setup script:
   ```bash
   npm run setup:secrets
   ```
   Follow the prompts to enter MongoDB password, session secret, and JWT secret

2. Verify environment configuration:
   ```bash
   npm run setup:wordful
   ```
   Ensure all necessary environment variables are correctly set

3. Confirm that `.env.production` file's `ALLOWED_ORIGINS` includes the Wordful domain:
   - `https://wordful.app` has been added to the list of allowed origins

#### Deploying to Google App Engine

```bash
# Execute in the backend directory
npm run deploy:wordful
```

Or manually execute:

```bash
gcloud app deploy app.yaml --quiet
```

### 2. Frontend Deployment

The frontend is configured for deployment through Vercel, but can also be deployed to Google Cloud Run:

```bash
# Execute in the frontend directory
gcloud builds submit --config cloudbuild.yaml
```

### 3. Verify Deployment

After deployment is complete, verify the following functionality:

- Backend API endpoints are accessible
- WebSocket connections work properly
- Frontend pages load normally and connect to the backend

### 4. Monitoring and Logging

- View application logs in Google Cloud Console
- Set up Cloud Monitoring alerts
- Configure performance monitoring

## Troubleshooting

If you encounter issues, check:

- Environment variables are correctly set
- CORS settings allow the Wordful domain
- WebSocket connections are properly configured
- MongoDB connection is working properly

## Security Considerations

- Ensure all sensitive information is provided through environment variables or secret management systems
- Do not hardcode any keys or credentials in the code
- Ensure API endpoints are protected with appropriate authentication
- Regularly update dependencies to fix security vulnerabilities