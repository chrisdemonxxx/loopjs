/**
 * Web Search Service
 * Discovers download URLs for software using multiple search strategies
 */

const axios = require('axios');
const cheerio = require('cheerio');

class WebSearchService {
    constructor() {
        this.userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
        this.timeout = 10000;
        
        // Known software download patterns
        this.softwarePatterns = {
            'opera': {
                officialDomain: 'opera.com',
                downloadPage: 'https://www.opera.com/download',
                directPattern: /https?:\/\/.*opera.*\.(exe|msi)/i
            },
            'chrome': {
                officialDomain: 'google.com',
                downloadPage: 'https://www.google.com/chrome/',
                directPattern: /https?:\/\/.*chrome.*\.(exe|msi)/i
            },
            'firefox': {
                officialDomain: 'mozilla.org',
                downloadPage: 'https://www.mozilla.org/firefox/download/',
                directPattern: /https?:\/\/.*firefox.*\.(exe|msi)/i
            },
            'brave': {
                officialDomain: 'brave.com',
                downloadPage: 'https://brave.com/download/',
                directPattern: /https?:\/\/.*brave.*\.(exe|msi)/i
            },
            'vscode': {
                officialDomain: 'code.visualstudio.com',
                downloadPage: 'https://code.visualstudio.com/download',
                directPattern: /https?:\/\/.*vscode.*\.(exe|msi)/i
            },
            'python': {
                officialDomain: 'python.org',
                downloadPage: 'https://www.python.org/downloads/',
                directPattern: /https?:\/\/.*python.*\.(exe|msi)/i
            }
        };
        
        // Trusted download domains
        this.trustedDomains = [
            'opera.com', 'google.com', 'mozilla.org', 'microsoft.com',
            'brave.com', 'github.com', 'python.org', 'nodejs.org',
            'code.visualstudio.com', 'jetbrains.com', 'adobe.com'
        ];
    }

    /**
     * Search for software download URL
     * @param {string} softwareName - Name of software to search for
     * @param {string} platform - Target platform (windows, mac, linux)
     * @returns {object} Search results with ranked URLs
     */
    async searchForSoftware(softwareName, platform = 'windows') {
        try {
            console.log(`[WEB SEARCH] Searching for ${softwareName} download URL...`);
            
            const normalizedName = softwareName.toLowerCase().trim();
            
            // Check if we have a known pattern for this software
            const knownPattern = this.softwarePatterns[normalizedName];
            if (knownPattern) {
                console.log(`[WEB SEARCH] Using known pattern for ${softwareName}`);
                return await this.searchKnownSoftware(normalizedName, knownPattern, platform);
            }
            
            // Fallback to generic search
            return await this.genericSoftwareSearch(softwareName, platform);
            
        } catch (error) {
            console.error('[WEB SEARCH] Search failed:', error.message);
            return {
                success: false,
                error: error.message,
                urls: []
            };
        }
    }

    /**
     * Search for known software using predefined patterns
     */
    async searchKnownSoftware(softwareName, pattern, platform) {
        try {
            const results = {
                success: true,
                softwareName: softwareName,
                platform: platform,
                urls: [],
                officialUrl: pattern.downloadPage
            };
            
            // Try to extract direct download link from official page
            try {
                const pageContent = await this.fetchPage(pattern.downloadPage);
                const directLinks = this.extractDownloadLinks(pageContent, pattern.directPattern, platform);
                
                if (directLinks.length > 0) {
                    results.urls = directLinks.map(url => ({
                        url: url,
                        source: 'official',
                        confidence: 0.95,
                        domain: pattern.officialDomain
                    }));
                    console.log(`[WEB SEARCH] Found ${directLinks.length} direct download links`);
                    return results;
                }
            } catch (error) {
                console.log('[WEB SEARCH] Failed to extract from official page:', error.message);
            }
            
            // Fallback: return official download page
            results.urls.push({
                url: pattern.downloadPage,
                source: 'official_page',
                confidence: 0.85,
                domain: pattern.officialDomain,
                requiresExtraction: true
            });
            
            return results;
            
        } catch (error) {
            console.error('[WEB SEARCH] Known software search failed:', error.message);
            return {
                success: false,
                error: error.message,
                urls: []
            };
        }
    }

    /**
     * Generic software search using DuckDuckGo
     */
    async genericSoftwareSearch(softwareName, platform) {
        try {
            const query = `${softwareName} download ${platform} official`;
            console.log(`[WEB SEARCH] Generic search: ${query}`);
            
            // Use DuckDuckGo HTML search
            const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
            const pageContent = await this.fetchPage(searchUrl);
            
            // Extract URLs from search results
            const urls = this.extractUrlsFromSearchResults(pageContent, softwareName);
            
            // Rank URLs by trustworthiness
            const rankedUrls = this.rankUrls(urls, softwareName);
            
            return {
                success: true,
                softwareName: softwareName,
                platform: platform,
                urls: rankedUrls.slice(0, 5), // Top 5 results
                query: query
            };
            
        } catch (error) {
            console.error('[WEB SEARCH] Generic search failed:', error.message);
            return {
                success: false,
                error: error.message,
                urls: []
            };
        }
    }

