const fs = require('fs');

function monitorTestProgress() {
  console.log('🔍 Qwen2:72b Test Progress Monitor');
  console.log('=' .repeat(50));
  console.log(`Timestamp: ${new Date().toLocaleString()}`);
  console.log('');

  // Check simple test results
  if (fs.existsSync('qwen2-72b-simple-test.json')) {
    const simpleResult = JSON.parse(fs.readFileSync('qwen2-72b-simple-test.json', 'utf8'));
    console.log('✅ SIMPLE TEST COMPLETED:');
    console.log(`   Model: ${simpleResult.model}`);
    console.log(`   Test Case: ${simpleResult.testCase}`);
    console.log(`   Accuracy Score: ${simpleResult.accuracyScore}/10`);
    console.log(`   Response Time: ${(simpleResult.responseTime / 1000).toFixed(1)}s`);
    console.log(`   Keywords Found: ${simpleResult.keywordsFound}/${simpleResult.totalKeywords}`);
    console.log(`   Response: "${simpleResult.response}"`);
    console.log('');
  }

  // Check comprehensive test results
  if (fs.existsSync('qwen2-72b-test-results.json')) {
    const comprehensiveResult = JSON.parse(fs.readFileSync('qwen2-72b-test-results.json', 'utf8'));
    console.log('🎉 COMPREHENSIVE TEST COMPLETED!');
    console.log(`   Model: ${comprehensiveResult.model}`);
    console.log(`   Average Score: ${comprehensiveResult.summary.avgScore}/10`);
    console.log(`   Average Time: ${(comprehensiveResult.summary.avgTime / 1000).toFixed(1)}s`);
    console.log(`   Tests Completed: ${comprehensiveResult.summary.testsCompleted}/${comprehensiveResult.summary.totalTests}`);
    console.log(`   Performance: ${comprehensiveResult.summary.performance.toUpperCase()}`);
    console.log('');

    // Show category breakdown
    if (comprehensiveResult.categories) {
      console.log('📊 CATEGORY BREAKDOWN:');
      Object.entries(comprehensiveResult.categories).forEach(([category, data]) => {
        const avgScore = (data.scores.reduce((a, b) => a + b, 0) / data.scores.length).toFixed(1);
        const avgTime = (data.times.reduce((a, b) => a + b, 0) / data.times.length / 1000).toFixed(1);
        console.log(`   ${category}: ${avgScore}/10 (${avgTime}s avg)`);
      });
      console.log('');
    }

    // Show comparison
    if (comprehensiveResult.comparison) {
      console.log('🆚 MODEL COMPARISON:');
      Object.entries(comprehensiveResult.comparison).forEach(([model, data]) => {
        const timeSeconds = (data.time / 1000).toFixed(1);
        console.log(`   ${model}: ${data.score}/10 (${timeSeconds}s)`);
      });
      console.log('');
    }

    // Show detailed results
    if (comprehensiveResult.detailedResults) {
      console.log('📋 DETAILED RESULTS:');
      comprehensiveResult.detailedResults.forEach((result, index) => {
        if (result.success) {
          console.log(`   ${index + 1}. ${result.testCase}: ${result.scores.total}/10 (${(result.responseTime / 1000).toFixed(1)}s)`);
        } else {
          console.log(`   ${index + 1}. ${result.testCase}: ERROR - ${result.error}`);
        }
      });
      console.log('');
    }

    // Final recommendation
    console.log('🎯 FINAL RECOMMENDATION:');
    const avgScore = parseFloat(comprehensiveResult.summary.avgScore);
    const avgTime = comprehensiveResult.summary.avgTime;
    
    if (avgScore >= 8.5 && avgTime < 120000) {
      console.log('   🚀 EXCELLENT: Qwen2:72b should be your PRIMARY model!');
      console.log('   ✅ Implement immediately for complex C2 operations');
    } else if (avgScore >= 7.5 && avgTime < 150000) {
      console.log('   ✅ VERY GOOD: Qwen2:72b is highly recommended');
      console.log('   ✅ Use for complex tasks, keep fast models for simple ones');
    } else if (avgScore >= 7.0) {
      console.log('   ✅ GOOD: Qwen2:72b shows solid performance');
      console.log('   ⚠️  Consider for specific use cases');
    } else {
      console.log('   ⚠️  AVERAGE: Qwen2:72b needs evaluation');
      console.log('   ❌ May not be worth the response time');
    }

  } else {
    console.log('⏳ COMPREHENSIVE TEST STILL RUNNING...');
    console.log('');
    
    // Estimate progress based on time elapsed
    const simpleTestTime = fs.existsSync('qwen2-72b-simple-test.json') ? 
      JSON.parse(fs.readFileSync('qwen2-72b-simple-test.json', 'utf8')).responseTime : 80000;
    
    const estimatedTimePerTest = simpleTestTime;
    const totalTests = 8;
    const estimatedTotalTime = estimatedTimePerTest * totalTests;
    
    console.log('📊 PROGRESS ESTIMATION:');
    console.log(`   Estimated time per test: ${(estimatedTimePerTest / 1000).toFixed(1)}s`);
    console.log(`   Total tests: ${totalTests}`);
    console.log(`   Estimated total time: ${(estimatedTotalTime / 1000 / 60).toFixed(1)} minutes`);
    console.log('');
    
    console.log('💡 WHAT TO EXPECT:');
    console.log('   - Each test case takes 60-90 seconds');
    console.log('   - Qwen2:72b excels at complex reasoning');
    console.log('   - Results will be automatically saved');
    console.log('   - Test covers all C2 operation categories');
    console.log('');
    
    console.log('🔄 NEXT CHECK: Run this script again in 2-3 minutes');
  }

  console.log('');
  console.log('=' .repeat(50));
}

// Run monitoring
monitorTestProgress();
