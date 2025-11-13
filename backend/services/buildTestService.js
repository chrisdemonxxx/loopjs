const fs = require('fs');
const path = require('path');
const AgentBuild = require('../models/AgentBuild');

/**
 * Validate build artifacts (check file existence, sizes, formats)
 */
async function validateArtifacts(buildId) {
    const build = await AgentBuild.findById(buildId);
    if (!build) {
        throw new Error('Build not found');
    }

    const results = {
        valid: true,
        errors: [],
        warnings: [],
        artifacts: {}
    };

    if (!build.filePaths) {
        results.valid = false;
        results.errors.push('No file paths found in build');
        return results;
    }

    // Check each file
    const fileTypes = ['exe', 'msi', 'zip', 'cpp', 'logs'];
    for (const fileType of fileTypes) {
        const filePath = build.filePaths[fileType];
        if (!filePath) {
            results.warnings.push(`${fileType.toUpperCase()} file path not set`);
            continue;
        }

        if (!fs.existsSync(filePath)) {
            results.valid = false;
            results.errors.push(`${fileType.toUpperCase()} file not found: ${filePath}`);
            continue;
        }

        const stats = fs.statSync(filePath);
        results.artifacts[fileType] = {
            exists: true,
            size: stats.size,
            path: filePath,
            modified: stats.mtime
        };

        // Validate file sizes
        if (stats.size === 0) {
            results.warnings.push(`${fileType.toUpperCase()} file is empty`);
        }

        // Validate file extensions
        const ext = path.extname(filePath).toLowerCase();
        const expectedExt = {
            exe: '.exe',
            msi: '.msi',
            zip: '.zip',
            cpp: '.cpp',
            logs: '.txt'
        };

        if (expectedExt[fileType] && ext !== expectedExt[fileType]) {
            results.warnings.push(`${fileType.toUpperCase()} file has unexpected extension: ${ext}`);
        }
    }

    return results;
}

/**
 * Test code signing (if applicable)
 * Note: This is a placeholder - actual signature verification would require additional tools
 */
async function testSignature(buildId) {
    const build = await AgentBuild.findById(buildId);
    if (!build) {
        throw new Error('Build not found');
    }

    const results = {
        signed: false,
        signatureValid: false,
        certificate: null,
        errors: []
    };

    // Check if executable exists
    if (!build.filePaths || !build.filePaths.exe || !fs.existsSync(build.filePaths.exe)) {
        results.errors.push('Executable file not found');
        return results;
    }

    // Placeholder: In a real implementation, you would use signtool.exe or similar
    // to verify the signature. For now, we check if metadata indicates signing.
    if (build.metadata && build.metadata.codeSigningMetadata) {
        results.signed = true;
        results.certificate = build.metadata.codeSigningMetadata;
        // Assume valid if metadata exists (would need actual verification)
        results.signatureValid = true;
    } else {
        results.errors.push('No code signing metadata found');
    }

    return results;
}

/**
 * Analyze obfuscation level
 */
async function testObfuscation(buildId) {
    const build = await AgentBuild.findById(buildId);
    if (!build) {
        throw new Error('Build not found');
    }

    const results = {
        obfuscated: false,
        level: 'none',
        techniques: [],
        score: 0
    };

    // Check metadata for obfuscation indicators
    if (build.metadata) {
        if (build.metadata.junkCodeLines && build.metadata.junkCodeLines > 0) {
            results.obfuscated = true;
            results.techniques.push('junk_code');
            results.score += 20;
        }

        if (build.metadata.codeStructure) {
            results.obfuscated = true;
            results.techniques.push('polymorphic_structure');
            results.score += 30;
        }

        if (build.config && build.config.enableCodeObfuscation) {
            results.obfuscated = true;
            results.techniques.push('code_obfuscation');
            results.score += 25;
        }

        if (build.config && build.config.enableStringEncryption) {
            results.obfuscated = true;
            results.techniques.push('string_encryption');
            results.score += 25;
        }
    }

    // Determine level
    if (results.score >= 70) {
        results.level = 'high';
    } else if (results.score >= 40) {
        results.level = 'medium';
    } else if (results.score > 0) {
        results.level = 'low';
    }

    return results;
}

/**
 * Validate persistence mechanisms
 */
async function testPersistence(buildId) {
    const build = await AgentBuild.findById(buildId);
    if (!build) {
        throw new Error('Build not found');
    }

    const results = {
        mechanisms: [],
        valid: true,
        errors: []
    };

    if (!build.config) {
        results.errors.push('Build config not found');
        return results;
    }

    // Check configured persistence methods
    if (build.config.enableServiceInstallation) {
        results.mechanisms.push({
            type: 'service',
            enabled: true,
            description: 'Windows Service Installation'
        });
    }

    if (build.config.enableRegistryPersistence) {
        results.mechanisms.push({
            type: 'registry',
            enabled: true,
            description: 'Registry-based Persistence'
        });
    }

    if (build.config.enableScheduledTask) {
        results.mechanisms.push({
            type: 'scheduled_task',
            enabled: true,
            description: 'Scheduled Task Persistence'
        });
    }

    if (build.config.enableStartupFolder) {
        results.mechanisms.push({
            type: 'startup_folder',
            enabled: true,
            description: 'Startup Folder Persistence'
        });
    }

    if (results.mechanisms.length === 0) {
        results.warnings = ['No persistence mechanisms enabled'];
    }

    return results;
}

/**
 * Run basic security scan
 */
async function runSecurityScan(buildId) {
    const build = await AgentBuild.findById(buildId);
    if (!build) {
        throw new Error('Build not found');
    }

    const results = {
        score: 100,
        issues: [],
        recommendations: []
    };

    // Check evasion techniques
    if (build.config) {
        if (!build.config.enableAntiDebug) {
            results.score -= 10;
            results.recommendations.push('Enable anti-debugging techniques');
        }

        if (!build.config.enableAntiVM) {
            results.score -= 10;
            results.recommendations.push('Enable anti-VM detection');
        }

        if (!build.config.enableAntiSandbox) {
            results.score -= 10;
            results.recommendations.push('Enable anti-sandbox detection');
        }

        if (!build.config.enableDefenderExclusion) {
            results.score -= 5;
            results.recommendations.push('Enable Windows Defender exclusion');
        }

        if (!build.config.enableUACBypass) {
            results.score -= 5;
            results.recommendations.push('Enable UAC bypass');
        }
    }

    // Check metadata
    if (!build.metadata || !build.metadata.clonedService) {
        results.score -= 15;
        results.issues.push('No Microsoft service cloning detected');
    }

    if (results.score < 50) {
        results.issues.push('Security score is below recommended threshold');
    }

    return results;
}

/**
 * Run all tests
 */
async function runAllTests(buildId) {
    try {
        const [artifacts, signature, obfuscation, persistence, security] = await Promise.all([
            validateArtifacts(buildId),
            testSignature(buildId),
            testObfuscation(buildId),
            testPersistence(buildId),
            runSecurityScan(buildId)
        ]);

        const results = {
            buildId,
            timestamp: new Date().toISOString(),
            artifacts,
            signature,
            obfuscation,
            persistence,
            security,
            overall: {
                passed: artifacts.valid && security.score >= 50,
                score: Math.round((security.score + (obfuscation.score / 100) * 30) / 1.3)
            }
        };

        // Save results to build
        await AgentBuild.findByIdAndUpdate(buildId, {
            testResults: results
        });

        return results;
    } catch (error) {
        throw error;
    }
}

module.exports = {
    validateArtifacts,
    testSignature,
    testObfuscation,
    testPersistence,
    runSecurityScan,
    runAllTests
};

