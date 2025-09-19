# Wordful Deployment Checklist

Before deploying your application to Wordful, please ensure you complete the following checklist items:

## Backend Configuration Check

- [x] `app.yaml` correctly configured (runtime, instance type, environment variables)
- [x] `Dockerfile` correctly configured (build steps, health checks)
- [x] `.env.production` file contains correct environment variables
- [x] CORS settings allow Wordful domain (`https://wordful.app`)
- [ ] MongoDB Atlas connection configured and tested
- [ ] JWT and session secrets set with strong passwords
- [ ] Rate limiting configuration suitable for production environment
- [ ] Run `npm run setup:wordful` to verify environment configuration

## Google Cloud Setup Check

- [ ] Google Cloud project has been created
- [ ] App Engine service has been enabled
- [ ] Necessary APIs have been enabled (Cloud Build, Secret Manager, etc.)
- [ ] Service account permissions correctly configured
- [ ] Run `npm run setup:secrets` to set up secret management
- [ ] Secrets have been set in Secret Manager

## Deployment Process Check

- [ ] CI/CD process configured (optional)
- [ ] Deployment commands tested
- [ ] Confirm Secret Manager reference syntax is correct (`${sm://secret-name}`)
- [ ] Run `npm run deploy:wordful` to deploy the application
- [ ] Rollback strategy defined
- [ ] Zero-downtime deployment configured

## Security Check

- [ ] All API endpoints are protected with appropriate authentication
- [ ] Sensitive data is encrypted
- [ ] No hardcoded keys or credentials
- [ ] Dependencies updated to latest secure versions
- [ ] Helmet security headers correctly configured

## Performance Check

- [ ] Application has undergone load testing
- [ ] Database queries are optimized
- [ ] Static resources are optimized
- [ ] Caching strategies implemented

## Monitoring and Logging Check

- [ ] Logging is configured
- [ ] Error monitoring is set up
- [ ] Performance monitoring is configured
- [ ] Alerts are set up

## Post-Deployment Check

- [ ] Application is accessible via public URL
- [ ] Run `npm run test:wordful [deploymentURL]` to test configuration
- [ ] API endpoints are working properly
- [ ] WebSocket connections are working properly
- [ ] User authentication flow is working
- [ ] All major features are working properly

After completing all the checklist items above, your application should be ready to run stably on Wordful.