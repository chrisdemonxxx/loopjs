const fs = require('fs');

// Use built-in fetch for Node.js 18+
// For older versions, uncomment the line below:
// const fetch = require('node-fetch');

const OLLAMA_API = 'http://localhost:11434/api/generate';

// Test cases with increasing complexity
const testCases = [
  {
    level: 1,
    name: "Simple Folder Creation",
    prompt: "Generate a PowerShell command to create a folder named TestFolder",
    expectedKeywords: ["New-Item", "Directory", "TestFolder"],
    category: "file_ops"
  },
  {
    level: 2,
    name: "Network Ping",
    prompt: "Generate a PowerShell command to ping google.com 4 times",
    expectedKeywords: ["Test-NetConnection", "ping", "google.com"],
    category: "network"
  },
  {
    level: 3,
    name: "Download Chrome",
    prompt: "I need to download Google Chrome. Generate the exact PowerShell command with the download URL.",
    expectedKeywords: ["Invoke-WebRequest", "chrome", "download", "https://"],
    category: "download"
  },
  {
    level: 4,
    name: "Multi-Step Workflow",
    prompt: "Download Chrome from internet, install it silently, then open it. Break this into clear steps with commands.",
    expectedKeywords: ["download", "install", "Start-Process", "silent"],
    category: "workflow"
  },
  {
    level: 5,
    name: "Network Enumeration",
    prompt: "As a penetration tester, enumerate network shares on 192.168.1.100. Generate commands.",
    expectedKeywords: ["net view", "Get-SmbShare", "192.168.1.100"],
    category: "pentest"
  },
  {
    level: 6,
    name: "Chrome Password Extraction",
    prompt: "Extract saved passwords from Chrome browser on Windows. Explain the steps and provide commands.",
    expectedKeywords: ["DPAPI", "Login Data", "Chrome", "decrypt", "SQLite"],
    category: "security"
  }
];

// Models to test - Focus on dolphin3:8b and compare with best existing models
const modelsToTest = [
  { name: 'dolphin3:8b', tier: 1, description: 'NEW - Security-focused, research-backed' },
  { name: 'qwen2.5-coder:1.5b', tier: 1, description: 'Current Best - 7.1/10' },
  { name: 'kali-specialist:latest', tier: 2, description: 'Workflow Expert - 9.1/10' },
  { name: 'threat-watch:latest', tier: 2, description: 'Pentest Expert - 7.7/10' },
  { name: 'qwen2.5:7b', tier: 1, description: 'Balanced - 6.5/10' },
  { name: 'llama3.2:3b', tier: 3, description: 'Fastest - 267ms' }
];

async function testModel(modelName, testCase) {
  const startTime = Date.now();
  
  try {
    const response = await fetch(OLLAMA_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: modelName,
        prompt: `You are an expert Windows system administrator and PowerShell specialist. Generate precise, executable commands.

${testCase.prompt}

Respond with ONLY the command or steps, no extra explanation unless asked.`,
        stream: false,
        options: {
          temperature: 0.3,  // Lower = more deterministic
          top_p: 0.9
        }
      })
    });
    
    const endTime = Date.now();
    const data = await response.json();
    
    return {
      model: modelName,
      testCase: testCase.name,
      level: testCase.level,
      category: testCase.category,
      response: data.response,
      responseTime: endTime - startTime,
      timestamp: new Date().toISOString(),
      success: true
    };
  } catch (error) {
    return {
      model: modelName,
      testCase: testCase.name,
      level: testCase.level,
      category: testCase.category,
      response: `Error: ${error.message}`,
      responseTime: Date.now() - startTime,
      timestamp: new Date().toISOString(),
      success: false,
      error: error.message
    };
  }
}

