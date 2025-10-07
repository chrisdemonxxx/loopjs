/**
 * Research Agent
 * AI-powered solution research using multiple sources
 */

const OllamaAICommandProcessor = require('./ollamaAICommandProcessor');
const WebFetchService = require('./webFetchService');
const BrowserAutomationService = require('./browserAutomationService');
const PythonToolManager = require('./pythonToolManager');

class ResearchAgent {
    constructor() {
        this.ollamaProcessor = new OllamaAICommandProcessor();
        this.webFetchService = new WebFetchService();
        this.browserAutomationService = new BrowserAutomationService();
        this.pythonToolManager = new PythonToolManager();
        
        this.researchHistory = new Map();
        this.successfulSources = new Map();
        this.researchPatterns = new Map();
        this.knowledgeBase = new Map();
    }

    /**
     * Research solution for a given problem
     * @param {string} problem - Problem description
     * @param {Array} failedAttempts - Previous failed attempts
     * @param {object} context - Additional context
     * @returns {object} Research result
     */
    async researchSolution(problem, failedAttempts = [], context = {}) {
        try {
            console.log(`[RESEARCH AGENT] Researching solution for: ${problem}`);

            const researchId = this.generateResearchId();
            const startTime = Date.now();

            const researchResult = {
                id: researchId,
                problem: problem,
                failedAttempts: failedAttempts,
                context: context,
                startTime: startTime,
                
                // Research sources
                aiResearch: null,
                webResearch: null,
                browserResearch: null,
                pythonResearch: null,
                documentationResearch: null,
                
                // Aggregated results
                solutions: [],
                confidence: 0,
                recommendations: [],
                
                // Metadata
                duration: 0,
                sourcesUsed: [],
                success: false
            };

            // Execute research from multiple sources in parallel
            const researchPromises = [
                this.researchWithAI(problem, failedAttempts, context),
                this.researchWithWeb(problem, failedAttempts, context),
                this.researchWithBrowser(problem, failedAttempts, context),
                this.researchWithPython(problem, failedAttempts, context),
                this.researchDocumentation(problem, failedAttempts, context)
            ];

            const results = await Promise.allSettled(researchPromises);

            // Process results
            researchResult.aiResearch = results[0].status === 'fulfilled' ? results[0].value : null;
            researchResult.webResearch = results[1].status === 'fulfilled' ? results[1].value : null;
            researchResult.browserResearch = results[2].status === 'fulfilled' ? results[2].value : null;
            researchResult.pythonResearch = results[3].status === 'fulfilled' ? results[3].value : null;
            researchResult.documentationResearch = results[4].status === 'fulfilled' ? results[4].value : null;

            // Aggregate solutions
            researchResult.solutions = this.aggregateSolutions(researchResult);
            researchResult.confidence = this.calculateConfidence(researchResult);
            researchResult.recommendations = this.generateRecommendations(researchResult);
            researchResult.sourcesUsed = this.getUsedSources(researchResult);
            researchResult.success = researchResult.solutions.length > 0;
            researchResult.duration = Date.now() - startTime;

            // Store in knowledge base
            this.storeInKnowledgeBase(researchResult);

            console.log(`[RESEARCH AGENT] Research completed in ${researchResult.duration}ms. Found ${researchResult.solutions.length} solutions.`);

            return researchResult;

        } catch (error) {
            console.error('[RESEARCH AGENT] Research failed:', error);
            return {
                success: false,
                error: error.message,
                problem: problem,
                failedAttempts: failedAttempts
            };
        }
    }

