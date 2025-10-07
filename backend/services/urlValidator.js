/**
 * URL Validator Service
 * Validates download URLs before attempting download
 */

const axios = require('axios');

class URLValidator {
    constructor() {
        this.userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';
        this.timeout = 10000;
        
        // Suspicious patterns
        this.suspiciousPatterns = [
            /malware/i, /virus/i, /trojan/i, /hack/i,
            /crack/i, /keygen/i, /warez/i, /pirate/i
        ];
        
        // Valid installer content types
        this.validContentTypes = [
            'application/x-msdownload',
            'application/x-msdos-program',
            'application/octet-stream',
            'application/x-msi',
            'application/x-exe',
            'binary/octet-stream'
        ];
    }

    /**
     * Validate download URL
     * @param {string} url - URL to validate
     * @param {object} options - Validation options
     * @returns {object} Validation result
     */
    async validateDownloadUrl(url, options = {}) {
        try {
            console.log(`[URL VALIDATOR] Validating: ${url}`);
            
            const results = {
                url: url,
                valid: true,
                checks: {},
                warnings: [],
                errors: []
            };
            
            // Check 1: URL format
            results.checks.urlFormat = this.validateUrlFormat(url);
            if (!results.checks.urlFormat.valid) {
                results.valid = false;
                results.errors.push(results.checks.urlFormat.error);
            }
            
            // Check 2: Suspicious patterns
            results.checks.suspiciousContent = this.checkSuspiciousPatterns(url);
            if (!results.checks.suspiciousContent.safe) {
                results.valid = false;
                results.errors.push('URL contains suspicious patterns');
            }
            
            // Check 3: HEAD request to check content
            try {
                results.checks.headRequest = await this.performHeadRequest(url);
                
                // Validate content type
                if (results.checks.headRequest.contentType) {
                    const contentTypeValid = this.validateContentType(
                        results.checks.headRequest.contentType
                    );
                    
                    if (!contentTypeValid) {
                        results.warnings.push('Content-Type may not be an installer');
                    }
                }
                
                // Check file size
                if (results.checks.headRequest.contentLength) {
                    const sizeCheck = this.validateFileSize(results.checks.headRequest.contentLength);
                    if (!sizeCheck.valid) {
                        results.warnings.push(sizeCheck.warning);
                    }
                }
                
            } catch (error) {
                results.warnings.push(`HEAD request failed: ${error.message}`);
            }
            
            // Check 4: Domain reputation (basic check)
            results.checks.domainReputation = this.checkDomainReputation(url);
            if (results.checks.domainReputation.score < 0.5) {
                results.warnings.push('Low domain reputation');
            }
            
            console.log(`[URL VALIDATOR] Validation result: ${results.valid ? 'VALID' : 'INVALID'}`);
            
            return results;
            
        } catch (error) {
            console.error('[URL VALIDATOR] Validation failed:', error.message);
            return {
                url: url,
                valid: false,
                error: error.message,
                checks: {},
                warnings: [],
                errors: [error.message]
            };
        }
    }

    /**
     * Validate URL format
     */
    validateUrlFormat(url) {
        try {
            const urlObj = new URL(url);
            
            // Must be HTTP or HTTPS
            if (!['http:', 'https:'].includes(urlObj.protocol)) {
                return {
                    valid: false,
                    error: 'URL must use HTTP or HTTPS protocol'
                };
            }
            
            // Must have a hostname
            if (!urlObj.hostname) {
                return {
                    valid: false,
                    error: 'URL must have a valid hostname'
                };
            }
            
            return {
                valid: true,
                protocol: urlObj.protocol,
                hostname: urlObj.hostname,
                pathname: urlObj.pathname
            };
            
        } catch (error) {
            return {
                valid: false,
                error: 'Invalid URL format'
            };
        }
    }

    /**
     * Check for suspicious patterns
     */
    checkSuspiciousPatterns(url) {
        const lowerUrl = url.toLowerCase();
        
        for (const pattern of this.suspiciousPatterns) {
            if (pattern.test(lowerUrl)) {
                return {
                    safe: false,
                    pattern: pattern.toString()
                };
            }
        }
        
        return {
            safe: true
        };
    }

