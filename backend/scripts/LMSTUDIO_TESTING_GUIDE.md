# LM Studio Model Testing Setup Guide

## 🚀 Quick Start Guide

### Prerequisites
1. **Ollama Running**: Make sure Ollama is running (`ollama serve`)
2. **LM Studio Models**: Your GGUF models should be accessible to Ollama
3. **Node.js**: Required for running the test scripts

### Step 1: Convert LM Studio Models to Ollama Format

Run the conversion script to create Ollama-compatible models:

```powershell
# From project root directory
.\backend\scripts\convert-lmstudio-models.ps1
```

This will create three optimized models:
- `gemma3-12b-c2` (12B parameters)
- `gpt-oss-20b-c2` (20B parameters) 
- `qwen3-coder-30b-c2` (30B parameters)

### Step 2: Test the Models

Run the comprehensive testing script:

```powershell
# From project root directory
.\backend\scripts\run-lmstudio-tests.ps1
```

Or run the test script directly:

```powershell
cd backend\scripts
node test-lmstudio-models.js
```

### Step 3: Review Results

The testing will generate several result files:
- `lmstudio-gemma3-12b-c2-results.json` - Individual model results
- `lmstudio-gpt-oss-20b-c2-results.json` - Individual model results
- `lmstudio-qwen3-coder-30b-c2-results.json` - Individual model results
- `lmstudio-comprehensive-results.json` - Complete comparison

## 📊 Test Cases

Each model will be tested with 8 different scenarios:

1. **Simple Folder Creation** (Level 1) - Basic PowerShell commands
2. **Network Ping** (Level 2) - Network connectivity tests
3. **Download Chrome** (Level 3) - File download operations
4. **Multi-Step Workflow** (Level 4) - Complex automation tasks
5. **Network Enumeration** (Level 5) - Penetration testing commands
6. **Chrome Password Extraction** (Level 6) - Security operations
7. **Advanced Persistence** (Level 7) - Advanced security techniques
8. **Complex Network Scan** (Level 8) - Comprehensive reconnaissance

## 🎯 Expected Performance

Based on model sizes and capabilities:

| Model | Expected Score | Speed | Best For |
|-------|---------------|-------|----------|
| **gemma3-12b-c2** | 8.0-8.5/10 | Fast | Balanced operations |
| **gpt-oss-20b-c2** | 8.5-9.0/10 | Medium | Complex scripting |
| **qwen3-coder-30b-c2** | 9.0-9.5/10 | Slow | Advanced security |

## 🔧 Troubleshooting

### Common Issues:

1. **"Model not found" error**:
   - Ensure your GGUF models are in the correct location
   - Check that Ollama can access the model files
   - Verify model names match exactly

2. **"Ollama not running" error**:
   - Start Ollama: `ollama serve`
   - Check if Ollama is accessible at `http://localhost:11434`

3. **"Node.js not found" error**:
   - Install Node.js from https://nodejs.org/
   - Ensure Node.js is in your PATH

4. **Slow response times**:
   - Larger models (30B) will be slower
   - Consider using smaller models for real-time operations
   - Ensure adequate system resources (RAM, CPU)

## 📈 Integration with LoopJS

After testing, integrate the best performing model:

1. **Update Model Selector**: Modify `backend/services/enhancedModelSelector.js`
2. **Add New Models**: Include LM Studio models in your model selection logic
3. **Performance Monitoring**: Track model performance in production
4. **Fallback Chain**: Ensure fallback to existing models if needed

## 🎉 Success Metrics

A successful test should show:
- ✅ All models created successfully
- ✅ Response times under 30 seconds for complex tasks
- ✅ Accuracy scores above 7.0/10
- ✅ Proper PowerShell syntax generation
- ✅ Security considerations in responses

## 📞 Support

If you encounter issues:
1. Check the console output for specific error messages
2. Verify all prerequisites are met
3. Review the generated JSON result files for detailed information
4. Test individual models manually with `ollama run <model-name>`

