const fs = require('fs');

// Use built-in fetch for Node.js 18+
const OLLAMA_API = 'http://localhost:11434/api/generate';

// Simple test case to verify Qwen2:72b is working
const testCase = {
  level: 1,
  name: "Simple Folder Creation",
  prompt: "Generate a PowerShell command to create a folder named TestFolder",
  expectedKeywords: ["New-Item", "Directory", "TestFolder"],
  category: "file_ops"
};

async function testQwen2Simple() {
  console.log('🚀 Testing Qwen2:72b - Simple Test...\n');
  console.log(`Test: ${testCase.name}`);
  console.log(`Prompt: ${testCase.prompt}`);
  console.log('─'.repeat(80));
  
  const startTime = Date.now();
  
  try {
    console.log('Sending request to Qwen2:72b...');
    const response = await fetch(OLLAMA_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'qwen2:72b',
        prompt: `You are an expert Windows system administrator and PowerShell specialist. Generate precise, executable commands.

${testCase.prompt}

Respond with ONLY the command or steps, no extra explanation unless asked.`,
        stream: false,
        options: {
          temperature: 0.3,
          top_p: 0.9
        }
      })
    });
    
    const endTime = Date.now();
    const data = await response.json();
    
    console.log(`✅ Response received in ${endTime - startTime}ms`);
    console.log(`📝 Response: ${data.response}`);
    
    // Simple scoring
    const responseText = data.response.toLowerCase();
    const keywordsFound = testCase.expectedKeywords.filter(kw => 
      responseText.includes(kw.toLowerCase())
    ).length;
    const accuracyScore = (keywordsFound / testCase.expectedKeywords.length) * 10;
    
    console.log(`\n📊 SCORING:`);
    console.log(`   Keywords found: ${keywordsFound}/${testCase.expectedKeywords.length}`);
    console.log(`   Accuracy Score: ${accuracyScore.toFixed(1)}/10`);
    console.log(`   Response Time: ${endTime - startTime}ms`);
    
    // Save result
    const result = {
      timestamp: new Date().toISOString(),
      model: 'qwen2:72b',
      testCase: testCase.name,
      response: data.response,
      responseTime: endTime - startTime,
      accuracyScore: accuracyScore.toFixed(1),
      keywordsFound: keywordsFound,
      totalKeywords: testCase.expectedKeywords.length
    };
    
    fs.writeFileSync('qwen2-72b-simple-test.json', JSON.stringify(result, null, 2));
    console.log('\n✅ Result saved to: qwen2-72b-simple-test.json');
    
    // Analysis
    console.log(`\n📈 ANALYSIS:`);
    if (accuracyScore >= 8.0) {
      console.log(`   ✅ EXCELLENT: Qwen2:72b shows excellent accuracy!`);
    } else if (accuracyScore >= 6.0) {
      console.log(`   ✅ GOOD: Qwen2:72b shows good accuracy`);
    } else {
      console.log(`   ⚠️  NEEDS IMPROVEMENT: Qwen2:72b accuracy could be better`);
    }
    
    if (endTime - startTime > 30000) {
      console.log(`   ⚠️  SLOW: Response time (${endTime - startTime}ms) is quite slow`);
    } else if (endTime - startTime > 10000) {
      console.log(`   ⚠️  MODERATE: Response time (${endTime - startTime}ms) is acceptable`);
    } else {
      console.log(`   ✅ FAST: Response time (${endTime - startTime}ms) is good`);
    }
    
    console.log('\n🎉 Simple test complete! Ready to run full test suite.');
    
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
    console.log('This might be due to:');
    console.log('1. Ollama service not running');
    console.log('2. Qwen2:72b model not loaded');
    console.log('3. Network connectivity issues');
    console.log('4. Model taking too long to respond');
  }
}

// Run simple test
testQwen2Simple().catch(console.error);
