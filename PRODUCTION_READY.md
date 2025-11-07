# Production Readiness Guide

## Overview
This document outlines all the fixes and improvements made to make LoopJS production-ready with Hugging Face inference, VL LM backup, and Gemini API integration.

## Security Fixes

### 1. Rate Limiting
- **Fixed**: Rate limiting now properly enabled in production
- **Location**: `backend/middleware/security.js`
- **Change**: Removed production bypass, rate limiting now active in production

### 2. Hardcoded Credentials
- **Fixed**: Hardcoded admin credentials only work in development
- **Location**: `backend/routes/index.js`
- **Change**: Production mode requires database connection, no fallback credentials

### 3. JWT Secret Fallback
- **Fixed**: JWT secret fallback only works in development
- **Location**: `backend/index.js`
- **Change**: Production mode throws error if JWT_SECRET not set

### 4. CORS Configuration
- **Fixed**: Requests with no origin blocked in production
- **Location**: `backend/index.js`
- **Change**: Production requires origin header for security

## AI Integration

### 1. Unified AI Service
- **New Service**: `backend/services/unifiedAIService.js`
- **Features**:
  - Primary: Gemini API
  - Backup: VL LM (Vision Language Model)
  - Special: Hugging Face for Point Generation
  - Automatic fallback between providers
  - Configurable provider selection

### 2. VL LM Service
- **New Service**: `backend/services/vlLMService.js`
- **Features**:
  - Fast backup LLM using Hugging Face
  - Vision-Language model support
  - Error handling and retry logic
  - Configurable model selection

### 3. Hugging Face Service
- **New Service**: `backend/services/huggingFaceService.js`
- **Features**:
  - Point Generator functionality
  - Coordinate/point generation
  - JSON response parsing
  - Error handling

### 4. Point Generator
- **Endpoint**: `POST /api/ai/generate-points`
- **Usage**: Generate coordinates/points based on natural language prompts
- **Provider**: Hugging Face inference

## API Routes

### Updated Routes (`backend/routes/ai.js`)
- **POST /api/ai/process-command**: Uses unified AI service
- **POST /api/ai/handle-error**: Uses unified AI service with fallback
- **GET /api/ai/status**: Returns status of all providers
- **POST /api/ai/config**: Supports multiple API keys (Gemini, Hugging Face, VL LM)
- **POST /api/ai/config/update**: Update AI configuration
- **POST /api/ai/generate-points**: Point Generator endpoint

## WebSocket Integration

### WebSocket Handler Updates (`backend/configs/ws.handler.js`)
- **simple_command**: Now uses unified AI service
- **Error retry**: Uses unified AI service for error handling
- **Fallback**: Automatic fallback to VL LM if Gemini fails

## Settings Model

### Updated Fields (`backend/models/Settings.js`)
- `aiPrimaryProvider`: Primary AI provider (gemini/vllm)
- `aiUseVLLMAsBackup`: Enable VL LM as backup
- `vllmTrained`: Flag to indicate VL LM training status
- `huggingfaceApiKey`: Hugging Face API key
- `vllmApiKey`: VL LM API key

## Frontend Updates

### AI Service (`frontend/src/services/aiService.ts`)
- Added `generatePoints()` method
- Added `getStatus()` method for multi-provider status
- Added `updateConfig()` method for configuration updates

## Environment Variables

### Required for Production
```bash
# Database
MONGODB_URI=mongodb://your-mongodb-uri

# Security
JWT_SECRET=your-secure-jwt-secret
SESSION_SECRET=your-secure-session-secret

# AI Providers (at least one required)
GEMINI_API_KEY=your-gemini-api-key
HUGGINGFACE_API_KEY=your-huggingface-api-key
VLLM_API_KEY=your-vllm-api-key  # Optional, can use HUGGINGFACE_API_KEY

# Configuration
NODE_ENV=production
LOG_LEVEL=INFO
```

### Optional Configuration
```bash
# AI Provider Selection
AI_PRIMARY_PROVIDER=gemini  # or 'vllm'
AI_USE_VLLM_BACKUP=true
VLLM_TRAINED=false  # Set to true when VL LM is trained

# Model Selection
VLLM_MODEL=microsoft/git-base
HF_POINT_GENERATOR_MODEL=mistralai/Mistral-7B-Instruct-v0.2
```

## Deployment Checklist

### Pre-Deployment
- [ ] Set all required environment variables
- [ ] Configure MongoDB connection
- [ ] Set secure JWT_SECRET and SESSION_SECRET
- [ ] Configure at least one AI provider API key
- [ ] Review CORS allowed origins
- [ ] Enable rate limiting (set BYPASS_RATE_LIMIT=false)

### Post-Deployment
- [ ] Verify health check endpoint: `/health`
- [ ] Test AI status endpoint: `/api/ai/status`
- [ ] Verify WebSocket connections work
- [ ] Test Point Generator: `/api/ai/generate-points`
- [ ] Monitor logs for errors
- [ ] Verify rate limiting is active

## Usage Guide

### Using Gemini as Primary
1. Set `GEMINI_API_KEY` environment variable
2. Set `AI_PRIMARY_PROVIDER=gemini`
3. Set `AI_USE_VLLM_BACKUP=true` for fallback

### Using VL LM as Primary (After Training)
1. Set `HUGGINGFACE_API_KEY` or `VLLM_API_KEY`
2. Set `VLLM_TRAINED=true`
3. Set `AI_PRIMARY_PROVIDER=vllm`
4. System will automatically use VL LM as primary

### Point Generation
```javascript
// Example API call
POST /api/ai/generate-points
{
  "prompt": "Generate 10 points in a circle",
  "context": {
    "radius": 100,
    "center": { "x": 0, "y": 0 }
  }
}
```

## Monitoring

### Log Levels
- `ERROR`: Critical errors only
- `WARN`: Warnings and errors
- `INFO`: General information (production default)
- `DEBUG`: Detailed debugging (development)

### Structured Logging
All logs are now structured JSON format:
```json
{
  "timestamp": "2024-01-01T00:00:00.000Z",
  "level": "INFO",
  "message": "Server started",
  "environment": "production",
  "pid": 12345
}
```

## Migration Notes

### From Previous Version
1. Update environment variables (see `.env.example`)
2. Update API calls if using direct Gemini service
3. Update frontend to use new AI service methods
4. Review Settings model changes

### VL LM Training
When VL LM is trained and ready:
1. Set `VLLM_TRAINED=true`
2. System will automatically switch to VL LM as primary
3. Gemini will be used as fallback

## Troubleshooting

### AI Not Working
1. Check API keys are set: `GET /api/ai/status`
2. Verify provider availability
3. Check logs for errors
4. Test individual providers

### Point Generator Not Working
1. Verify `HUGGINGFACE_API_KEY` is set
2. Check Hugging Face service status
3. Review model configuration
4. Check API rate limits

### WebSocket Issues
1. Verify CORS configuration
2. Check authentication tokens
3. Review WebSocket handler logs
4. Verify client connections

## Support

For issues or questions:
1. Check logs with `LOG_LEVEL=DEBUG`
2. Review API status endpoints
3. Verify environment configuration
4. Check provider API status