    /**
     * Research using AI (Ollama)
     */
    async researchWithAI(problem, failedAttempts, context) {
        try {
            console.log('[RESEARCH AGENT] Researching with AI...');

            const researchQueries = this.generateAIQueries(problem, failedAttempts, context);
            const aiResults = [];

            for (const query of researchQueries) {
                try {
                    const result = await this.ollamaProcessor.processCommandWithAI(
                        `Research and provide detailed solution for: ${query}. Include specific commands, URLs, and step-by-step instructions.`
                    );

                    if (result.success) {
                        aiResults.push({
                            query: query,
                            result: result,
                            confidence: 0.8,
                            source: 'ollama_ai'
                        });
                    }
                } catch (error) {
                    console.log(`[RESEARCH AGENT] AI query failed: ${query}`);
                }
            }

            return {
                success: aiResults.length > 0,
                results: aiResults,
                source: 'ai',
                confidence: aiResults.length > 0 ? 0.8 : 0
            };

        } catch (error) {
            return {
                success: false,
                error: error.message,
                source: 'ai'
            };
        }
    }

    /**
     * Research using web search and scraping
     */
    async researchWithWeb(problem, failedAttempts, context) {
        try {
            console.log('[RESEARCH AGENT] Researching with web search...');

            const searchQueries = this.generateWebQueries(problem, failedAttempts, context);
            const webResults = [];

            for (const query of searchQueries) {
                try {
                    const results = await this.webFetchService.searchForDownloadUrls(query);
                    
                    if (results.length > 0) {
                        webResults.push({
                            query: query,
                            results: results,
                            confidence: 0.7,
                            source: 'web_search'
                        });
                    }
                } catch (error) {
                    console.log(`[RESEARCH AGENT] Web search failed: ${query}`);
                }
            }

            // Try scraping specific sites
            const scrapingResults = await this.scrapeDocumentationSites(problem);

            return {
                success: webResults.length > 0 || scrapingResults.length > 0,
                searchResults: webResults,
                scrapingResults: scrapingResults,
                source: 'web',
                confidence: webResults.length > 0 ? 0.7 : 0
            };

        } catch (error) {
            return {
                success: false,
                error: error.message,
                source: 'web'
            };
        }
    }

    /**
     * Research using browser automation
     */
    async researchWithBrowser(problem, failedAttempts, context) {
        try {
            console.log('[RESEARCH AGENT] Researching with browser automation...');

            const initResult = await this.browserAutomationService.initialize();
            if (!initResult.success) {
                return {
                    success: false,
                    error: 'Browser initialization failed',
                    source: 'browser'
                };
            }

            const searchQueries = this.generateBrowserQueries(problem, failedAttempts, context);
            const browserResults = [];

            for (const query of searchQueries) {
                try {
                    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
                    const navResult = await this.browserAutomationService.navigateToUrl(searchUrl);
                    
                    if (navResult.success) {
                        // Extract download links
                        const linksResult = await this.browserAutomationService.extractDownloadLinks();
                        
                        if (linksResult.success && linksResult.links.length > 0) {
                            browserResults.push({
                                query: query,
                                links: linksResult.links,
                                confidence: 0.9,
                                source: 'browser_search'
                            });
                        }

                        // Try to click on first few results
                        const clickResults = await this.exploreSearchResults(query);
                        browserResults.push(...clickResults);
                    }
                } catch (error) {
                    console.log(`[RESEARCH AGENT] Browser search failed: ${query}`);
                }
            }

            return {
                success: browserResults.length > 0,
                results: browserResults,
                source: 'browser',
                confidence: browserResults.length > 0 ? 0.9 : 0
            };

        } catch (error) {
            return {
                success: false,
                error: error.message,
                source: 'browser'
            };
        }
    }

    /**
     * Research using Python tools
     */
    async researchWithPython(problem, failedAttempts, context) {
        try {
            console.log('[RESEARCH AGENT] Researching with Python tools...');

            const initResult = await this.pythonToolManager.initialize();
            if (!initResult.success) {
                return {
                    success: false,
                    error: 'Python initialization failed',
                    source: 'python'
                };
            }

            const pythonResults = [];

            // Use Selenium for advanced web scraping
            const seleniumResults = await this.researchWithSelenium(problem, failedAttempts, context);
            if (seleniumResults.success) {
                pythonResults.push(...seleniumResults.results);
            }

            // Use BeautifulSoup for content parsing
            const bsResults = await this.researchWithBeautifulSoup(problem, failedAttempts, context);
            if (bsResults.success) {
                pythonResults.push(...bsResults.results);
            }

            return {
                success: pythonResults.length > 0,
                results: pythonResults,
                source: 'python',
                confidence: pythonResults.length > 0 ? 0.85 : 0
            };

        } catch (error) {
            return {
                success: false,
                error: error.message,
                source: 'python'
            };
        }
    }

