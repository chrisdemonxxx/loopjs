/**
 * Web Fetching Service
 * Smart downloading and URL resolution with multiple fallback methods
 */

const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

class WebFetchService {
    constructor() {
        this.userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
        this.timeout = 30000;
        this.maxRedirects = 10;
        this.chunkSize = 1024 * 1024; // 1MB chunks
        
        // Common download patterns
        this.downloadPatterns = {
            executables: /\.(exe|msi|dmg|pkg|deb|rpm|app)$/i,
            archives: /\.(zip|rar|7z|tar|gz|bz2)$/i,
            installers: /\.(exe|msi|dmg|pkg)$/i,
            media: /\.(mp4|avi|mkv|mp3|wav|jpg|png|gif)$/i
        };

        // Mirror/CDN patterns
        this.mirrorPatterns = [
            /cdn/i, /mirror/i, /download/i, /files/i,
            /releases/i, /binaries/i, /dist/i
        ];

        // Known download sites
        this.downloadSites = {
            github: {
                pattern: /github\.com/i,
                downloadUrl: (url) => url.replace('/blob/', '/raw/'),
                fallbackUrl: (url) => url.replace('github.com', 'github.com') + '/releases/latest'
            },
            sourceforge: {
                pattern: /sourceforge\.net/i,
                downloadUrl: (url) => url + '/download',
                fallbackUrl: (url) => url.replace('/files/', '/files/latest/download')
            },
            google_drive: {
                pattern: /drive\.google\.com/i,
                downloadUrl: (url) => url.replace('/file/d/', '/uc?export=download&id='),
                fallbackUrl: (url) => url.replace('/view', '/download')
            }
        };
    }

    /**
     * Smart download with multiple fallback methods
     * @param {string} url - URL to download from
     * @param {object} options - Download options
     * @returns {object} Download result
     */
    async smartDownload(url, options = {}) {
        const result = {
            success: false,
            method: null,
            filePath: null,
            fileSize: 0,
            downloadTime: 0,
            error: null,
            strategies: []
        };

        const strategies = [
            { name: 'axios_direct', method: this.downloadWithAxios.bind(this) },
            { name: 'axios_with_headers', method: this.downloadWithAxiosHeaders.bind(this) },
            { name: 'curl_fallback', method: this.downloadWithCurl.bind(this) },
            { name: 'url_resolution', method: this.downloadWithUrlResolution.bind(this) },
            { name: 'mirror_search', method: this.downloadFromMirror.bind(this) }
        ];

        for (const strategy of strategies) {
            try {
                console.log(`[WEB FETCH] Trying strategy: ${strategy.name}`);
                result.strategies.push({ name: strategy.name, attempted: true });
                
                const strategyResult = await strategy.method(url, options);
                
                if (strategyResult.success) {
                    result.success = true;
                    result.method = strategy.name;
                    result.filePath = strategyResult.filePath;
                    result.fileSize = strategyResult.fileSize;
                    result.downloadTime = strategyResult.downloadTime;
                    console.log(`[WEB FETCH] Success with strategy: ${strategy.name}`);
                    break;
                } else {
                    result.strategies[result.strategies.length - 1].error = strategyResult.error;
                    console.log(`[WEB FETCH] Strategy ${strategy.name} failed: ${strategyResult.error}`);
                }
            } catch (error) {
                result.strategies[result.strategies.length - 1].error = error.message;
                console.log(`[WEB FETCH] Strategy ${strategy.name} error: ${error.message}`);
            }
        }

        if (!result.success) {
            result.error = 'All download strategies failed';
        }

        return result;
    }

