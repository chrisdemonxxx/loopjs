# Wordful Deployment Verification Guide

This guide provides step-by-step instructions for verifying your Wordful application deployment is working correctly.

## Automated Verification

The Wordful deployment includes an automated verification script that checks the most critical aspects of your deployment.

```bash
# Run the verification script against your deployed URL
npm run test:wordful https://your-app-url.appspot.com
```

This script checks:
- Backend API availability
- CORS configuration
- WebSocket connectivity

## Manual Verification Steps

### 1. Backend API Verification

#### Health Check Endpoint

```bash
curl https://your-app-url.appspot.com/api/health
```

Expected response:
```json
{"status":"ok"}
```

#### API Endpoints

Test a public API endpoint:
```bash
curl https://your-app-url.appspot.com/api/info
```

The response should contain application information without errors.

### 2. CORS Configuration

Test CORS headers using a browser or a tool like curl:

```bash
curl -X OPTIONS -H "Origin: https://wordful.app" \
  -H "Access-Control-Request-Method: GET" \
  -H "Access-Control-Request-Headers: Content-Type" \
  https://your-app-url.appspot.com/api/info -v
```

Verify that the response includes:
- `Access-Control-Allow-Origin: https://wordful.app`
- `Access-Control-Allow-Methods` with the requested method
- `Access-Control-Allow-Headers` with the requested headers

### 3. WebSocket Connection

Test WebSocket connectivity using a tool like wscat:

```bash
# Install wscat if not already installed
npm install -g wscat

# Connect to the WebSocket endpoint
wscat -c wss://your-app-url.appspot.com/ws
```

You should be able to establish a connection without errors.

### 4. Authentication Flow

Test the authentication endpoints:

1. **Registration** (if applicable):
```bash
curl -X POST -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"TestPassword123"}' \
  https://your-app-url.appspot.com/api/auth/register
```

2. **Login**:
```bash
curl -X POST -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"TestPassword123"}' \
  https://your-app-url.appspot.com/api/auth/login
```

The response should include a JWT token.

3. **Protected Endpoint** (using the token from login):
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://your-app-url.appspot.com/api/protected-resource
```

### 5. Database Connectivity

Verify database operations through API endpoints that perform database operations.

### 6. Frontend Integration

1. Open your frontend application
2. Ensure it can connect to the backend API
3. Test authentication flow through the UI
4. Verify WebSocket-based features work correctly

## Performance Verification

### 1. Response Time

Check API response times:

```bash
time curl https://your-app-url.appspot.com/api/info
```

Response times should typically be under 200ms for simple endpoints.

### 2. Load Testing

For production deployments, consider running a basic load test:

```bash
# Using Apache Bench (ab) for a simple load test
ab -n 100 -c 10 https://your-app-url.appspot.com/api/health
```

## Logging and Monitoring Verification

### 1. Check Application Logs

```bash
# View recent logs
gcloud app logs read --service=default
```

Verify that logs are being generated correctly and don't contain unexpected errors.

### 2. Verify Monitoring Setup

1. Go to Google Cloud Console > Monitoring
2. Check that metrics are being collected for your App Engine instance
3. Verify any custom metrics you've set up

## Security Verification

### 1. HTTPS Configuration

Verify that HTTPS is properly configured:

```bash
curl -I https://your-app-url.appspot.com
```

Check for:
- HTTP/2 support
- Proper security headers
- Valid SSL certificate

### 2. Security Headers

Check security headers using a tool like [Security Headers](https://securityheaders.com).

## Troubleshooting Common Issues

### CORS Errors

If you see CORS errors in the browser console:
1. Verify `ALLOWED_ORIGINS` in your environment variables
2. Check that your CORS middleware is correctly configured
3. Ensure the frontend is using the correct backend URL

### WebSocket Connection Failures

If WebSocket connections fail:
1. Check that your App Engine configuration allows WebSocket connections
2. Verify the WebSocket server is running
3. Check for any firewall or proxy issues

### Authentication Issues

If authentication fails:
1. Verify JWT secret is correctly set
2. Check token expiration settings
3. Ensure the client is sending the token correctly

### Database Connection Issues

If database operations fail:
1. Verify MongoDB connection string
2. Check network connectivity to MongoDB Atlas
3. Verify database user permissions

## Next Steps

After successful verification:

1. Set up monitoring and alerts (see MONITORING_GUIDE.md)
2. Configure regular backups for your database
3. Establish a deployment and rollback strategy
4. Document your production environment configuration