# Wordful Monitoring and Logging Guide

This guide provides instructions for setting up monitoring and logging for your Wordful application deployed on Google Cloud Platform.

## Monitoring Setup

### Google Cloud Monitoring

1. **Access Cloud Monitoring**
   - Navigate to the [Google Cloud Console](https://console.cloud.google.com/)
   - Select your project
   - Go to **Monitoring** > **Overview**

2. **Set Up Dashboards**
   - Create a custom dashboard for your Wordful application
   - Add widgets for:
     - App Engine instance count
     - Request latency
     - Error rates
     - Memory and CPU usage

3. **Configure Uptime Checks**
   - Go to **Monitoring** > **Uptime Checks**
   - Click **Create Uptime Check**
   - Configure checks for critical endpoints:
     - API health endpoint (`/api/health`)
     - Main application URL
   - Set check frequency (recommended: 1 minute)

4. **Set Up Alerts**
   - Go to **Monitoring** > **Alerting**
   - Create alert policies for:
     - High error rates (>1%)
     - Excessive latency (>500ms)
     - Instance count changes
     - Failed uptime checks
   - Configure notification channels (email, SMS, Slack, etc.)

## Logging Configuration

### Cloud Logging

1. **Access Cloud Logging**
   - Navigate to **Logging** > **Logs Explorer** in Google Cloud Console

2. **Create Log-Based Metrics**
   - Go to **Logging** > **Logs-based Metrics**
   - Create custom metrics for:
     - Authentication failures
     - API errors by endpoint
     - WebSocket connection issues

3. **Set Up Log Exports**
   - Configure log exports to BigQuery for long-term analysis
   - Set up log exports to Cloud Storage for archival

4. **Create Log Views**
   - Create saved views for common debugging scenarios:
     - Error logs only
     - Authentication events
     - High latency requests

## Application-Level Logging

### Best Practices

1. **Structured Logging**
   - Use structured JSON logging format
   - Include consistent fields:
     - `timestamp`
     - `level` (info, warn, error)
     - `message`
     - `requestId`
     - `userId` (when available)
     - `path`
     - `method`

2. **Log Levels**
   - Use appropriate log levels:
     - `error`: Application errors requiring immediate attention
     - `warn`: Potential issues or unexpected behavior
     - `info`: Normal but significant events
     - `debug`: Detailed debugging information (development only)

3. **Sensitive Information**
   - Never log sensitive information such as:
     - Passwords
     - Authentication tokens
     - Personal identifiable information (PII)
     - Credit card numbers

## Performance Monitoring

### Google Cloud APM

1. **Enable Cloud Trace**
   - Go to **Trace** > **Overview**
   - View request latency and performance data

2. **Analyze Performance**
   - Identify slow endpoints
   - Track performance over time
   - Set up latency alerts

## Incident Response

### Handling Alerts

1. **Create an Incident Response Plan**
   - Define severity levels
   - Establish escalation procedures
   - Document common resolution steps

2. **Incident Documentation**
   - Record all incidents
   - Document root causes
   - Track resolution steps
   - Implement preventive measures

## Regular Maintenance

1. **Review Logs Weekly**
   - Look for patterns in errors
   - Identify potential performance issues

2. **Update Alert Thresholds**
   - Adjust based on application performance
   - Remove unnecessary alerts
   - Add new alerts as needed

3. **Test Alert Notifications**
   - Verify alert delivery
   - Ensure on-call rotation is working

## Useful Commands

### Viewing Logs

```bash
# View recent App Engine logs
gcloud app logs read

# View logs with filtering
gcloud logging read "resource.type=gae_app AND severity>=ERROR" --project=YOUR_PROJECT_ID --limit=10

# Export logs to a file
gcloud logging read "resource.type=gae_app" --project=YOUR_PROJECT_ID --format=json > app_logs.json
```

### Monitoring Commands

```bash
# List uptime check configurations
gcloud monitoring uptime-check configs list

# List alert policies
gcloud monitoring policies list

# Describe a specific alert policy
gcloud monitoring policies describe POLICY_ID
```

## Additional Resources

- [Google Cloud Monitoring Documentation](https://cloud.google.com/monitoring/docs)
- [Google Cloud Logging Documentation](https://cloud.google.com/logging/docs)
- [App Engine Monitoring Best Practices](https://cloud.google.com/appengine/docs/standard/monitoring)