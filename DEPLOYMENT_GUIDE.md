# LoopJS Production Deployment Guide

## Quick Start

### 1. Environment Variables Setup

Copy `.env.example` to `.env` and configure:

```bash
cd backend
cp .env.example .env
```

**Required Variables:**
```bash
# Server
NODE_ENV=production
PORT=8080

# Security (REQUIRED)
JWT_SECRET=your-very-secure-random-secret-key-min-32-chars
MONGODB_URI=mongodb://your-mongodb-connection-string

# AI Services
GEMINI_API_KEY=your-gemini-api-key
HUGGINGFACE_API_KEY=your-huggingface-api-key
VL_LM_API_KEY=your-huggingface-api-key  # Can be same as HUGGINGFACE_API_KEY

# Optional AI Configuration
VL_LM_MODEL=microsoft/DialoGPT-large
VL_LM_TRAINED=false  # Set to true once VL LM is trained
HF_POINT_GENERATOR_MODEL=microsoft/DialoGPT-medium
```

### 2. Install Dependencies

```bash
cd backend
npm install
```

### 3. Verify Configuration

```bash
# Check if all required env vars are set
node -e "require('dotenv').config(); console.log('JWT_SECRET:', !!process.env.JWT_SECRET); console.log('MONGODB_URI:', !!process.env.MONGODB_URI);"
```

### 4. Start Server

```bash
# Production
npm start

# Development
npm run dev
```

## AI Services Configuration

### Gemini (Primary Initially)
1. Get API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Set `GEMINI_API_KEY` in environment

### Hugging Face (Point Generator & VL LM)
1. Get API key from [Hugging Face](https://huggingface.co/settings/tokens)
2. Set `HUGGINGFACE_API_KEY` and `VL_LM_API_KEY` in environment

### VL LM Training
Once VL LM is trained:
1. Set `VL_LM_TRAINED=true`
2. VL LM will automatically become primary
3. Gemini will be used as backup

## Health Checks

### Backend Health
```bash
curl https://your-backend-url/health
```

### AI Status
```bash
curl https://your-backend-url/api/ai/status
```

### AI Statistics
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://your-backend-url/api/ai/statistics
```

## Testing AI Integration

### Test Command Processing
```bash
curl -X POST https://your-backend-url/api/ai/process-command \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userInput": "show system information",
    "clientInfo": {
      "uuid": "test-client",
      "platform": "windows"
    }
  }'
```

### Test Point Generation
```bash
curl -X POST https://your-backend-url/api/ai/generate-points \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userInput": "download and install chrome",
    "clientInfo": {
      "platform": "windows"
    }
  }'
```

## Production Checklist

- [ ] All environment variables set
- [ ] JWT_SECRET is secure and random (min 32 chars)
- [ ] MONGODB_URI points to production database
- [ ] Rate limiting enabled (BYPASS_RATE_LIMIT=false)
- [ ] CORS configured for production domains
- [ ] AI API keys configured
- [ ] Health endpoint responding
- [ ] WebSocket connections working
- [ ] AI services responding
- [ ] Database connection stable

## Troubleshooting

### AI Not Working
1. Check API keys are set: `echo $GEMINI_API_KEY`
2. Check AI status: `GET /api/ai/status`
3. Check logs for AI errors
4. Verify Hugging Face API key if using Point Generator

### Database Connection Issues
1. Verify MONGODB_URI is correct
2. Check database is accessible
3. Verify network/firewall rules
4. Check connection pool settings

### WebSocket Issues
1. Verify WebSocket URL uses `wss://` in production
2. Check CORS configuration
3. Verify JWT token is valid
4. Check WebSocket path: `/ws`

## Monitoring

### Key Metrics
- AI processing success rate
- Command execution latency
- WebSocket connection count
- Database connection pool usage
- Error rates by AI provider

### Logs to Monitor
- `[GEMINI AI]` - Gemini operations
- `[VL LM]` - VL LM operations
- `[HF POINT GENERATOR]` - Point generation
- `[AI COMMAND]` - WebSocket AI commands
- `[AI ERROR HANDLER]` - Error retries

## Security Notes

1. **Never commit `.env` file**
2. **Use strong JWT_SECRET** (min 32 random characters)
3. **Enable rate limiting in production**
4. **Use HTTPS/WSS in production**
5. **Restrict CORS to known domains**
6. **Keep API keys secure** (use secret management)

## Support

For issues or questions:
1. Check logs: `backend/logs/`
2. Review `PRODUCTION_READY_CHANGES.md`
3. Check AI service status endpoints
4. Verify environment configuration

---

**Last Updated**: $(date)
**Version**: 2.0.0
