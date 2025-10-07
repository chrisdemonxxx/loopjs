const fs = require('fs');

function checkTestProgress() {
  console.log('🔍 Checking Qwen2:72b Test Progress...\n');
  
  // Check if simple test result exists
  if (fs.existsSync('qwen2-72b-simple-test.json')) {
    const simpleResult = JSON.parse(fs.readFileSync('qwen2-72b-simple-test.json', 'utf8'));
    console.log('✅ Simple Test Results:');
    console.log(`   Model: ${simpleResult.model}`);
    console.log(`   Test Case: ${simpleResult.testCase}`);
    console.log(`   Accuracy Score: ${simpleResult.accuracyScore}/10`);
    console.log(`   Response Time: ${simpleResult.responseTime}ms`);
    console.log(`   Keywords Found: ${simpleResult.keywordsFound}/${simpleResult.totalKeywords}`);
    console.log(`   Response: ${simpleResult.response}`);
    console.log('');
  }
  
  // Check if comprehensive test results exist
  if (fs.existsSync('qwen2-72b-test-results.json')) {
    const comprehensiveResult = JSON.parse(fs.readFileSync('qwen2-72b-test-results.json', 'utf8'));
    console.log('✅ Comprehensive Test Results:');
    console.log(`   Model: ${comprehensiveResult.model}`);
    console.log(`   Average Score: ${comprehensiveResult.summary.avgScore}/10`);
    console.log(`   Average Time: ${comprehensiveResult.summary.avgTime}ms`);
    console.log(`   Tests Completed: ${comprehensiveResult.summary.testsCompleted}/${comprehensiveResult.summary.totalTests}`);
    console.log(`   Performance: ${comprehensiveResult.summary.performance}`);
    console.log('');
    
    // Show category breakdown
    if (comprehensiveResult.categories) {
      console.log('📊 Category Breakdown:');
      Object.entries(comprehensiveResult.categories).forEach(([category, data]) => {
        const avgScore = (data.scores.reduce((a, b) => a + b, 0) / data.scores.length).toFixed(1);
        const avgTime = Math.round(data.times.reduce((a, b) => a + b, 0) / data.times.length);
        console.log(`   ${category}: ${avgScore}/10 (${avgTime}ms avg)`);
      });
      console.log('');
    }
    
    // Show comparison
    if (comprehensiveResult.comparison) {
      console.log('🆚 Model Comparison:');
      Object.entries(comprehensiveResult.comparison).forEach(([model, data]) => {
        console.log(`   ${model}: ${data.score}/10 (${data.time}ms)`);
      });
      console.log('');
    }
  } else {
    console.log('⏳ Comprehensive test still running...');
    console.log('   Expected completion time: 10-15 minutes');
    console.log('   (8 test cases × ~80 seconds each)');
    console.log('');
  }
  
  // Check for any error logs
  const files = fs.readdirSync('.');
  const errorFiles = files.filter(f => f.includes('error') || f.includes('log'));
  if (errorFiles.length > 0) {
    console.log('⚠️  Error files found:');
    errorFiles.forEach(file => console.log(`   ${file}`));
    console.log('');
  }
  
  console.log('💡 Tips:');
  console.log('   - Qwen2:72b is a 72B parameter model, so responses are slow but high quality');
  console.log('   - Each test case takes approximately 60-90 seconds');
  console.log('   - The model excels at complex reasoning and security tasks');
  console.log('   - Results will be automatically saved when complete');
}

// Run progress check
checkTestProgress();