    /**
     * Fetch page content
     */
    async fetchPage(url) {
        try {
            const response = await axios.get(url, {
                headers: {
                    'User-Agent': this.userAgent,
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.5'
                },
                timeout: this.timeout,
                maxRedirects: 5
            });
            
            return response.data;
        } catch (error) {
            throw new Error(`Failed to fetch ${url}: ${error.message}`);
        }
    }

    /**
     * Extract download links from page content
     */
    extractDownloadLinks(html, pattern, platform) {
        const $ = cheerio.load(html);
        const links = [];
        
        // Find all links
        $('a[href]').each((i, elem) => {
            const href = $(elem).attr('href');
            if (!href) return;
            
            // Make absolute URL
            let absoluteUrl = href;
            if (href.startsWith('//')) {
                absoluteUrl = 'https:' + href;
            } else if (href.startsWith('/')) {
                // Relative URL - skip for now
                return;
            }
            
            // Check if matches pattern
            if (pattern.test(absoluteUrl)) {
                // Check if platform-specific
                const lowerUrl = absoluteUrl.toLowerCase();
                if (platform === 'windows' && (lowerUrl.includes('win') || lowerUrl.includes('.exe') || lowerUrl.includes('.msi'))) {
                    links.push(absoluteUrl);
                } else if (!lowerUrl.includes('mac') && !lowerUrl.includes('linux')) {
                    links.push(absoluteUrl);
                }
            }
        });
        
        return [...new Set(links)]; // Remove duplicates
    }

    /**
     * Extract URLs from search results
     */
    extractUrlsFromSearchResults(html, softwareName) {
        const $ = cheerio.load(html);
        const urls = [];
        
        // DuckDuckGo result links
        $('.result__a, .result__url').each((i, elem) => {
            const href = $(elem).attr('href');
            if (href && href.startsWith('http')) {
                urls.push(href);
            }
        });
        
        // Also check regular links
        $('a[href]').each((i, elem) => {
            const href = $(elem).attr('href');
            if (href && href.startsWith('http') && href.includes(softwareName.toLowerCase())) {
                urls.push(href);
            }
        });
        
        return [...new Set(urls)]; // Remove duplicates
    }

    /**
     * Rank URLs by trustworthiness and relevance
     */
    rankUrls(urls, softwareName) {
        return urls.map(url => {
            let confidence = 0.5; // Base confidence
            const lowerUrl = url.toLowerCase();
            const domain = this.extractDomain(url);
            
            // Check if trusted domain
            if (this.trustedDomains.some(trusted => domain.includes(trusted))) {
                confidence += 0.3;
            }
            
            // Check if official domain
            if (domain.includes(softwareName.toLowerCase())) {
                confidence += 0.2;
            }
            
            // Check if download page
            if (lowerUrl.includes('download') || lowerUrl.includes('get')) {
                confidence += 0.1;
            }
            
            // Check if direct file link
            if (lowerUrl.match(/\.(exe|msi|dmg|pkg)$/)) {
                confidence += 0.15;
            }
            
            return {
                url: url,
                domain: domain,
                confidence: Math.min(confidence, 1.0),
                source: 'search'
            };
        }).sort((a, b) => b.confidence - a.confidence);
    }

    /**
     * Extract domain from URL
     */
    extractDomain(url) {
        try {
            const urlObj = new URL(url);
            return urlObj.hostname;
        } catch (error) {
            return '';
        }
    }

    /**
     * Extract direct download link from page using browser automation
     */
    async extractDirectDownloadLink(pageUrl, softwareName) {
        try {
            console.log(`[WEB SEARCH] Extracting direct download link from ${pageUrl}`);
            
            // For now, return the page URL - browser automation can be added later
            // This would use Puppeteer to:
            // 1. Load the page
            // 2. Find and click download button
            // 3. Intercept the actual download URL
            // 4. Return the direct link
            
            return {
                success: true,
                directUrl: pageUrl,
                requiresExtraction: true
            };
            
        } catch (error) {
            console.error('[WEB SEARCH] Link extraction failed:', error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Get statistics
     */
    getStatistics() {
        return {
            knownSoftware: Object.keys(this.softwarePatterns).length,
            trustedDomains: this.trustedDomains.length
        };
    }
}

module.exports = WebSearchService;
