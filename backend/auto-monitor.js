const fs = require('fs');

function checkProgress() {
  console.log(`\n🕐 ${new Date().toLocaleTimeString()} - Checking Qwen2:72b Test Progress...`);
  
  if (fs.existsSync('qwen2-72b-test-results.json')) {
    console.log('🎉 COMPREHENSIVE TEST COMPLETED!');
    const result = JSON.parse(fs.readFileSync('qwen2-72b-test-results.json', 'utf8'));
    console.log(`   Average Score: ${result.summary.avgScore}/10`);
    console.log(`   Average Time: ${(result.summary.avgTime / 1000).toFixed(1)}s`);
    console.log(`   Performance: ${result.summary.performance.toUpperCase()}`);
    return true; // Test completed
  } else {
    console.log('⏳ Test still running...');
    return false; // Still running
  }
}

// Check every 2 minutes
function startMonitoring() {
  console.log('🚀 Starting Qwen2:72b Test Monitoring...');
  console.log('   Checking every 2 minutes...');
  console.log('   Press Ctrl+C to stop monitoring');
  
  const interval = setInterval(() => {
    const completed = checkProgress();
    if (completed) {
      clearInterval(interval);
      console.log('\n✅ Monitoring complete! Test finished.');
    }
  }, 120000); // 2 minutes
  
  // Initial check
  checkProgress();
}

// Start monitoring
startMonitoring();