    /**
     * Research documentation and forums
     */
    async researchDocumentation(problem, failedAttempts, context) {
        try {
            console.log('[RESEARCH AGENT] Researching documentation...');

            const docSites = [
                'https://docs.python.org',
                'https://developer.mozilla.org',
                'https://stackoverflow.com',
                'https://github.com',
                'https://www.npmjs.com'
            ];

            const docResults = [];

            for (const site of docSites) {
                try {
                    const results = await this.scrapeDocumentationSite(site, problem);
                    if (results.length > 0) {
                        docResults.push({
                            site: site,
                            results: results,
                            confidence: 0.6,
                            source: 'documentation'
                        });
                    }
                } catch (error) {
                    console.log(`[RESEARCH AGENT] Documentation scraping failed: ${site}`);
                }
            }

            return {
                success: docResults.length > 0,
                results: docResults,
                source: 'documentation',
                confidence: docResults.length > 0 ? 0.6 : 0
            };

        } catch (error) {
            return {
                success: false,
                error: error.message,
                source: 'documentation'
            };
        }
    }

    /**
     * Generate AI research queries
     */
    generateAIQueries(problem, failedAttempts, context) {
        const queries = [];

        // Base query
        queries.push(`${problem} solution step by step`);

        // Error-specific queries
        if (failedAttempts.length > 0) {
            const errorTypes = failedAttempts.map(attempt => attempt.error).join(', ');
            queries.push(`${problem} alternative method avoiding ${errorTypes}`);
        }

        // Context-specific queries
        if (context.platform) {
            queries.push(`${problem} ${context.platform} specific solution`);
        }

        if (context.admin) {
            queries.push(`${problem} admin privileges solution`);
        }

        // Generic fallback queries
        queries.push(`${problem} working method 2024`);
        queries.push(`${problem} latest version download`);

        return queries.slice(0, 3); // Limit to 3 queries
    }

    /**
     * Generate web search queries
     */
    generateWebQueries(problem, failedAttempts, context) {
        const queries = [];

        // Base queries
        queries.push(`${problem} download`);
        queries.push(`${problem} install`);
        queries.push(`${problem} setup`);

        // Alternative queries
        queries.push(`${problem} alternative`);
        queries.push(`${problem} mirror`);
        queries.push(`${problem} portable`);

        return queries.slice(0, 4); // Limit to 4 queries
    }

    /**
     * Generate browser search queries
     */
    generateBrowserQueries(problem, failedAttempts, context) {
        return this.generateWebQueries(problem, failedAttempts, context);
    }

    /**
     * Scrape documentation sites
     */
    async scrapeDocumentationSites(problem) {
        const results = [];

        // Common documentation patterns
        const docPatterns = [
            {
                site: 'https://docs.python.org',
                pattern: /python.*download|install.*python/i,
                selector: 'a[href*="download"]'
            },
            {
                site: 'https://github.com',
                pattern: /release|download/i,
                selector: 'a[href*="releases"]'
            }
        ];

        for (const pattern of docPatterns) {
            try {
                // This would use web scraping to find relevant documentation
                // For now, return placeholder
                results.push({
                    site: pattern.site,
                    matches: [],
                    confidence: 0.5
                });
            } catch (error) {
                console.log(`[RESEARCH AGENT] Documentation scraping failed: ${pattern.site}`);
            }
        }

        return results;
    }

