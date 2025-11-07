# AI Integration Guide

## Overview

LoopJS now includes a comprehensive AI integration system with multiple LLM providers and intelligent fallback mechanisms. The system supports:

1. **Google Gemini** - Primary LLM for command processing
2. **VL LM (Vision Language Model)** - Fast backup LLM via Hugging Face
3. **Hugging Face Point Generator** - Generates structured command execution points

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│              Unified AI Service                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │   Gemini     │  │    VL LM     │  │ Hugging Face  │ │
│  │  (Primary)   │  │  (Backup)    │  │Point Generator│ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
│         │                 │                  │            │
│         └─────────────────┴──────────────────┘            │
│                           │                                │
│                    Fallback Logic                          │
└───────────────────────────────────────────────────────────┘
```

## Configuration

### Environment Variables

Add these to your `.env` file or set them in your deployment environment:

```bash
# Google Gemini API Key (Required for primary LLM)
GEMINI_API_KEY=your-gemini-api-key-here

# Hugging Face API Key (Required for VL LM and Point Generator)
HUGGINGFACE_API_KEY=your-huggingface-api-key-here

# VL LM Configuration (Optional)
VLLM_MODEL_NAME=microsoft/DialoGPT-large
VLLM_TRAINED=false  # Set to true after training to switch to VL LM as primary

# Hugging Face Point Generator Model (Optional)
HF_POINT_GENERATOR_MODEL=gpt2
HF_MODEL_NAME=microsoft/DialoGPT-medium
```

### Getting API Keys

1. **Gemini API Key**:
   - Visit https://makersuite.google.com/app/apikey
   - Create a new API key
   - Copy and set as `GEMINI_API_KEY`

2. **Hugging Face API Key**:
   - Visit https://huggingface.co/settings/tokens
   - Create a new access token
   - Copy and set as `HUGGINGFACE_API_KEY`

## Usage

### Fallback Logic

The system uses intelligent fallback:

1. **Primary Provider**: Gemini (or VL LM if trained)
2. **Backup Provider**: VL LM (or Gemini if VL LM is primary)
3. **Fallback**: Simple rule-based command generation

### API Endpoints

#### Process Command
```bash
POST /api/ai/process-command
Content-Type: application/json
Authorization: Bearer <token>

{
  "userInput": "download and install putty",
  "clientInfo": {
    "uuid": "client-uuid",
    "platform": "windows",
    "systemInfo": {}
  },
  "context": {}
}
```

#### Generate Points (Point Generator)
```bash
POST /api/ai/generate-points
Content-Type: application/json
Authorization: Bearer <token>

{
  "userInput": "install chrome browser",
  "clientInfo": {
    "uuid": "client-uuid",
    "platform": "windows"
  },
  "context": {}
}
```

#### Get AI Status
```bash
GET /api/ai/status
Authorization: Bearer <token>
```

#### Switch to VL LM (Admin Only)
```bash
POST /api/ai/switch-to-vllm
Authorization: Bearer <token>
```

#### Test All Services
```bash
POST /api/ai/test-all
Authorization: Bearer <token>
```

## Training VL LM

After training your VL LM model:

1. Set `VLLM_TRAINED=true` in environment variables
2. Or call `/api/ai/switch-to-vllm` endpoint (admin only)
3. The system will automatically switch to VL LM as primary provider

## Point Generator

The Hugging Face Point Generator converts natural language requests into structured command execution points:

**Input**: "Download and install Chrome browser"

**Output**:
```json
{
  "points": [
    {
      "step": 1,
      "action": "Download Chrome installer",
      "command": "Invoke-WebRequest -Uri 'https://...' -OutFile '$env:TEMP\\chrome.exe'",
      "type": "powershell"
    },
    {
      "step": 2,
      "action": "Execute installer",
      "command": "Start-Process -FilePath '$env:TEMP\\chrome.exe'",
      "type": "powershell"
    }
  ],
  "explanation": "Download Chrome from official source and execute installer"
}
```

## WebSocket Integration

The WebSocket handler automatically uses the Unified AI Service for:

- `simple_command` messages from admin clients
- Error retry logic for failed AI-processed commands
- Command optimization

## Frontend Integration

The frontend `aiService.ts` includes methods for:

- `processNaturalLanguage()` - Process natural language commands
- `generatePoints()` - Generate execution points
- `handleError()` - Handle command errors with AI
- `optimizeCommand()` - Optimize commands
- `getStatistics()` - Get AI statistics
- `getCommandTemplates()` - Get command templates
- `switchToVLLM()` - Switch to VL LM (admin)
- `testAllServices()` - Test all AI services

## Production Deployment

### Google Cloud Run

Set environment variables in Cloud Run:

```bash
gcloud run services update loopjs-backend \
  --set-env-vars GEMINI_API_KEY=your-key \
  --set-env-vars HUGGINGFACE_API_KEY=your-key \
  --region us-central1
```

### Docker

Add to your Dockerfile or docker-compose.yml:

```yaml
environment:
  - GEMINI_API_KEY=${GEMINI_API_KEY}
  - HUGGINGFACE_API_KEY=${HUGGINGFACE_API_KEY}
  - VLLM_TRAINED=false
```

## Monitoring

Check AI service status:

```bash
curl -H "Authorization: Bearer <token>" \
  https://loopjs-backend-361659024403.us-central1.run.app/api/ai/status
```

## Troubleshooting

### Gemini Not Working
- Check `GEMINI_API_KEY` is set correctly
- Verify API key is valid at https://makersuite.google.com/app/apikey
- Check logs for specific error messages

### VL LM Not Working
- Check `HUGGINGFACE_API_KEY` is set correctly
- Verify model name is correct
- Check Hugging Face API status

### Point Generator Not Working
- Ensure `HUGGINGFACE_API_KEY` is set
- Verify model name in `HF_POINT_GENERATOR_MODEL`
- Check Hugging Face API rate limits

### Fallback Always Used
- Check all API keys are configured
- Verify network connectivity to APIs
- Check logs for specific error messages

## Security Notes

- Never commit API keys to version control
- Use environment variables or secret management systems
- Rotate API keys regularly
- Monitor API usage for unexpected activity

## Cost Considerations

- **Gemini**: Free tier available, pay-per-use after
- **Hugging Face**: Free tier available, pay-per-use after
- Monitor usage through respective dashboards

## Support

For issues or questions:
1. Check logs: `backend/logs/` or Cloud Run logs
2. Test endpoints: Use `/api/ai/test-all` to diagnose
3. Check status: Use `/api/ai/status` to see provider availability