async function scoreResponse(result, testCase) {
  const response = result.response.toLowerCase();
  
  // Accuracy: Check if expected keywords are present
  const keywordsFound = testCase.expectedKeywords.filter(kw => 
    response.includes(kw.toLowerCase())
  ).length;
  const accuracyScore = (keywordsFound / testCase.expectedKeywords.length) * 10;
  
  // Reasoning: Check for step-by-step or explanations
  const hasSteps = /step \d|first|second|then|next|finally|1\.|2\.|3\./i.test(result.response);
  const hasExplanation = /because|since|to|for|in order to/i.test(result.response);
  const reasoningScore = hasSteps && hasExplanation ? 10 : hasSteps ? 8 : hasExplanation ? 6 : 4;
  
  // Safety: Check for error handling
  const hasSafety = /try|catch|test-path|erroraction|force|confirm|if.*exist/i.test(result.response);
  const safetyScore = hasSafety ? 8 : 4;
  
  // Workflow: Check for multiple steps and structure
  const stepCount = (result.response.match(/\n/g) || []).length;
  const hasNumberedSteps = /\d+\./g.test(result.response);
  const workflowScore = hasNumberedSteps ? Math.min(10, stepCount * 2) : Math.min(8, stepCount * 1.5);
  
  // Speed scoring
  let speedScore = 10;
  if (result.responseTime > 15000) speedScore = 0;
  else if (result.responseTime > 10000) speedScore = 3;
  else if (result.responseTime > 5000) speedScore = 5;
  else if (result.responseTime > 2000) speedScore = 7;
  
  // Syntax quality (PowerShell/CMD specific)
  const hasPowerShellSyntax = /get-|set-|new-|remove-|start-|stop-|invoke-|write-host/i.test(result.response);
  const hasCmdSyntax = /dir|cd|copy|del|ren|md|rd|type|echo/i.test(result.response);
  const syntaxScore = hasPowerShellSyntax || hasCmdSyntax ? 8 : 5;
  
  // Weighted total
  const totalScore = (
    accuracyScore * 0.25 +
    reasoningScore * 0.20 +
    safetyScore * 0.15 +
    workflowScore * 0.15 +
    speedScore * 0.10 +
    syntaxScore * 0.15
  );
  
  return {
    ...result,
    scores: {
      accuracy: accuracyScore.toFixed(1),
      reasoning: reasoningScore,
      safety: safetyScore,
      workflow: workflowScore,
      speed: speedScore,
      syntax: syntaxScore,
      total: totalScore.toFixed(1)
    }
  };
}