    /**
     * Perform HEAD request to check URL
     */
    async performHeadRequest(url) {
        try {
            const response = await axios.head(url, {
                headers: {
                    'User-Agent': this.userAgent
                },
                timeout: this.timeout,
                maxRedirects: 5,
                validateStatus: (status) => status < 400
            });
            
            return {
                success: true,
                statusCode: response.status,
                contentType: response.headers['content-type'],
                contentLength: parseInt(response.headers['content-length']) || null,
                lastModified: response.headers['last-modified'],
                finalUrl: response.request.res.responseUrl || url
            };
            
        } catch (error) {
            // If HEAD fails, try GET with range
            try {
                const response = await axios.get(url, {
                    headers: {
                        'User-Agent': this.userAgent,
                        'Range': 'bytes=0-1024' // Just get first 1KB
                    },
                    timeout: this.timeout,
                    maxRedirects: 5,
                    validateStatus: (status) => status < 400
                });
                
                return {
                    success: true,
                    statusCode: response.status,
                    contentType: response.headers['content-type'],
                    contentLength: parseInt(response.headers['content-length']) || null,
                    method: 'GET-range'
                };
                
            } catch (getError) {
                throw new Error(`Both HEAD and GET failed: ${error.message}`);
            }
        }
    }

    /**
     * Validate content type
     */
    validateContentType(contentType) {
        if (!contentType) return false;
        
        const lowerType = contentType.toLowerCase();
        
        // Check if it's a valid installer content type
        if (this.validContentTypes.some(valid => lowerType.includes(valid))) {
            return true;
        }
        
        // Check if it's explicitly an HTML page (bad for downloads)
        if (lowerType.includes('text/html')) {
            return false;
        }
        
        // application/octet-stream is generic but acceptable
        if (lowerType.includes('octet-stream')) {
            return true;
        }
        
        return false;
    }

    /**
     * Validate file size
     */
    validateFileSize(contentLength) {
        // Installers are typically > 1MB and < 2GB
        const minSize = 1024 * 1024; // 1MB
        const maxSize = 2 * 1024 * 1024 * 1024; // 2GB
        
        if (contentLength < minSize) {
            return {
                valid: false,
                warning: `File size too small (${this.formatBytes(contentLength)}), may not be an installer`
            };
        }
        
        if (contentLength > maxSize) {
            return {
                valid: false,
                warning: `File size very large (${this.formatBytes(contentLength)}), verify before downloading`
            };
        }
        
        return {
            valid: true,
            size: contentLength,
            formatted: this.formatBytes(contentLength)
        };
    }

    /**
     * Check domain reputation (basic)
     */
    checkDomainReputation(url) {
        try {
            const urlObj = new URL(url);
            const domain = urlObj.hostname.toLowerCase();
            
            let score = 0.5; // Base score
            
            // Known good domains
            const trustedDomains = [
                'opera.com', 'google.com', 'mozilla.org', 'microsoft.com',
                'github.com', 'python.org', 'nodejs.org', 'brave.com',
                'code.visualstudio.com', 'adobe.com', 'apple.com'
            ];
            
            if (trustedDomains.some(trusted => domain.includes(trusted))) {
                score = 0.95;
            }
            
            // Check for HTTPS
            if (urlObj.protocol === 'https:') {
                score += 0.1;
            }
            
            // Check for suspicious TLDs
            const suspiciousTlds = ['.tk', '.ml', '.ga', '.cf', '.gq'];
            if (suspiciousTlds.some(tld => domain.endsWith(tld))) {
                score -= 0.3;
            }
            
            return {
                domain: domain,
                score: Math.max(0, Math.min(1, score)),
                trusted: score > 0.8
            };
            
        } catch (error) {
            return {
                score: 0,
                error: error.message
            };
        }
    }

    /**
     * Format bytes to human readable
     */
    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    }

    /**
     * Quick validation (no network requests)
     */
    quickValidate(url) {
        const results = {
            url: url,
            valid: true,
            checks: {}
        };
        
        results.checks.urlFormat = this.validateUrlFormat(url);
        if (!results.checks.urlFormat.valid) {
            results.valid = false;
        }
        
        results.checks.suspiciousContent = this.checkSuspiciousPatterns(url);
        if (!results.checks.suspiciousContent.safe) {
            results.valid = false;
        }
        
        results.checks.domainReputation = this.checkDomainReputation(url);
        
        return results;
    }
}

module.exports = URLValidator;
