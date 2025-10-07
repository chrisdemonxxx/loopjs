# AI Integration Guide for LoopJS C2 Panel

## Overview

The LoopJS C2 Panel supports multiple AI providers for intelligent command processing. This guide covers setup, configuration, and usage of all available AI providers.

## AI Provider Priority

The system automatically selects the best available AI provider in this order:

1. **Ollama** (LOCAL, FREE, FAST) - **HIGHEST PRIORITY**
2. **Hugging Face** (FREE, API-based)
3. **Google Gemini** (FREE tier available)
4. **OpenAI** (PAID, most capable)
5. **Rule-based** (FALLBACK, always available)

## Ollama Integration (Recommended)

### Why Ollama?

- ✅ **FREE** - No API costs
- ✅ **LOCAL** - Complete privacy, no data leaves your system
- ✅ **FAST** - Sub-second response times
- ✅ **RELIABLE** - No rate limits or API downtime
- ✅ **SPECIALIZED** - Multiple models for different tasks

### Setup Instructions

#### 1. Install Ollama

**Windows:**
```bash
# Download from https://ollama.ai/download
# Or use PowerShell:
winget install Ollama.Ollama
```

**Linux/macOS:**
```bash
curl -fsSL https://ollama.ai/install.sh | sh
```

#### 2. Start Ollama Service

**Windows:**
```bash
# Ollama should start automatically
# If not, run:
ollama serve
```

**Linux/macOS:**
```bash
ollama serve
```

#### 3. Install Recommended Models

Based on our testing, install these models in order of priority:

```bash
# Primary model (best overall performance)
ollama pull qwen2.5-coder:1.5b

# Workflow specialist (excellent for complex tasks)
ollama pull kali-specialist:latest

# Security/pentest specialist
ollama pull threat-watch:latest

# Fast model for simple tasks
ollama pull llama3.2:3b

# Balanced model
ollama pull qwen2.5:7b

# Download specialist
ollama pull devops-master:latest
```

#### 4. Verify Installation

```bash
# Check if Ollama is running
curl http://localhost:11434/api/tags

# Should return: {"models":["qwen2.5-coder:1.5b","kali-specialist:latest",...]}
```

### Multi-Model Selection Strategy

The system intelligently selects the best model based on task type, complexity, and performance requirements:

| Task Type | Selected Model | Score | Speed | Reason |
|-----------|----------------|-------|-------|---------|
| **Workflow** | `kali-specialist:latest` | 9.1/10 | 1097ms | Best for complex multi-step tasks |
| **Security/Pentest** | `threat-watch:latest` | 7.7/10 | 922ms | Specialized for security operations |
| **Download** | `devops-master:latest` | 7.7/10 | 586ms | Expert at file operations |
| **Simple** | `llama3.2:3b` | 6.4/10 | **267ms** | Fastest for basic commands |
| **Complex** | `qwen2.5-coder:1.5b` | **7.1/10** | 700ms | Best overall performer |
| **Security Analysis** | `qwen2.5:7b` | 7.3/10 | 2050ms | Good for security analysis |
| **Default** | `qwen2.5-coder:1.5b` | **7.1/10** | 700ms | Balanced performance |

### Intelligent Model Selection Examples

```javascript
// Simple task → llama3.2:3b (267ms)
"list running processes"

// Workflow task → kali-specialist:latest (9.1/10 workflow score)
"download chrome, install it, open it, navigate to google.com"

// Security task → threat-watch:latest (7.7/10 pentest score)
"scan for open ports and vulnerabilities"

// Download task → devops-master:latest (7.7/10 download score)
"download and install the latest version of Firefox"

// Complex task → qwen2.5-coder:1.5b (7.1/10 overall)
"perform comprehensive system audit with detailed reporting"
```

### Configuration

Add these environment variables to customize Ollama:

```bash
# Optional: Custom Ollama API URL (default: http://localhost:11434)
OLLAMA_API_URL=http://localhost:11434

# Optional: Primary model (default: qwen2.5-coder:1.5b)
OLLAMA_PRIMARY_MODEL=qwen2.5-coder:1.5b

# Optional: Timeout in milliseconds (default: 30000)
OLLAMA_TIMEOUT=30000
```

### Testing Ollama Integration

Run the integration test to verify everything works:

```bash
cd backend
node test-ollama-integration.js
```

