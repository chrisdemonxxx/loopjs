#!/usr/bin/env node

/**
 * Setup Gemini API Key in Google Cloud Secret Manager
 */

const { SecretManagerServiceClient } = require('@google-cloud/secret-manager');

async function setupGeminiSecret() {
    try {
        console.log('[SETUP] Setting up Gemini API key in Google Cloud Secret Manager...');
        
        const client = new SecretManagerServiceClient();
        const projectId = 'code-assist-470813';
        const secretId = 'GEMINI_API_KEY';
        const secretValue = 'AIzaSyAzmA9Xcb95R0sDpFTxmuECbSPpNUjpC10';
        
        const parent = `projects/${projectId}`;
        const secretName = `${parent}/secrets/${secretId}`;
        
        try {
            // Check if secret exists
            await client.getSecret({ name: secretName });
            console.log(`[SETUP] Secret ${secretId} already exists`);
            
            // Add new version
            const [version] = await client.addSecretVersion({
                parent: secretName,
                payload: {
                    data: Buffer.from(secretValue, 'utf8'),
                },
            });
            console.log(`[SETUP] Added new version: ${version.name}`);
            
        } catch (error) {
            if (error.code === 5) { // NOT_FOUND
                console.log(`[SETUP] Secret ${secretId} does not exist, creating...`);
                
                // Create secret
                const [secret] = await client.createSecret({
                    parent: parent,
                    secretId: secretId,
                    secret: {
                        replication: {
                            automatic: {},
                        },
                    },
                });
                console.log(`[SETUP] Created secret: ${secret.name}`);
                
                // Add version
                const [version] = await client.addSecretVersion({
                    parent: secret.name,
                    payload: {
                        data: Buffer.from(secretValue, 'utf8'),
                    },
                });
                console.log(`[SETUP] Added version: ${version.name}`);
            } else {
                throw error;
            }
        }
        
        console.log('[SETUP] Gemini API key setup completed successfully');
        
    } catch (error) {
        console.error('[SETUP] Error setting up Gemini secret:', error);
        process.exit(1);
    }
}

// Run setup if called directly
if (require.main === module) {
    setupGeminiSecret();
}

module.exports = setupGeminiSecret;