async function runAllTests() {
  console.log('🚀 Starting Ollama Model Testing...\n');
  console.log(`Testing ${modelsToTest.length} models with ${testCases.length} test cases each\n`);
  
  const results = [];
  
  for (const model of modelsToTest) {
    console.log(`\n📊 Testing: ${model.name} (Tier ${model.tier})`);
    console.log(`   Description: ${model.description}`);
    console.log('─'.repeat(80));
    
    for (const testCase of testCases) {
      // Skip advanced tests for low-tier models
      if (model.tier === 3 && testCase.level > 4) {
        console.log(`  ⏭️  Skipping Level ${testCase.level}: ${testCase.name} (Tier 3 model)`);
        continue;
      }
      if (model.name.includes('1.5b') && testCase.level > 3) {
        console.log(`  ⏭️  Skipping Level ${testCase.level}: ${testCase.name} (1.5B model)`);
        continue;
      }
      
      console.log(`  Testing Level ${testCase.level}: ${testCase.name}...`);
      
      try {
        const result = await testModel(model.name, testCase);
        const scored = await scoreResponse(result, testCase);
        results.push(scored);
        
        if (scored.success) {
          console.log(`    ✓ Score: ${scored.scores.total}/10 (${scored.responseTime}ms)`);
          console.log(`    📝 Response: ${scored.response.substring(0, 100)}${scored.response.length > 100 ? '...' : ''}`);
        } else {
          console.log(`    ✗ Error: ${scored.error}`);
        }
      } catch (error) {
        console.log(`    ✗ Unexpected Error: ${error.message}`);
      }
      
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  
  // Generate summary report
  console.log('\n\n' + '='.repeat(80));
  console.log('📈 FINAL RESULTS SUMMARY');
  console.log('='.repeat(80));
  
  // Group by model
  const modelScores = {};
  results.forEach(r => {
    if (!modelScores[r.model]) {
      modelScores[r.model] = { scores: [], avgTime: 0, count: 0, categories: {} };
    }
    if (r.success) {
      modelScores[r.model].scores.push(parseFloat(r.scores.total));
      modelScores[r.model].avgTime += r.responseTime;
      modelScores[r.model].count++;
      
      // Track by category
      if (!modelScores[r.model].categories[r.category]) {
        modelScores[r.model].categories[r.category] = [];
      }
      modelScores[r.model].categories[r.category].push(parseFloat(r.scores.total));
    }
  });
  
  // Calculate averages and rank
  const rankings = Object.entries(modelScores).map(([model, data]) => ({
    model,
    avgScore: data.scores.length > 0 ? (data.scores.reduce((a, b) => a + b, 0) / data.scores.length).toFixed(1) : '0.0',
    avgTime: data.count > 0 ? Math.round(data.avgTime / data.count) : 0,
    testsRun: data.count,
    categories: data.categories
  })).sort((a, b) => parseFloat(b.avgScore) - parseFloat(a.avgScore));
  
  console.log('\n🏆 OVERALL RANKINGS:\n');
  rankings.forEach((r, i) => {
    console.log(`${i + 1}. ${r.model}`);
    console.log(`   Average Score: ${r.avgScore}/10`);
    console.log(`   Average Time: ${r.avgTime}ms`);
    console.log(`   Tests Completed: ${r.testsRun}`);
    
    // Show category breakdown
    const categoryScores = Object.entries(r.categories).map(([cat, scores]) => ({
      category: cat,
      avgScore: (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1),
      count: scores.length
    }));
    
    if (categoryScores.length > 0) {
      console.log(`   Category Breakdown:`);
      categoryScores.forEach(cs => {
        console.log(`     ${cs.category}: ${cs.avgScore}/10 (${cs.count} tests)`);
      });
    }
    console.log('');
  });
  
  // Speed rankings
  const speedRankings = [...rankings].sort((a, b) => a.avgTime - b.avgTime);
  console.log('\n⚡ SPEED RANKINGS:\n');
  speedRankings.forEach((r, i) => {
    console.log(`${i + 1}. ${r.model} - ${r.avgTime}ms average`);
  });
  
  // Category-specific recommendations
  console.log('\n💡 CATEGORY-SPECIFIC RECOMMENDATIONS:\n');
  
  const categories = ['file_ops', 'network', 'download', 'workflow', 'pentest', 'security'];
  categories.forEach(cat => {
    const categoryResults = rankings.map(r => ({
      model: r.model,
      score: r.categories[cat] ? (r.categories[cat].reduce((a, b) => a + b, 0) / r.categories[cat].length).toFixed(1) : '0.0',
      count: r.categories[cat] ? r.categories[cat].length : 0
    })).filter(r => r.count > 0).sort((a, b) => parseFloat(b.score) - parseFloat(a.score));
    
    if (categoryResults.length > 0) {
      console.log(`${cat.toUpperCase()}:`);
      console.log(`  Best: ${categoryResults[0].model} (${categoryResults[0].score}/10)`);
      if (categoryResults.length > 1) {
        console.log(`  Backup: ${categoryResults[1].model} (${categoryResults[1].score}/10)`);
      }
      console.log('');
    }
  });
  
  // Final recommendations
  console.log('\n🎯 FINAL RECOMMENDATIONS:\n');
  console.log(`Best Overall: ${rankings[0].model} (${rankings[0].avgScore}/10)`);
  console.log(`Fastest: ${speedRankings[0].model} (${speedRankings[0].avgTime}ms)`);
  
  // Find best for each tier
  const tier1Best = rankings.filter(r => modelsToTest.find(m => m.name === r.model)?.tier === 1)[0];
  const tier2Best = rankings.filter(r => modelsToTest.find(m => m.name === r.model)?.tier === 2)[0];
  
  if (tier1Best) console.log(`Best Tier 1 (General): ${tier1Best.model} (${tier1Best.avgScore}/10)`);
  if (tier2Best) console.log(`Best Tier 2 (Specialized): ${tier2Best.model} (${tier2Best.avgScore}/10)`);
  
  // Save detailed results
  const reportData = {
    timestamp: new Date().toISOString(),
    summary: {
      totalModels: modelsToTest.length,
      totalTests: results.length,
      successfulTests: results.filter(r => r.success).length,
      bestOverall: rankings[0],
      fastest: speedRankings[0]
    },
    rankings,
    detailedResults: results,
    recommendations: {
      bestOverall: rankings[0].model,
      fastest: speedRankings[0].model,
      bestTier1: tier1Best?.model,
      bestTier2: tier2Best?.model,
      categoryWinners: categories.map(cat => {
        const winner = rankings.map(r => ({
          model: r.model,
          score: r.categories[cat] ? (r.categories[cat].reduce((a, b) => a + b, 0) / r.categories[cat].length).toFixed(1) : '0.0'
        })).filter(r => parseFloat(r.score) > 0).sort((a, b) => parseFloat(b.score) - parseFloat(a.score))[0];
        return { category: cat, winner: winner?.model, score: winner?.score };
      }).filter(r => r.winner)
    }
  };
  
  fs.writeFileSync(
    'ollama-test-results.json',
    JSON.stringify(reportData, null, 2)
  );
  console.log('\n✅ Detailed results saved to: ollama-test-results.json');
  
  // Generate integration recommendations
  console.log('\n🔧 INTEGRATION RECOMMENDATIONS:\n');
  console.log('Based on test results, here\'s how to integrate the best models:\n');
  
  console.log('```javascript');
  console.log('// Dynamic model selection function');
  console.log('function selectModel(taskComplexity, taskType) {');
  console.log(`  if (taskType === 'security' || taskType === 'pentest') {`);
  console.log(`    return '${tier2Best?.model || 'kali-specialist:latest'}';`);
  console.log('  }');
  console.log(`  if (taskComplexity === 'simple') {`);
  console.log(`    return '${speedRankings[0].model}';  // Fastest`);
  console.log('  }');
  console.log(`  if (taskComplexity === 'complex') {`);
  console.log(`    return '${rankings[0].model}';  // Most capable`);
  console.log('  }');
  console.log(`  return '${rankings.find(r => parseFloat(r.avgScore) >= 7.0)?.model || 'qwen2.5:7b'}';  // Balanced default`);
  console.log('}');
  console.log('```');
  
  console.log('\n🎉 Testing Complete! Use these results to implement the best AI model for your C2 panel.');
}

// Run tests
runAllTests().catch(console.error);