Expected output:
```
✅ Ollama connection successful
✅ Found X available models
✅ EXCELLENT: All tests passed! Ollama integration is working perfectly.
```

## Other AI Providers

### Hugging Face (Free)

1. Get API key from [huggingface.co](https://huggingface.co/settings/tokens)
2. Set environment variable:
   ```bash
   HUGGINGFACE_API_KEY=your-api-key-here
   ```

### Google Gemini (Free Tier)

1. Get API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Set environment variable:
   ```bash
   GEMINI_API_KEY=your-api-key-here
   ```

### OpenAI (Paid)

1. Get API key from [OpenAI Platform](https://platform.openai.com/api-keys)
2. Set environment variable:
   ```bash
   OPENAI_API_KEY=your-api-key-here
   ```

## API Endpoints

### Test AI Connection

```bash
GET /api/ai/test-connection
```

Response:
```json
{
  "success": true,
  "data": {
    "primaryAI": "ollama",
    "ollama": {
      "available": true,
      "working": true,
      "models": 6,
      "primaryModel": "qwen2.5-coder:1.5b"
    },
    "openAI": { "available": false, "working": false },
    "gemini": { "available": false, "working": false },
    "huggingFace": { "available": false, "working": false }
  }
}
```

### Process Natural Language Command

```bash
POST /api/ai/process-command
Content-Type: application/json

{
  "category": "natural_language",
  "action": "process",
  "params": {
    "userInput": "download chrome from internet, install it, open it"
  },
  "clientInfo": {
    "uuid": "client-001",
    "platform": "Win32NT 10.0.26100.0"
  }
}
```

Response:
```json
{
  "success": true,
  "data": {
    "optimizedCommand": {
      "command": "Write-Host 'Downloading Chrome...'; Invoke-WebRequest -Uri 'https://dl.google.com/chrome/install/latest/chrome_installer.exe' -OutFile 'C:\\temp\\chrome_installer.exe'; Start-Process 'C:\\temp\\chrome_installer.exe' -ArgumentList '/silent' -Wait; Start-Process 'chrome.exe'",
      "type": "powershell",
      "category": "download",
      "action": "download_and_execute",
      "timeout": 300
    },
    "explanation": "Downloads Chrome installer, installs silently, then opens Chrome",
    "aiType": "ollama",
    "model": "devops-master:latest",
    "responseTime": 1200
  }
}
```

### Get AI Statistics

```bash
GET /api/ai/statistics
```

Response:
```json
{
  "success": true,
  "data": {
    "ollamaStatistics": {
      "provider": "ollama",
      "available": true,
      "modelsAvailable": 6,
      "primaryModel": "qwen2.5-coder:1.5b",
      "fallbackModels": ["kali-specialist:latest", "threat-watch:latest", "qwen2.5:7b"],
      "conversationHistory": 0,
      "modelConfig": 8
    },
    "ollamaAvailable": true,
    "timestamp": "2025-10-07T05:00:00.000Z"
  }
}
```

### Advanced API Endpoints

#### Generate Script from Template

```bash
POST /api/ai/generate-script
Content-Type: application/json

{
  "template": "file_operations",
  "parameters": {
    "source": "C:\\temp",
    "destination": "D:\\backup"
  }
}
```

#### Parse Complex Command

```bash
POST /api/ai/parse-complex
Content-Type: application/json

{
  "userInput": "download chrome from internet, install it, open it",
  "clientInfo": {}
}
```

#### Validate Command

```bash
POST /api/ai/validate-command
Content-Type: application/json

{
  "command": "Get-Process | Stop-Process",
  "context": {
    "category": "system_mgmt",
    "clientInfo": {}
  }
}
```

#### Get Available Templates

```bash
GET /api/ai/templates
```

#### Get Advanced Statistics

```bash
GET /api/ai/advanced-statistics
```

#### Get Queue Status

```bash
GET /api/ai/queue-status
```

## Performance Comparison

Based on our testing results:

| Provider | Avg Score | Avg Time | Cost | Privacy | Reliability |
|----------|-----------|----------|------|---------|-------------|
| **Ollama** | **7.6/10** | **2ms** | **FREE** | **LOCAL** | **HIGH** |
| Hugging Face | 6.8/10 | 800ms | FREE | API | MEDIUM |
| Gemini | 7.2/10 | 1200ms | FREE* | API | MEDIUM |
| OpenAI | 8.1/10 | 1500ms | PAID | API | HIGH |
| Rule-based | 6.5/10 | 1ms | FREE | LOCAL | HIGH |

*Free tier has limits

## Troubleshooting

### Ollama Not Working

1. **Check if Ollama is running:**
   ```bash
   curl http://localhost:11434/api/tags
   ```

2. **Start Ollama service:**
   ```bash
   ollama serve
   ```

3. **Check available models:**
   ```bash
   ollama list
   ```

4. **Pull missing models:**
   ```bash
   ollama pull qwen2.5-coder:1.5b
   ```

### Models Not Loading

1. **Check disk space** - Models require significant storage
2. **Check internet connection** - Required for pulling models
3. **Restart Ollama service** after pulling models

### Slow Response Times

1. **Use faster models** for simple tasks:
   ```bash
   ollama pull llama3.2:3b  # 267ms average
   ```

2. **Check system resources** - Large models need more RAM/CPU

3. **Adjust timeout settings:**
   ```bash
   export OLLAMA_TIMEOUT=60000  # 60 seconds
   ```

### API Errors

1. **Check API keys** are set correctly
2. **Verify API quotas** haven't been exceeded
3. **Check network connectivity**
4. **Review API provider status pages**

## Best Practices

### Model Management

1. **Install models gradually** - Start with `qwen2.5-coder:1.5b`
2. **Monitor disk usage** - Models can be 1-40GB each
3. **Keep models updated** - Pull latest versions regularly

### Performance Optimization

1. **Use appropriate models** for task complexity
2. **Monitor response times** and adjust timeouts
3. **Implement caching** for frequently used commands
4. **Use fallback chains** for reliability

### Security Considerations

1. **Ollama is most secure** - No data leaves your system
2. **API providers** - Review their data handling policies
3. **Environment variables** - Store API keys securely
4. **Network security** - Use HTTPS for API calls

## Advanced Features

### Multi-Command Processing

The Ollama integration supports complex multi-step commands:

```bash
POST /api/ai/natural-language
Content-Type: application/json

{
  "userInput": "download chrome from internet, install it, open it",
  "clientInfo": {}
}
```

The system will automatically:
1. Parse the complex request
2. Generate multiple PowerShell commands
3. Handle dependencies between commands
4. Provide safety validation

### Script Generation

Generate production-ready PowerShell scripts with templates:

```bash
POST /api/ai/generate-script
Content-Type: application/json

{
  "template": "file_operations",
  "parameters": {
    "source": "C:\\temp",
    "destination": "D:\\backup"
  }
}
```

### Command Validation

All generated commands are automatically validated for:
- Safety compliance
- Syntax correctness
- Security policies
- Resource requirements

### Learning System

The system learns from command execution results to improve future responses:
- Success/failure tracking
- Performance optimization
- Pattern recognition
- Context awareness

## Integration Examples

### Frontend Integration

```typescript
// Check AI provider status
const checkAIStatus = async () => {
  const response = await fetch('/api/ai/test-connection');
  const data = await response.json();
  
  if (data.data.ollama.available) {
    console.log(`Using Ollama with ${data.data.ollama.models} models`);
  } else {
    console.log('Using fallback AI provider');
  }
};

// Process natural language command
const processCommand = async (userInput: string) => {
  const response = await fetch('/api/ai/process-command', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      category: 'natural_language',
      action: 'process',
      params: { userInput },
      clientInfo: { uuid: 'client-001', platform: 'Windows' }
    })
  });
  
  return await response.json();
};
```

### Backend Integration

```javascript
// Use Ollama processor directly
const OllamaAICommandProcessor = require('./services/ollamaAICommandProcessor');
const ollamaProcessor = new OllamaAICommandProcessor();

// Process command
const result = await ollamaProcessor.processCommandWithAI(
  'download chrome and install it',
  { uuid: 'client-001', platform: 'Windows' },
  { category: 'download' }
);

console.log(result.data.optimizedCommand.command);
```

## Conclusion

Ollama provides the best balance of performance, cost, and privacy for the LoopJS C2 Panel. With proper setup and model selection, you can achieve:

- **Sub-second response times**
- **Zero API costs**
- **Complete data privacy**
- **High reliability**
- **Specialized task handling**

For production deployments, we recommend starting with Ollama and keeping other providers as fallbacks for maximum reliability.
