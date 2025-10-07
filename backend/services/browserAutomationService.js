/**
 * Browser Automation Service
 * Puppeteer-based browser automation with stealth capabilities
 */

const puppeteer = require('puppeteer');
const puppeteerExtra = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

// Add stealth plugin
puppeteerExtra.use(StealthPlugin());

class BrowserAutomationService {
    constructor() {
        this.browser = null;
        this.page = null;
        this.isInitialized = false;
        this.defaultOptions = {
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--no-zygote',
                '--disable-gpu',
                '--disable-web-security',
                '--disable-features=VizDisplayCompositor'
            ],
            ignoreDefaultArgs: ['--enable-automation'],
            ignoreHTTPSErrors: true
        };
    }

    /**
     * Initialize browser instance
     */
    async initialize(options = {}) {
        try {
            if (this.isInitialized && this.browser) {
                return { success: true, message: 'Browser already initialized' };
            }

            console.log('[BROWSER AUTOMATION] Initializing browser...');
            
            const launchOptions = { ...this.defaultOptions, ...options };
            this.browser = await puppeteerExtra.launch(launchOptions);
            
            this.page = await this.browser.newPage();
            
            // Set viewport and user agent
            await this.page.setViewport({ width: 1920, height: 1080 });
            await this.page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
            
            // Set extra headers
            await this.page.setExtraHTTPHeaders({
                'Accept-Language': 'en-US,en;q=0.9',
                'Accept-Encoding': 'gzip, deflate, br',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8'
            });

            this.isInitialized = true;
            console.log('[BROWSER AUTOMATION] Browser initialized successfully');
            
            return { success: true, message: 'Browser initialized successfully' };
        } catch (error) {
            console.error('[BROWSER AUTOMATION] Initialization failed:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Navigate to URL and handle common issues
     */
    async navigateToUrl(url, options = {}) {
        try {
            if (!this.isInitialized) {
                await this.initialize();
            }

            console.log(`[BROWSER AUTOMATION] Navigating to: ${url}`);
            
            const navigationOptions = {
                waitUntil: 'networkidle2',
                timeout: 30000,
                ...options
            };

            const response = await this.page.goto(url, navigationOptions);
            
            // Handle common issues
            await this.handleCommonIssues();
            
            return {
                success: true,
                url: this.page.url(),
                status: response.status(),
                title: await this.page.title()
            };
        } catch (error) {
            console.error(`[BROWSER AUTOMATION] Navigation failed: ${error.message}`);
            return { success: false, error: error.message };
        }
    }

    /**
     * Handle common browser issues (captcha, popups, etc.)
     */
    async handleCommonIssues() {
        try {
            // Handle popups
            await this.handlePopups();
            
            // Handle cookie consent
            await this.handleCookieConsent();
            
            // Handle captcha detection
            await this.handleCaptcha();
            
            // Handle age verification
            await this.handleAgeVerification();
            
        } catch (error) {
            console.log(`[BROWSER AUTOMATION] Issue handling failed: ${error.message}`);
        }
    }

    /**
     * Handle popup dialogs
     */
    async handlePopups() {
        try {
            // Handle alert dialogs
            this.page.on('dialog', async dialog => {
                console.log(`[BROWSER AUTOMATION] Dialog detected: ${dialog.message()}`);
                await dialog.accept();
            });

            // Close any popup windows
            const pages = await this.browser.pages();
            for (const page of pages) {
                if (page !== this.page) {
                    await page.close();
                }
            }
        } catch (error) {
            console.log(`[BROWSER AUTOMATION] Popup handling failed: ${error.message}`);
        }
    }

    /**
     * Handle cookie consent banners
     */
    async handleCookieConsent() {
        try {
            const cookieSelectors = [
                'button[id*="cookie"]',
                'button[class*="cookie"]',
                'button[id*="consent"]',
                'button[class*="consent"]',
                'button[id*="accept"]',
                'button[class*="accept"]',
                'button:contains("Accept")',
                'button:contains("OK")',
                'button:contains("I agree")'
            ];

            for (const selector of cookieSelectors) {
                try {
                    const element = await this.page.$(selector);
                    if (element) {
                        await element.click();
                        console.log(`[BROWSER AUTOMATION] Clicked cookie consent: ${selector}`);
                        await this.page.waitForTimeout(1000);
                        break;
                    }
                } catch (error) {
                    // Continue to next selector
                }
            }
        } catch (error) {
            console.log(`[BROWSER AUTOMATION] Cookie consent handling failed: ${error.message}`);
        }
    }

    /**
     * Detect and handle captcha
     */
    async handleCaptcha() {
        try {
            const captchaSelectors = [
                'iframe[src*="recaptcha"]',
                'div[id*="captcha"]',
                'div[class*="captcha"]',
                'iframe[src*="hcaptcha"]'
            ];

            for (const selector of captchaSelectors) {
                const element = await this.page.$(selector);
                if (element) {
                    console.log(`[BROWSER AUTOMATION] Captcha detected: ${selector}`);
                    // For now, just log it - in production, you might want to use a captcha solving service
                    return { hasCaptcha: true, selector: selector };
                }
            }

            return { hasCaptcha: false };
        } catch (error) {
            console.log(`[BROWSER AUTOMATION] Captcha detection failed: ${error.message}`);
            return { hasCaptcha: false };
        }
    }

    /**
     * Handle age verification
     */
    async handleAgeVerification() {
        try {
            const ageSelectors = [
                'button:contains("I am 18")',
                'button:contains("I am 21")',
                'button:contains("Yes")',
                'button:contains("Continue")',
                'input[type="checkbox"]'
            ];

            for (const selector of ageSelectors) {
                try {
                    const element = await this.page.$(selector);
                    if (element) {
                        await element.click();
                        console.log(`[BROWSER AUTOMATION] Clicked age verification: ${selector}`);
                        await this.page.waitForTimeout(1000);
                        break;
                    }
                } catch (error) {
                    // Continue to next selector
                }
            }
        } catch (error) {
            console.log(`[BROWSER AUTOMATION] Age verification handling failed: ${error.message}`);
        }
    }

    /**
     * Find and click download buttons
     */
    async findAndClickDownload(options = {}) {
        try {
            const downloadSelectors = [
                'a[href*="download"]',
                'button:contains("Download")',
                'a:contains("Download")',
                'button[id*="download"]',
                'a[id*="download"]',
                'button[class*="download"]',
                'a[class*="download"]',
                'a[href*=".exe"]',
                'a[href*=".msi"]',
                'a[href*=".zip"]',
                'a[href*=".dmg"]',
                'a[href*=".pkg"]'
            ];

            for (const selector of downloadSelectors) {
                try {
                    const element = await this.page.$(selector);
                    if (element) {
                        const href = await this.page.evaluate(el => el.href, element);
                        const text = await this.page.evaluate(el => el.textContent, element);
                        
                        console.log(`[BROWSER AUTOMATION] Found download link: ${text} -> ${href}`);
                        
                        // Click the download link
                        await element.click();
                        
                        // Wait for download to start
                        await this.page.waitForTimeout(2000);
                        
                        return {
                            success: true,
                            downloadUrl: href,
                            buttonText: text,
                            selector: selector
                        };
                    }
                } catch (error) {
                    console.log(`[BROWSER AUTOMATION] Failed to click ${selector}: ${error.message}`);
                }
            }

            return { success: false, error: 'No download button found' };
        } catch (error) {
            console.error(`[BROWSER AUTOMATION] Download button search failed: ${error.message}`);
            return { success: false, error: error.message };
        }
    }

    /**
     * Fill form fields
     */
    async fillForm(formData, options = {}) {
        try {
            const results = [];

            for (const field of formData) {
                try {
                    const { selector, value, type = 'input' } = field;
                    
                    if (type === 'input') {
                        await this.page.type(selector, value);
                    } else if (type === 'select') {
                        await this.page.select(selector, value);
                    } else if (type === 'checkbox') {
                        const element = await this.page.$(selector);
                        if (element) {
                            await element.click();
                        }
                    }
                    
                    results.push({ field: selector, success: true });
                } catch (error) {
                    results.push({ field: field.selector, success: false, error: error.message });
                }
            }

            return { success: true, results: results };
        } catch (error) {
            console.error(`[BROWSER AUTOMATION] Form filling failed: ${error.message}`);
            return { success: false, error: error.message };
        }
    }

    /**
     * Execute JavaScript on the page
     */
    async executeScript(script, options = {}) {
        try {
            const result = await this.page.evaluate(script);
            return { success: true, result: result };
        } catch (error) {
            console.error(`[BROWSER AUTOMATION] Script execution failed: ${error.message}`);
            return { success: false, error: error.message };
        }
    }

    /**
     * Take screenshot
     */
    async takeScreenshot(options = {}) {
        try {
            const screenshotOptions = {
                path: options.path || `screenshot_${Date.now()}.png`,
                fullPage: options.fullPage || false,
                ...options
            };

            await this.page.screenshot(screenshotOptions);
            
            return {
                success: true,
                path: screenshotOptions.path
            };
        } catch (error) {
            console.error(`[BROWSER AUTOMATION] Screenshot failed: ${error.message}`);
            return { success: false, error: error.message };
        }
    }

    /**
     * Wait for element to appear
     */
    async waitForElement(selector, options = {}) {
        try {
            const waitOptions = {
                timeout: 10000,
                ...options
            };

            await this.page.waitForSelector(selector, waitOptions);
            return { success: true };
        } catch (error) {
            console.error(`[BROWSER AUTOMATION] Element wait failed: ${error.message}`);
            return { success: false, error: error.message };
        }
    }

    /**
     * Get page content
     */
    async getPageContent(options = {}) {
        try {
            const content = await this.page.content();
            const title = await this.page.title();
            const url = this.page.url();
            
            return {
                success: true,
                content: content,
                title: title,
                url: url
            };
        } catch (error) {
            console.error(`[BROWSER AUTOMATION] Content extraction failed: ${error.message}`);
            return { success: false, error: error.message };
        }
    }

    /**
     * Extract download links from page
     */
    async extractDownloadLinks(options = {}) {
        try {
            const links = await this.page.evaluate(() => {
                const downloadLinks = [];
                const links = document.querySelectorAll('a[href]');
                
                links.forEach(link => {
                    const href = link.href;
                    const text = link.textContent.trim();
                    
                    // Check if it's a download link
                    if (href.includes('download') || 
                        href.includes('.exe') || 
                        href.includes('.msi') || 
                        href.includes('.zip') || 
                        href.includes('.dmg') ||
                        text.toLowerCase().includes('download')) {
                        downloadLinks.push({
                            url: href,
                            text: text,
                            filename: href.split('/').pop()
                        });
                    }
                });
                
                return downloadLinks;
            });

            return { success: true, links: links };
        } catch (error) {
            console.error(`[BROWSER AUTOMATION] Link extraction failed: ${error.message}`);
            return { success: false, error: error.message };
        }
    }

    /**
     * Close browser
     */
    async close() {
        try {
            if (this.browser) {
                await this.browser.close();
                this.browser = null;
                this.page = null;
                this.isInitialized = false;
                console.log('[BROWSER AUTOMATION] Browser closed');
            }
        } catch (error) {
            console.error(`[BROWSER AUTOMATION] Close failed: ${error.message}`);
        }
    }

    /**
     * Get browser status
     */
    getStatus() {
        return {
            initialized: this.isInitialized,
            hasBrowser: !!this.browser,
            hasPage: !!this.page,
            url: this.page ? this.page.url() : null
        };
    }
}

module.exports = BrowserAutomationService;
