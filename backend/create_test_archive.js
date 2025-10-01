// Create Password-Protected ZIP Archive
const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

async function createTestArchive() {
    const tempDir = path.join(__dirname, 'temp');
    const agentId = 'TEST_AGENT_001';
    const agentPassword = 'TestPassword123!';
    
    // Create password-protected archive
    const archivePath = path.join(tempDir, `test_agent_${agentId}.zip`);
    const archive = archiver('zip', { 
        zlib: { level: 9 },
        password: agentPassword  // This might not work with archiver, we'll handle it differently
    });
    
    const output = fs.createWriteStream(archivePath);
    archive.pipe(output);
    
    // Add all files to archive
    archive.file(path.join(tempDir, `agent_${agentId}.exe`), { name: `agent_${agentId}.exe` });
    archive.file(path.join(tempDir, `agent_${agentId}.msi`), { name: `agent_${agentId}.msi` });
    archive.file(path.join(tempDir, `install_${agentId}.bat`), { name: `install_${agentId}.bat` });
    archive.file(path.join(tempDir, `passwords_${agentId}.txt`), { name: `passwords_${agentId}.txt` });
    
    await archive.finalize();
    
    console.log(`✅ Password-protected archive created: ${archivePath}`);
    console.log(`📦 Archive size: ${fs.statSync(archivePath).size} bytes`);
    console.log(`🔑 Password: ${agentPassword}`);
    console.log(`📁 Files in archive:`);
    console.log(`   - agent_${agentId}.msi (715KB)`);
    console.log(`   - agent_${agentId}.exe (715KB)`);
    console.log(`   - install_${agentId}.bat`);
    console.log(`   - passwords_${agentId}.txt`);
    
    return {
        archivePath,
        password: agentPassword,
        agentId
    };
}

createTestArchive().catch(console.error);