    /**
     * Download using Axios with basic configuration
     */
    async downloadWithAxios(url, options) {
        const startTime = Date.now();
        
        try {
            // Resolve URL first
            const resolvedUrl = await this.resolveUrl(url);
            // Validate content-type hints (prefer executables/installers)
            const head = await this.safeHead(resolvedUrl);
            if (head && head.headers) {
                const ct = (head.headers['content-type'] || '').toLowerCase();
                if (ct.includes('text/html') && !this.downloadPatterns.installers.test(resolvedUrl)) {
                    return { success: false, error: 'Resolved to HTML page, not a binary' };
                }
            }
            
            const response = await axios({
                method: 'GET',
                url: resolvedUrl,
                responseType: 'stream',
                timeout: this.timeout,
                maxRedirects: this.maxRedirects,
                headers: {
                    'User-Agent': this.userAgent
                }
            });

            const fileName = this.extractFileName(response.headers, url);
            const filePath = path.join(options.outputDir || process.cwd(), fileName);
            
            const writer = fs.createWriteStream(filePath);
            response.data.pipe(writer);

            return new Promise((resolve, reject) => {
                writer.on('finish', () => {
                    const fileSize = fs.statSync(filePath).size;
                    const downloadTime = Date.now() - startTime;
                    if (fileSize === 0) {
                        return resolve({ success: false, error: 'Empty file downloaded' });
                    }
                    
                    resolve({
                        success: true,
                        filePath: filePath,
                        fileSize: fileSize,
                        downloadTime: downloadTime
                    });
                });
                
                writer.on('error', (error) => {
                    reject({
                        success: false,
                        error: error.message
                    });
                });
            });
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Download using Axios with enhanced headers
     */
    async downloadWithAxiosHeaders(url, options) {
        const startTime = Date.now();
        
        try {
            const resolvedUrl = await this.resolveUrl(url);
            
            const response = await axios({
                method: 'GET',
                url: resolvedUrl,
                responseType: 'stream',
                timeout: this.timeout,
                maxRedirects: this.maxRedirects,
                headers: {
                    'User-Agent': this.userAgent,
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.5',
                    'Accept-Encoding': 'gzip, deflate',
                    'Connection': 'keep-alive',
                    'Upgrade-Insecure-Requests': '1'
                }
            });

            const fileName = this.extractFileName(response.headers, url);
            const filePath = path.join(options.outputDir || process.cwd(), fileName);
            
            const writer = fs.createWriteStream(filePath);
            response.data.pipe(writer);

            return new Promise((resolve, reject) => {
                writer.on('finish', () => {
                    const fileSize = fs.statSync(filePath).size;
                    const downloadTime = Date.now() - startTime;
                    
                    resolve({
                        success: true,
                        filePath: filePath,
                        fileSize: fileSize,
                        downloadTime: downloadTime
                    });
                });
                
                writer.on('error', (error) => {
                    reject({
                        success: false,
                        error: error.message
                    });
                });
            });
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Download using curl as fallback
     */
    async downloadWithCurl(url, options) {
        const startTime = Date.now();
        
        try {
            const resolvedUrl = await this.resolveUrl(url);
            const fileName = this.extractFileName({}, resolvedUrl);
            const filePath = path.join(options.outputDir || process.cwd(), fileName);
            
            const curlCommand = `curl -L -o "${filePath}" -H "User-Agent: ${this.userAgent}" "${resolvedUrl}"`;
            
            await execAsync(curlCommand);
            
            if (fs.existsSync(filePath)) {
                const fileSize = fs.statSync(filePath).size;
                const downloadTime = Date.now() - startTime;
                
                return {
                    success: true,
                    filePath: filePath,
                    fileSize: fileSize,
                    downloadTime: downloadTime
                };
            } else {
                return {
                    success: false,
                    error: 'File not created by curl'
                };
            }
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Download with URL resolution and content parsing
     */
    async downloadWithUrlResolution(url, options) {
        const startTime = Date.now();
        
        try {
            // First, get the page content to find actual download links
            const pageResponse = await axios.get(url, {
                headers: { 'User-Agent': this.userAgent },
                timeout: this.timeout
            });

            const $ = cheerio.load(pageResponse.data);
            
            // Look for download links
            const downloadLinks = this.findDownloadLinks($, url);
            
            if (downloadLinks.length === 0) {
                return {
                    success: false,
                    error: 'No download links found on page'
                };
            }

            // Try each download link
            for (const downloadUrl of downloadLinks) {
                try {
                    const resolvedUrl = await this.resolveUrl(downloadUrl);
                    const fileName = this.extractFileName({}, resolvedUrl);
                    const filePath = path.join(options.outputDir || process.cwd(), fileName);
                    
                    const response = await axios({
                        method: 'GET',
                        url: resolvedUrl,
                        responseType: 'stream',
                        timeout: this.timeout,
                        headers: { 'User-Agent': this.userAgent }
                    });

                    const writer = fs.createWriteStream(filePath);
                    response.data.pipe(writer);

                    return new Promise((resolve, reject) => {
                        writer.on('finish', () => {
                            const fileSize = fs.statSync(filePath).size;
                            const downloadTime = Date.now() - startTime;
                            
                            resolve({
                                success: true,
                                filePath: filePath,
                                fileSize: fileSize,
                                downloadTime: downloadTime
                            });
                        });
                        
                        writer.on('error', (error) => {
                            reject({
                                success: false,
                                error: error.message
                            });
                        });
                    });
                } catch (error) {
                    console.log(`[WEB FETCH] Failed to download from ${downloadUrl}: ${error.message}`);
                    continue;
                }
            }

            return {
                success: false,
                error: 'All download links failed'
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Download from mirror/CDN
     */
    async downloadFromMirror(url, options) {
        const startTime = Date.now();
        
        try {
            // Generate mirror URLs
            const mirrorUrls = this.generateMirrorUrls(url);
            
            for (const mirrorUrl of mirrorUrls) {
                try {
                    const resolvedUrl = await this.resolveUrl(mirrorUrl);
                    const fileName = this.extractFileName({}, resolvedUrl);
                    const filePath = path.join(options.outputDir || process.cwd(), fileName);
                    
                    const response = await axios({
                        method: 'GET',
                        url: resolvedUrl,
                        responseType: 'stream',
                        timeout: this.timeout,
                        headers: { 'User-Agent': this.userAgent }
                    });

                    const writer = fs.createWriteStream(filePath);
                    response.data.pipe(writer);

                    return new Promise((resolve, reject) => {
                        writer.on('finish', () => {
                            const fileSize = fs.statSync(filePath).size;
                            const downloadTime = Date.now() - startTime;
                            
                            resolve({
                                success: true,
                                filePath: filePath,
                                fileSize: fileSize,
                                downloadTime: downloadTime
                            });
                        });
                        
                        writer.on('error', (error) => {
                            reject({
                                success: false,
                                error: error.message
                            });
                        });
                    });
                } catch (error) {
                    console.log(`[WEB FETCH] Mirror ${mirrorUrl} failed: ${error.message}`);
                    continue;
                }
            }

            return {
                success: false,
                error: 'All mirror URLs failed'
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Resolve URL with redirects
     */
    async resolveUrl(url) {
        try {
            const response = await axios.head(url, {
                headers: { 'User-Agent': this.userAgent },
                timeout: 10000,
                maxRedirects: this.maxRedirects
            });
            
            return response.request.res.responseUrl || url;
        } catch (error) {
            console.log(`[WEB FETCH] URL resolution failed for ${url}: ${error.message}`);
            return url;
        }
    }

    async safeHead(url) {
        try {
            const response = await axios.head(url, { headers: { 'User-Agent': this.userAgent }, timeout: 8000 });
            return response;
        } catch (e) {
            return null;
        }
    }

    /**
     * Extract filename from headers or URL
     */
    extractFileName(headers, url) {
        // Try to get filename from Content-Disposition header
        if (headers['content-disposition']) {
            const matches = headers['content-disposition'].match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
            if (matches && matches[1]) {
                return matches[1].replace(/['"]/g, '');
            }
        }

        // Extract from URL
        const urlPath = new URL(url).pathname;
        const fileName = path.basename(urlPath);
        
        if (fileName && fileName !== '/') {
            return fileName;
        }

        // Generate default filename
        return `download_${Date.now()}.bin`;
    }

    /**
     * Find download links in HTML content
     */
    findDownloadLinks($, baseUrl) {
        const links = [];
        
        // Look for common download link patterns
        const selectors = [
            'a[href*="download"]',
            'a[href*=".exe"]',
            'a[href*=".msi"]',
            'a[href*=".zip"]',
            'a[href*=".dmg"]',
            'a[href*=".pkg"]',
            'a[href*="releases"]',
            'a[href*="binaries"]',
            'a[href*="files"]'
        ];

        for (const selector of selectors) {
            $(selector).each((i, element) => {
                const href = $(element).attr('href');
                if (href) {
                    const absoluteUrl = this.makeAbsoluteUrl(href, baseUrl);
                    if (this.isDownloadUrl(absoluteUrl)) {
                        links.push(absoluteUrl);
                    }
                }
            });
        }

        return [...new Set(links)]; // Remove duplicates
    }

    /**
     * Generate mirror URLs
     */
    generateMirrorUrls(originalUrl) {
        const mirrors = [];
        const url = new URL(originalUrl);
        
        // Common mirror patterns
        const mirrorDomains = [
            'mirror.example.com',
            'cdn.example.com',
            'download.example.com',
            'files.example.com'
        ];

        for (const domain of mirrorDomains) {
            const mirrorUrl = originalUrl.replace(url.hostname, domain);
            mirrors.push(mirrorUrl);
        }

        // Add common CDN patterns
        if (url.hostname.includes('github.com')) {
            mirrors.push(originalUrl.replace('github.com', 'github.com') + '/releases/latest');
        }

        return mirrors;
    }

    /**
     * Make URL absolute
     */
    makeAbsoluteUrl(href, baseUrl) {
        try {
            return new URL(href, baseUrl).href;
        } catch (error) {
            return href;
        }
    }

    /**
     * Check if URL is likely a download URL
     */
    isDownloadUrl(url) {
        for (const pattern of Object.values(this.downloadPatterns)) {
            if (pattern.test(url)) {
                return true;
            }
        }
        
        for (const pattern of this.mirrorPatterns) {
            if (pattern.test(url)) {
                return true;
            }
        }
        
        return false;
    }

    /**
     * Search for download URLs using web search
     */
    async searchForDownloadUrls(query, options = {}) {
        try {
            const searchQuery = encodeURIComponent(`${query} download official`);
            const searchUrl = `https://www.google.com/search?q=${searchQuery}`;
            
            const response = await axios.get(searchUrl, {
                headers: { 'User-Agent': this.userAgent },
                timeout: this.timeout
            });

            const $ = cheerio.load(response.data);
            const links = [];
            
            $('a[href]').each((i, element) => {
                const href = $(element).attr('href');
                if (href && href.startsWith('/url?q=')) {
                    const actualUrl = decodeURIComponent(href.split('/url?q=')[1].split('&')[0]);
                    if (this.isDownloadUrl(actualUrl)) {
                        links.push(actualUrl);
                    }
                }
            });

            return [...new Set(links)].slice(0, 10); // Return top 10 unique links
        } catch (error) {
            console.log(`[WEB FETCH] Search failed: ${error.message}`);
            return [];
        }
    }

    /**
     * Validate downloaded file
     */
    async validateFile(filePath, expectedSize = null) {
        try {
            if (!fs.existsSync(filePath)) {
                return { valid: false, error: 'File does not exist' };
            }

            const stats = fs.statSync(filePath);
            
            if (stats.size === 0) {
                return { valid: false, error: 'File is empty' };
            }

            if (expectedSize && Math.abs(stats.size - expectedSize) > 1024) {
                return { valid: false, error: 'File size mismatch' };
            }

            return { valid: true, size: stats.size };
        } catch (error) {
            return { valid: false, error: error.message };
        }
    }
}

module.exports = WebFetchService;