    /**
     * Research with Selenium
     */
    async researchWithSelenium(problem, failedAttempts, context) {
        try {
            const script = `
import sys
import time
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

def main():
    try:
        # Setup Chrome options
        chrome_options = Options()
        chrome_options.add_argument('--headless')
        chrome_options.add_argument('--no-sandbox')
        chrome_options.add_argument('--disable-dev-shm-usage')
        
        # Initialize driver
        driver = webdriver.Chrome(options=chrome_options)
        
        # Search for solutions
        search_queries = ['${problem} download', '${problem} install', '${problem} solution']
        results = []
        
        for query in search_queries:
            try:
                # Search on Google
                driver.get(f'https://www.google.com/search?q={query}')
                
                # Wait for results
                WebDriverWait(driver, 10).until(
                    EC.presence_of_element_located((By.CSS_SELECTOR, "h3"))
                )
                
                # Extract links
                links = driver.find_elements(By.CSS_SELECTOR, "h3")
                for link in links[:5]:  # Top 5 results
                    try:
                        link_text = link.text
                        if 'download' in link_text.lower() or 'install' in link_text.lower():
                            results.append({
                                'query': query,
                                'text': link_text,
                                'confidence': 0.8
                            })
                    except:
                        continue
                        
            except Exception as e:
                print(f"Search failed for {query}: {e}")
                continue
        
        driver.quit()
        
        # Output results
        print("SELENIUM_RESULTS_START")
        for result in results:
            print(f"RESULT: {result['query']} | {result['text']} | {result['confidence']}")
        print("SELENIUM_RESULTS_END")
        
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
`;

            const result = await this.pythonToolManager.executePythonScript(script);
            
            if (result.success) {
                const results = this.parseSeleniumResults(result.stdout);
                return {
                    success: true,
                    results: results
                };
            } else {
                return {
                    success: false,
                    error: result.error
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
     * Research with BeautifulSoup
     */
    async researchWithBeautifulSoup(problem, failedAttempts, context) {
        try {
            const script = `
import sys
import requests
from bs4 import BeautifulSoup
import json

def main():
    try:
        # Setup session
        session = requests.Session()
        session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        })
        
        # Search queries
        search_queries = ['${problem} download', '${problem} install']
        results = []
        
        for query in search_queries:
            try:
                # Search on DuckDuckGo (no JavaScript required)
                url = f'https://html.duckduckgo.com/html/?q={query}'
                response = session.get(url, timeout=30)
                response.raise_for_status()
                
                # Parse with BeautifulSoup
                soup = BeautifulSoup(response.content, 'html.parser')
                
                # Extract results
                result_links = soup.find_all('a', class_='result__a')
                for link in result_links[:5]:  # Top 5 results
                    try:
                        href = link.get('href', '')
                        text = link.get_text().strip()
                        
                        if 'download' in text.lower() or 'install' in text.lower():
                            results.append({
                                'query': query,
                                'url': href,
                                'text': text,
                                'confidence': 0.7
                            })
                    except:
                        continue
                        
            except Exception as e:
                print(f"Search failed for {query}: {e}")
                continue
        
        # Output results
        print("BEAUTIFULSOUP_RESULTS_START")
        for result in results:
            print(f"RESULT: {result['query']} | {result['url']} | {result['text']} | {result['confidence']}")
        print("BEAUTIFULSOUP_RESULTS_END")
        
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
`;

            const result = await this.pythonToolManager.executePythonScript(script);
            
            if (result.success) {
                const results = this.parseBeautifulSoupResults(result.stdout);
                return {
                    success: true,
                    results: results
                };
            } else {
                return {
                    success: false,
                    error: result.error
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
     * Parse Selenium results
     */
    parseSeleniumResults(stdout) {
        const results = [];
        const lines = stdout.split('\n');
        let inResults = false;

        for (const line of lines) {
            if (line.includes('SELENIUM_RESULTS_START')) {
                inResults = true;
                continue;
            }
            if (line.includes('SELENIUM_RESULTS_END')) {
                break;
            }
            if (inResults && line.startsWith('RESULT:')) {
                const parts = line.split(' | ');
                if (parts.length >= 3) {
                    results.push({
                        query: parts[0].replace('RESULT: ', ''),
                        text: parts[1],
                        confidence: parseFloat(parts[2]) || 0.8
                    });
                }
            }
        }

        return results;
    }

    /**
     * Parse BeautifulSoup results
     */
    parseBeautifulSoupResults(stdout) {
        const results = [];
        const lines = stdout.split('\n');
        let inResults = false;

        for (const line of lines) {
            if (line.includes('BEAUTIFULSOUP_RESULTS_START')) {
                inResults = true;
                continue;
            }
            if (line.includes('BEAUTIFULSOUP_RESULTS_END')) {
                break;
            }
            if (inResults && line.startsWith('RESULT:')) {
                const parts = line.split(' | ');
                if (parts.length >= 4) {
                    results.push({
                        query: parts[0].replace('RESULT: ', ''),
                        url: parts[1],
                        text: parts[2],
                        confidence: parseFloat(parts[3]) || 0.7
                    });
                }
            }
        }

        return results;
    }

    /**
     * Explore search results with browser
     */
    async exploreSearchResults(query) {
        const results = [];
        
        try {
            // This would click on search results and extract more information
            // For now, return placeholder
            results.push({
                query: query,
                explored: true,
                confidence: 0.6
            });
        } catch (error) {
            console.log(`[RESEARCH AGENT] Search exploration failed: ${query}`);
        }

        return results;
    }

    /**
     * Scrape specific documentation site
     */
    async scrapeDocumentationSite(site, problem) {
        try {
            // This would implement specific scraping logic for each site
            // For now, return placeholder
            return [{
                site: site,
                problem: problem,
                matches: [],
                confidence: 0.5
            }];
        } catch (error) {
            return [];
        }
    }

    /**
     * Aggregate solutions from all sources
     */
    aggregateSolutions(researchResult) {
        const solutions = [];

        // Aggregate from AI research
        if (researchResult.aiResearch?.success) {
            researchResult.aiResearch.results.forEach(result => {
                solutions.push({
                    source: 'ai',
                    content: result.result.command || result.result.explanation,
                    confidence: result.confidence,
                    type: 'command'
                });
            });
        }

        // Aggregate from web research
        if (researchResult.webResearch?.success) {
            researchResult.webResearch.searchResults.forEach(result => {
                result.results.forEach(url => {
                    solutions.push({
                        source: 'web',
                        content: url,
                        confidence: result.confidence,
                        type: 'url'
                    });
                });
            });
        }

        // Aggregate from browser research
        if (researchResult.browserResearch?.success) {
            researchResult.browserResearch.results.forEach(result => {
                if (result.links) {
                    result.links.forEach(link => {
                        solutions.push({
                            source: 'browser',
                            content: link.url,
                            confidence: result.confidence,
                            type: 'url',
                            text: link.text
                        });
                    });
                }
            });
        }

        // Aggregate from Python research
        if (researchResult.pythonResearch?.success) {
            researchResult.pythonResearch.results.forEach(result => {
                solutions.push({
                    source: 'python',
                    content: result.text || result.url,
                    confidence: result.confidence,
                    type: 'url'
                });
            });
        }

        // Sort by confidence and remove duplicates
        const uniqueSolutions = this.removeDuplicateSolutions(solutions);
        return uniqueSolutions.sort((a, b) => b.confidence - a.confidence);
    }

    /**
     * Remove duplicate solutions
     */
    removeDuplicateSolutions(solutions) {
        const seen = new Set();
        return solutions.filter(solution => {
            const key = solution.content.toLowerCase();
            if (seen.has(key)) {
                return false;
            }
            seen.add(key);
            return true;
        });
    }

    /**
     * Calculate overall confidence
     */
    calculateConfidence(researchResult) {
        let totalConfidence = 0;
        let sourceCount = 0;

        const sources = [
            researchResult.aiResearch,
            researchResult.webResearch,
            researchResult.browserResearch,
            researchResult.pythonResearch,
            researchResult.documentationResearch
        ];

        sources.forEach(source => {
            if (source?.success && source.confidence > 0) {
                totalConfidence += source.confidence;
                sourceCount++;
            }
        });

        return sourceCount > 0 ? totalConfidence / sourceCount : 0;
    }

    /**
     * Generate recommendations
     */
    generateRecommendations(researchResult) {
        const recommendations = [];

        if (researchResult.confidence > 0.8) {
            recommendations.push('High confidence solution found. Proceed with execution.');
        } else if (researchResult.confidence > 0.5) {
            recommendations.push('Moderate confidence solution found. Consider verification.');
        } else {
            recommendations.push('Low confidence solution. Manual verification recommended.');
        }

        if (researchResult.solutions.length > 3) {
            recommendations.push('Multiple solutions found. Try the highest confidence option first.');
        }

        if (researchResult.sourcesUsed.includes('browser')) {
            recommendations.push('Browser automation may be required for this solution.');
        }

        return recommendations;
    }

    /**
     * Get used sources
     */
    getUsedSources(researchResult) {
        const sources = [];
        
        if (researchResult.aiResearch?.success) sources.push('ai');
        if (researchResult.webResearch?.success) sources.push('web');
        if (researchResult.browserResearch?.success) sources.push('browser');
        if (researchResult.pythonResearch?.success) sources.push('python');
        if (researchResult.documentationResearch?.success) sources.push('documentation');

        return sources;
    }

    /**
     * Store in knowledge base
     */
    storeInKnowledgeBase(researchResult) {
        const key = `${researchResult.problem}_${Date.now()}`;
        this.researchHistory.set(key, researchResult);

        // Update successful sources
        researchResult.sourcesUsed.forEach(source => {
            const count = this.successfulSources.get(source) || 0;
            this.successfulSources.set(source, count + 1);
        });

        // Update patterns
        this.updateResearchPatterns(researchResult);
    }

    /**
     * Update research patterns
     */
    updateResearchPatterns(researchResult) {
        const patternKey = `${researchResult.problem.split(' ')[0]}_${researchResult.sourcesUsed.join('_')}`;
        
        if (!this.researchPatterns.has(patternKey)) {
            this.researchPatterns.set(patternKey, {
                count: 0,
                successRate: 0,
                avgConfidence: 0,
                lastUsed: new Date()
            });
        }

        const pattern = this.researchPatterns.get(patternKey);
        pattern.count++;
        pattern.successRate = (pattern.successRate * (pattern.count - 1) + (researchResult.success ? 1 : 0)) / pattern.count;
        pattern.avgConfidence = (pattern.avgConfidence * (pattern.count - 1) + researchResult.confidence) / pattern.count;
        pattern.lastUsed = new Date();
    }

    /**
     * Generate research ID
     */
    generateResearchId() {
        return `research_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Get research statistics
     */
    getResearchStatistics() {
        return {
            totalResearches: this.researchHistory.size,
            successfulSources: Object.fromEntries(this.successfulSources),
            researchPatterns: Object.fromEntries(this.researchPatterns),
            avgConfidence: this.calculateAverageConfidence(),
            topSources: this.getTopSources()
        };
    }

    /**
     * Calculate average confidence
     */
    calculateAverageConfidence() {
        const researches = Array.from(this.researchHistory.values());
        if (researches.length === 0) return 0;

        const totalConfidence = researches.reduce((sum, research) => sum + research.confidence, 0);
        return totalConfidence / researches.length;
    }

    /**
     * Get top sources
     */
    getTopSources() {
        return Array.from(this.successfulSources.entries())
            .sort(([,a], [,b]) => b - a)
            .slice(0, 3)
            .map(([source, count]) => ({ source, count }));
    }

    /**
     * Cleanup resources
     */
    async cleanup() {
        try {
            await this.browserAutomationService.close();
            await this.pythonToolManager.cleanup();
            console.log('[RESEARCH AGENT] Cleanup completed');
        } catch (error) {
            console.error('[RESEARCH AGENT] Cleanup failed:', error);
        }
    }
}

module.exports = ResearchAgent;
