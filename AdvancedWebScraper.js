const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs-extra');
const path = require('path');
const sanitize = require('sanitize-filename');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const chalk = require('chalk');
const ProgressBar = require('progress');
const puppeteer = require('puppeteer');

class AdvancedWebScraper {
    constructor(options = {}) {
        this.outputDir = options.outputDir || './scraped_data';
        this.baseDelay = options.delay || 3000;
        this.maxRetries = options.maxRetries || 5;
        this.sessionCookies = {};
        this.refererHistory = [];
        this.useBrowser = options.useBrowser || false;
        this.humanMode = options.humanMode || false;
        this.browser = null;
        this.page = null;
        
        this.userAgents = [
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/121.0',
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/120.0',
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/119.0',
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0',
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36 Edg/119.0.0.0',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
            'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
            
            'Mozilla/5.0 (X11; Linux x86_64; rv:109.0) Gecko/20100101 Firefox/121.0',
            'Mozilla/5.0 (X11; Linux x86_64; rv:109.0) Gecko/20100101 Firefox/120.0'
        ];
        
        this.currentUserAgent = this.getRandomUserAgent();
        fs.ensureDirSync(this.outputDir);
        fs.ensureDirSync(path.join(this.outputDir, 'json'));
        fs.ensureDirSync(path.join(this.outputDir, 'csv'));
        fs.ensureDirSync(path.join(this.outputDir, 'text'));
    }

    async initializeBrowser() {
        if (this.browser && this.page) return; // Already initialized
        
        console.log(chalk.blue('🚀 Launching browser for human simulation...'));
        
        try {
            this.browser = await puppeteer.launch({
                headless: 'new',
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-accelerated-2d-canvas',
                    '--no-first-run',
                    '--no-zygote',
                    '--disable-gpu',
                    '--disable-features=VizDisplayCompositor'
                ]
            });
            
            this.page = await this.browser.newPage();
            
            // Set random viewport to simulate different devices
            const viewports = [
                { width: 1920, height: 1080 },
                { width: 1366, height: 768 },
                { width: 1536, height: 864 },
                { width: 1440, height: 900 },
                { width: 1280, height: 720 }
            ];
            
            const viewport = this.customViewport || viewports[Math.floor(Math.random() * viewports.length)];
            await this.page.setViewport(viewport);
            
            // Set User-Agent
            await this.page.setUserAgent(this.currentUserAgent);
            
            console.log(chalk.green(`✅ Browser initialized with viewport ${viewport.width}x${viewport.height}`));
            
        } catch (error) {
            console.error(chalk.red(`❌ Failed to initialize browser: ${error.message}`));
            throw error;
        }
    }

    async closeBrowser() {
        if (this.browser) {
            await this.browser.close();
            this.browser = null;
            this.page = null;
            console.log(chalk.gray('🔒 Browser closed'));
        }
    }

    getRandomUserAgent() {
        return this.userAgents[Math.floor(Math.random() * this.userAgents.length)];
    }

    async simulateHumanMouseMovement(page) {
        const movements = Math.floor(Math.random() * 3) + 2;
        
        for (let i = 0; i < movements; i++) {
            const x = Math.floor(Math.random() * 800) + 100;
            const y = Math.floor(Math.random() * 600) + 100;
            
            await page.mouse.move(x, y, { steps: Math.floor(Math.random() * 10) + 5 });
            await this.delay(Math.random() * 500 + 200);
        }
    }

    async simulateHumanScrolling(page) {
        // Simulate human-like scrolling behavior
        const scrollSessions = Math.floor(Math.random() * 4) + 2; // 2-5 scroll sessions
        
        for (let session = 0; session < scrollSessions; session++) {
            const scrollDistance = Math.floor(Math.random() * 800) + 200; // 200-1000px
            const scrollSteps = Math.floor(Math.random() * 5) + 3; // 3-7 steps
            const stepDistance = scrollDistance / scrollSteps;
            
            for (let step = 0; step < scrollSteps; step++) {
                await page.evaluate((distance) => {
                    window.scrollBy(0, distance);
                }, stepDistance);
                
                // Random pause between scroll steps (mimics reading)
                await this.delay(Math.random() * 800 + 300); // 300-1100ms
            }
            
            // Pause between scroll sessions (mimics reading/thinking)
            if (session < scrollSessions - 1) {
                await this.delay(Math.random() * 2000 + 1000); // 1-3 seconds
            }
        }
        
        // Sometimes scroll back up (like humans do)
        if (Math.random() < 0.3) { // 30% chance
            await this.delay(Math.random() * 1000 + 500);
            await page.evaluate(() => {
                window.scrollBy(0, -Math.floor(Math.random() * 400) - 100);
            });
        }
    }

    async simulateReadingBehavior(page) {
        const readingSessions = Math.floor(Math.random() * 3) + 2;
        
        for (let session = 0; session < readingSessions; session++) {
            const focusAreas = [
                { x: Math.random() * 400 + 100, y: Math.random() * 300 + 100 },
                { x: Math.random() * 400 + 400, y: Math.random() * 300 + 200 },
                { x: Math.random() * 600 + 200, y: Math.random() * 400 + 300 }
            ];
            
            const area = focusAreas[Math.floor(Math.random() * focusAreas.length)];
            await page.mouse.move(area.x, area.y, { steps: Math.floor(Math.random() * 8) + 3 });
            
            const readingTime = Math.random() * 3000 + 1500;
            await this.delay(readingTime);
        }
    }

    async simulatePageExploration(page) {
        // Enhanced human exploration for human mode
        console.log(chalk.gray('     🔍 Checking page elements...'));
        
        // Simulate checking different sections
        const explorationPoints = [
            { x: 200, y: 150 },  // Header area
            { x: 400, y: 300 },  // Main content
            { x: 300, y: 500 },  // Middle content
            { x: 500, y: 700 },  // Lower content
            { x: 150, y: 400 }   // Sidebar/menu area
        ];
        
        for (const point of explorationPoints) {
            await page.mouse.move(point.x, point.y, { 
                steps: Math.floor(Math.random() * 12) + 8 
            });
            
            // Simulate brief pause as if reading/examining
            await this.delay(Math.random() * 1500 + 800); // 0.8-2.3 seconds
            
            // Sometimes simulate a hover
            if (Math.random() < 0.3) { // 30% chance
                await this.delay(Math.random() * 500 + 200); // Brief hover
            }
        }
        
        // Simulate checking the end of the page
        console.log(chalk.gray('     📄 Scrolling to bottom to check content length...'));
        await page.evaluate(() => {
            window.scrollTo(0, document.body.scrollHeight);
        });
        await this.delay(Math.random() * 2000 + 1000); // 1-3 seconds
        
        // Return to top
        await page.evaluate(() => {
            window.scrollTo(0, 0);
        });
        await this.delay(Math.random() * 1000 + 500); // 0.5-1.5 seconds
    }

    getRandomDelay() {
        // Random delay between baseDelay and baseDelay * 2
        return this.baseDelay + Math.random() * this.baseDelay;
    }

    async delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async simulateHumanBehavior(complexity = 'medium') {
        // Enhanced human behavior simulation with different complexity levels
        let baseReadingTime, variationRange;
        
        switch (complexity) {
            case 'simple':
                baseReadingTime = 1000;
                variationRange = 1000;
                break;
            case 'complex':
                baseReadingTime = 3000;
                variationRange = 4000;
                break;
            default: // medium
                baseReadingTime = 2000;
                variationRange = 2000;
        }
        
        const readingTime = Math.random() * variationRange + baseReadingTime;
        console.log(chalk.gray(`   📖 Simulating ${Math.round(readingTime/1000)}s reading time...`));
        await this.delay(readingTime);
    }

    async fetchPageWithBrowser(url, retries = 0) {
        try {
            await this.initializeBrowser();
            
            console.log(chalk.blue(`🌐 Browser fetching: ${url}`));
            
            // Navigate to page with random timeout
            const navigationTimeout = Math.random() * 10000 + 15000; // 15-25 seconds
            await this.page.goto(url, { 
                waitUntil: 'networkidle2', 
                timeout: navigationTimeout 
            });
            
            // Simulate human behavior on the page
            if (this.humanMode) {
                console.log(chalk.gray('   🧠 Enhanced human simulation mode active...'));
                console.log(chalk.gray('   ⏱️  Extended reading time simulation...'));
                await this.simulateReadingBehavior(this.page);
                
                console.log(chalk.gray('   🖱️  Natural mouse movements...'));
                await this.simulateHumanMouseMovement(this.page);
                
                console.log(chalk.gray('   📜 Realistic scrolling patterns...'));
                await this.simulateHumanScrolling(this.page);
                
                console.log(chalk.gray('   🔍 Page exploration simulation...'));
                await this.simulatePageExploration(this.page);
            } else {
                console.log(chalk.gray('   🖱️  Simulating mouse movements...'));
                await this.simulateHumanMouseMovement(this.page);
                
                console.log(chalk.gray('   📜 Simulating scrolling behavior...'));
                await this.simulateHumanScrolling(this.page);
                
                console.log(chalk.gray('   👁️  Simulating reading patterns...'));
                await this.simulateReadingBehavior(this.page);
            }
            
            // Get page content
            const html = await this.page.content();
            
            console.log(chalk.green(`✅ Browser Success: ${html.length} bytes`));
            
            // Random delay between pages
            const interPageDelay = this.getRandomDelay();
            console.log(chalk.gray(`   ⏱️  Inter-page delay: ${Math.round(interPageDelay/1000)}s`));
            await this.delay(interPageDelay);
            
            return html;
            
        } catch (error) {
            if (retries < this.maxRetries) {
                const waitTime = Math.pow(2, retries) * 3000 + Math.random() * 3000; // Enhanced backoff
                console.log(chalk.yellow(`⚠️  Browser retry ${retries + 1}/${this.maxRetries} for ${url}`));
                console.log(chalk.gray(`   Error: ${error.message}`));
                console.log(chalk.gray(`   Waiting ${Math.round(waitTime/1000)}s before retry...`));
                
                await this.delay(waitTime);
                return this.fetchPageWithBrowser(url, retries + 1);
            }
            throw error;
        }
    }

    buildAdvancedHeaders(url, isInitialRequest = false) {
        const urlObj = new URL(url);
        const headers = {
            'User-Agent': this.currentUserAgent,
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
            'DNT': '1',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': isInitialRequest ? 'none' : 'same-origin',
            'Sec-Fetch-User': '?1',
            'Cache-Control': 'max-age=0',
            'sec-ch-ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
            'sec-ch-ua-mobile': '?0',
            'sec-ch-ua-platform': '"Windows"'
        };

        // Add referer for non-initial requests
        if (!isInitialRequest && this.refererHistory.length > 0) {
            headers['Referer'] = this.refererHistory[this.refererHistory.length - 1];
        }

        // Add cookies if we have them
        if (this.sessionCookies[urlObj.hostname]) {
            headers['Cookie'] = this.sessionCookies[urlObj.hostname];
        }

        return headers;
    }

    extractCookies(response) {
        const setCookieHeader = response.headers['set-cookie'];
        if (setCookieHeader) {
            const urlObj = new URL(response.config.url);
            this.sessionCookies[urlObj.hostname] = setCookieHeader.map(cookie => cookie.split(';')[0]).join('; ');
        }
    }

    async fetchPage(url, retries = 0) {
        try {
            console.log(chalk.blue(`🌐 Fetching: ${url}`));
            
            // Enhanced User-Agent rotation strategy
            const rotationStrategies = [
                { chance: 0.05, reason: 'Random rotation' },
                { chance: 0.15, reason: 'New domain rotation' },
                { chance: 0.08, reason: 'Time-based rotation' }
            ];
            
            const shouldRotate = retries > 0 || 
                                Math.random() < 0.1 || 
                                (this.refererHistory.length > 0 && 
                                 new URL(url).hostname !== new URL(this.refererHistory[this.refererHistory.length - 1]).hostname);
            
            if (shouldRotate) {
                const oldUserAgent = this.currentUserAgent;
                this.currentUserAgent = this.getRandomUserAgent();
                
                // Ensure we get a different User-Agent
                let attempts = 0;
                while (this.currentUserAgent === oldUserAgent && attempts < 5) {
                    this.currentUserAgent = this.getRandomUserAgent();
                    attempts++;
                }
                
                console.log(chalk.gray(`🔄 Enhanced User-Agent rotation (${this.currentUserAgent.split(') ')[0]})...)`));
            }

            const isInitialRequest = this.refererHistory.length === 0;
            const headers = this.buildAdvancedHeaders(url, isInitialRequest);

            // Make request with advanced configuration
            const response = await axios.get(url, {
                headers: headers,
                timeout: 20000,
                maxRedirects: 5,
                validateStatus: (status) => status < 500,
                withCredentials: true,
                decompress: true
            });

            // Extract and store cookies
            this.extractCookies(response);

            // Update referer history
            this.refererHistory.push(url);
            if (this.refererHistory.length > 10) {
                this.refererHistory.shift(); // Keep only last 10 URLs
            }

            // Handle different response codes
            if (response.status === 403) {
                throw new Error(`Access forbidden - Anti-bot protection detected`);
            } else if (response.status === 404) {
                throw new Error(`Page not found`);
            } else if (response.status === 429) {
                throw new Error(`Rate limited - Requests too frequent`);
            } else if (response.status >= 400) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            console.log(chalk.green(`✅ Success: ${response.status} (${response.data.length} bytes)`));

            // Simulate human behavior
            await this.simulateHumanBehavior();
            
            return response.data;
        } catch (error) {
            if (retries < this.maxRetries) {
                const waitTime = Math.pow(2, retries) * 2000 + Math.random() * 2000; // Exponential backoff with jitter
                console.log(chalk.yellow(`⚠️  Retry ${retries + 1}/${this.maxRetries} for ${url}`));
                console.log(chalk.gray(`   Error: ${error.message}`));
                console.log(chalk.gray(`   Waiting ${Math.round(waitTime/1000)}s before retry...`));
                
                await this.delay(waitTime);
                return this.fetchPage(url, retries + 1);
            }
            throw error;
        }
    }

    extractWikiData(html, url) {
        const $ = cheerio.load(html);
        
        const data = {
            url: url,
            title: '',
            summary: '',
            content: '',
            sections: [],
            infobox: {},
            images: [],
            tables: [],
            links: [],
            metadata: {
                scrapedAt: new Date().toISOString(),
                wordCount: 0,
                sectionCount: 0
            }
        };

        // Extract title - try multiple selectors for Lines of Battle wiki
        const titleSelectors = [
            'h1.page-header__title',
            '.mw-page-title-main',
            'h1.firstHeading',
            '#firstHeading',
            'h1',
            '.page-title'
        ];

        for (const selector of titleSelectors) {
            const titleElement = $(selector).first();
            if (titleElement.length && titleElement.text().trim()) {
                data.title = titleElement.text().trim();
                break;
            }
        }

        // Extract main content
        const contentSelectors = [
            '.mw-parser-output',
            '.page-content',
            '.wiki-content',
            '.content',
            '#mw-content-text'
        ];

        let contentElement = null;
        for (const selector of contentSelectors) {
            contentElement = $(selector).first();
            if (contentElement.length) break;
        }

        if (contentElement) {
            // Extract paragraphs and lists
            const textElements = contentElement.find('p, ul, ol, dl').not('.navbox p, .infobox p');
            data.content = textElements.map((i, el) => $(el).text().trim()).get()
                                     .filter(text => text.length > 0)
                                     .join('\\n\\n');

            // Extract summary (first meaningful paragraph)
            const firstParagraph = contentElement.find('p').first();
            if (firstParagraph.length) {
                data.summary = firstParagraph.text().trim();
            }
        }

        // Extract sections
        $('h1, h2, h3, h4, h5, h6').each((i, el) => {
            const $el = $(el);
            const level = parseInt(el.tagName.substring(1));
            let title = $el.text().trim();
            
            // Clean up section titles
            title = title.replace(/\\[edit\\]/g, '').trim();
            
            if (title && !title.match(/^(references|external links|see also|notes)$/i)) {
                data.sections.push({
                    level: level,
                    title: title,
                    id: $el.attr('id') || ''
                });
            }
        });

        // Extract infobox data
        $('.infobox, .info-box, .data-box').each((i, el) => {
            const $box = $(el);
            $box.find('tr').each((j, row) => {
                const $row = $(row);
                const key = $row.find('th, .label').first().text().trim();
                const value = $row.find('td, .value').first().text().trim();
                if (key && value) {
                    data.infobox[key] = value;
                }
            });
        });

        // Extract images
        $('img').each((i, el) => {
            const $img = $(el);
            const src = $img.attr('src');
            const alt = $img.attr('alt') || '';
            const title = $img.attr('title') || '';
            
            if (src && !src.includes('logo') && !src.includes('icon') && !src.includes('ui-')) {
                data.images.push({
                    src: src.startsWith('//') ? 'https:' + src : src,
                    alt: alt,
                    title: title,
                    caption: $img.closest('figure, .thumb').find('.caption, figcaption').text().trim()
                });
            }
        });

        // Extract tables
        $('table').not('.navbox, .metadata').each((i, el) => {
            const $table = $(el);
            const tableData = [];
            
            $table.find('tr').each((j, row) => {
                const rowData = [];
                $(row).find('th, td').each((k, cell) => {
                    rowData.push($(cell).text().trim());
                });
                if (rowData.length > 0 && rowData.some(cell => cell.length > 0)) {
                    tableData.push(rowData);
                }
            });
            
            if (tableData.length > 0) {
                data.tables.push({
                    index: i,
                    data: tableData,
                    caption: $table.find('caption').text().trim()
                });
            }
        });

        // Extract internal links
        $('a[href*="/wiki/"], a[href^="/"], a[href*="wiki"]').each((i, el) => {
            const $link = $(el);
            const href = $link.attr('href');
            const text = $link.text().trim();
            
            if (href && text && !href.includes('Special:') && !href.includes('File:')) {
                let fullUrl = href;
                if (href.startsWith('/') && !href.startsWith('//')) {
                    // Relative URL - construct full URL
                    const urlObj = new URL(url);
                    fullUrl = `${urlObj.protocol}//${urlObj.host}${href}`;
                } else if (href.startsWith('//')) {
                    fullUrl = `https:${href}`;
                }
                
                data.links.push({
                    url: fullUrl,
                    text: text
                });
            }
        });

        // Calculate metadata
        data.metadata.wordCount = data.content ? data.content.split(/\s+/).filter(word => word.length > 0).length : 0;
        data.metadata.sectionCount = data.sections.length;
        data.metadata.imageCount = data.images.length;
        data.metadata.tableCount = data.tables.length;
        data.metadata.linkCount = data.links.length;

        return data;
    }

    async scrapePage(url, useBrowserFallback = true) {
        try {
            let html;
            let method = 'HTTP';
            
            // If humanMode is enabled, go directly to browser simulation
            if (this.humanMode) {
                console.log(chalk.blue(`👤 Human mode: Using browser simulation directly`));
                html = await this.fetchPageWithBrowser(url);
                method = 'Browser (Human Mode)';
            } else {
                // Try HTTP first, then fallback to browser if needed
                try {
                    html = await this.fetchPage(url);
                } catch (httpError) {
                    if (useBrowserFallback && (
                        httpError.message.includes('403') || 
                        httpError.message.includes('Access forbidden') ||
                        httpError.message.includes('anti-bot')
                    )) {
                        console.log(chalk.yellow(`⚠️  HTTP blocked, switching to browser simulation...`));
                        html = await this.fetchPageWithBrowser(url);
                        method = 'Browser';
                    } else {
                        throw httpError;
                    }
                }
            }
            
            const data = this.extractWikiData(html, url);
            data.metadata.scrapingMethod = method;
            
            // Save all content regardless of quality
            console.log(chalk.green(`📄 Extracted (${method}): "${data.title}" (${data.metadata.wordCount} words, ${data.metadata.sectionCount} sections)`));
            return data;
        } catch (error) {
            console.error(chalk.red(`❌ Failed to scrape ${url}: ${error.message}`));
            return null;
        }
    }

    async scrapeMultiplePages(urls, outputFormat = 'all', options = {}) {
        const results = [];
        const failedUrls = [];
        
        // Extract batch processing options
        const {
            batchDelay = 0,
            continueOnError = true,
            maxConcurrent = 1,
            showProgress = true
        } = options;
        
        console.log(chalk.blue(`🚀 Starting scrape of ${urls.length} URLs`));
        console.log(chalk.blue(`⏱️  Base delay: ${this.baseDelay}ms, Max retries: ${this.maxRetries}`));
        
        if (batchDelay > 0) {
            console.log(chalk.blue(`⏰ Batch delay: ${batchDelay}ms between URLs`));
        }
        
        if (maxConcurrent > 1) {
            console.log(chalk.blue(`🔀 Concurrent processing: ${maxConcurrent} URLs at once`));
        }
        
        console.log('');

        const progressBar = showProgress ? new ProgressBar('Scraping [:bar] :current/:total :percent :etas', {
            complete: '█',
            incomplete: '░',
            width: 30,
            total: urls.length
        }) : null;

        if (maxConcurrent === 1) {
            // Sequential processing (recommended for stealth)
            for (let i = 0; i < urls.length; i++) {
                const url = urls[i];
                
                try {
                    console.log(chalk.cyan(`\n[${i + 1}/${urls.length}] Processing: ${url}`));
                    const data = await this.scrapePage(url);
                    
                    if (data) {
                        results.push(data);
                        await this.saveData(data, outputFormat);
                        console.log(chalk.green(`✅ Successfully scraped: ${data.title}`));
                    } else {
                        failedUrls.push(url);
                        console.log(chalk.yellow(`⚠️  Skipped: ${url}`));
                    }
                    
                } catch (error) {
                    failedUrls.push(url);
                    console.error(chalk.red(`❌ Failed: ${url} - ${error.message}`));
                    
                    if (!continueOnError) {
                        console.log(chalk.red(`🛑 Stopping batch processing due to error`));
                        break;
                    }
                }
                
                if (progressBar) progressBar.tick();
                
                // Add batch delay and regular delay
                if (i < urls.length - 1) {
                    const totalDelay = this.getRandomDelay() + batchDelay;
                    if (totalDelay > 0) {
                        console.log(chalk.gray(`   ⏱️  Waiting ${Math.round(totalDelay/1000)}s before next URL...`));
                        await this.delay(totalDelay);
                    }
                }
            }
        } else {
            // Concurrent processing (use with caution for stealth)
            console.log(chalk.yellow(`⚠️  Using concurrent processing - may trigger anti-bot protection`));
            
            for (let i = 0; i < urls.length; i += maxConcurrent) {
                const batch = urls.slice(i, i + maxConcurrent);
                
                const batchPromises = batch.map(async (url, batchIndex) => {
                    try {
                        const globalIndex = i + batchIndex + 1;
                        console.log(chalk.cyan(`[${globalIndex}/${urls.length}] Processing: ${url}`));
                        
                        const data = await this.scrapePage(url);
                        if (data) {
                            await this.saveData(data, outputFormat);
                            console.log(chalk.green(`✅ [${globalIndex}] Success: ${data.title}`));
                            return { success: true, data, url };
                        } else {
                            console.log(chalk.yellow(`⚠️  [${globalIndex}] Skipped: ${url}`));
                            return { success: false, url };
                        }
                    } catch (error) {
                        console.error(chalk.red(`❌ [${i + batchIndex + 1}] Failed: ${url} - ${error.message}`));
                        return { success: false, url, error };
                    }
                });
                
                const batchResults = await Promise.all(batchPromises);
                
                // Process batch results
                batchResults.forEach(result => {
                    if (result.success && result.data) {
                        results.push(result.data);
                    } else {
                        failedUrls.push(result.url);
                    }
                    
                    if (progressBar) progressBar.tick();
                });
                
                // Delay between batches
                if (i + maxConcurrent < urls.length) {
                    const totalDelay = this.getRandomDelay() + batchDelay;
                    if (totalDelay > 0) {
                        console.log(chalk.gray(`   ⏱️  Batch delay: ${Math.round(totalDelay/1000)}s...`));
                        await this.delay(totalDelay);
                    }
                }
            }
        }

        // Save consolidated data
        if (results.length > 0) {
            console.log(chalk.blue(`\n💾 Saving consolidated data...`));
            await this.saveConsolidatedData(results, outputFormat);
        }

        this.printResults(results, failedUrls);
        return results;
    }

    async saveData(data, format = 'all') {
        const sanitizedTitle = sanitize(data.title || 'untitled');
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        
        if (format === 'all' || format === 'json') {
            const jsonPath = path.join(this.outputDir, 'json', `${sanitizedTitle}_${timestamp}.json`);
            await fs.writeJson(jsonPath, data, { spaces: 2 });
        }

        if (format === 'all' || format === 'csv') {
            const csvData = this.flattenDataForCSV(data);
            const csvPath = path.join(this.outputDir, 'csv', `${sanitizedTitle}_${timestamp}.csv`);
            
            const csvWriter = createCsvWriter({
                path: csvPath,
                header: Object.keys(csvData).map(key => ({ id: key, title: key }))
            });
            
            await csvWriter.writeRecords([csvData]);
        }

        if (format === 'all' || format === 'text') {
            const textContent = this.formatAsText(data);
            const textPath = path.join(this.outputDir, 'text', `${sanitizedTitle}_${timestamp}.txt`);
            await fs.writeFile(textPath, textContent, 'utf8');
        }
    }

    async saveConsolidatedData(results, format = 'all') {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

        if (format === 'all' || format === 'json') {
            const jsonPath = path.join(this.outputDir, `consolidated_${timestamp}.json`);
            await fs.writeJson(jsonPath, results, { spaces: 2 });
        }

        if (format === 'all' || format === 'csv') {
            const csvPath = path.join(this.outputDir, `consolidated_${timestamp}.csv`);
            const csvData = results.map(data => this.flattenDataForCSV(data));
            
            if (csvData.length > 0) {
                const csvWriter = createCsvWriter({
                    path: csvPath,
                    header: Object.keys(csvData[0]).map(key => ({ id: key, title: key }))
                });
                
                await csvWriter.writeRecords(csvData);
            }
        }

        if (format === 'all' || format === 'text') {
            const textContent = results.map(data => this.formatAsText(data)).join('\\n\\n' + '='.repeat(80) + '\\n\\n');
            const textPath = path.join(this.outputDir, `consolidated_${timestamp}.txt`);
            await fs.writeFile(textPath, textContent, 'utf8');
        }

        // Save AI training format (JSONL)
        const jsonlPath = path.join(this.outputDir, `training_dataset_${timestamp}.jsonl`);
        const jsonlContent = results.map(data => this.formatForTraining(data))
                                  .filter(item => item !== null)
                                  .map(item => JSON.stringify(item))
                                  .join('\\n');
        await fs.writeFile(jsonlPath, jsonlContent, 'utf8');
    }

    flattenDataForCSV(data) {
        return {
            url: data.url,
            title: data.title,
            summary: data.summary,
            content: data.content.substring(0, 32000),
            word_count: data.metadata.wordCount,
            section_count: data.metadata.sectionCount,
            image_count: data.metadata.imageCount,
            table_count: data.metadata.tableCount,
            link_count: data.metadata.linkCount,
            sections: data.sections.map(s => s.title).join('; '),
            scraped_at: data.metadata.scrapedAt
        };
    }

    formatAsText(data) {
        let text = `Title: ${data.title}\\n`;
        text += `URL: ${data.url}\\n`;
        text += `Scraped: ${data.metadata.scrapedAt}\\n`;
        text += `Word Count: ${data.metadata.wordCount}\\n\\n`;
        
        if (data.summary) {
            text += `Summary:\\n${data.summary}\\n\\n`;
        }
        
        text += `Content:\\n${data.content}\\n\\n`;
        
        if (data.sections.length > 0) {
            text += `Sections:\\n`;
            data.sections.forEach(section => {
                text += `${'#'.repeat(section.level)} ${section.title}\\n`;
            });
            text += '\\n';
        }
        
        return text;
    }

    formatForTraining(data) {
        if (!data.content || data.content.length < 100) {
            return null;
        }

        return {
            instruction: `Provide information about ${data.title}`,
            input: data.summary || data.content.substring(0, 500),
            output: data.content,
            metadata: {
                source: data.url,
                title: data.title,
                word_count: data.metadata.wordCount,
                sections: data.sections.map(s => s.title)
            }
        };
    }

    printResults(results, failedUrls) {
        console.log(chalk.green(`\\n🎉 Scraping completed!`));
        console.log(chalk.blue(`📊 Successfully scraped: ${results.length} pages`));
        
        if (results.length > 0) {
            const totalWords = results.reduce((sum, data) => sum + data.metadata.wordCount, 0);
            const totalSections = results.reduce((sum, data) => sum + data.metadata.sectionCount, 0);
            
            console.log(chalk.blue(`📝 Total words: ${totalWords.toLocaleString()}`));
            console.log(chalk.blue(`📑 Total sections: ${totalSections}`));
        }
        
        if (failedUrls.length > 0) {
            console.log(chalk.yellow(`\\n⚠️  Failed URLs (${failedUrls.length}):`));
            failedUrls.forEach(url => console.log(chalk.gray(`   - ${url}`)));
        }
        
        console.log(chalk.cyan(`\\n📁 Output saved to: ${this.outputDir}`));
    }

    async cleanup() {
        // Clean up browser resources
        await this.closeBrowser();
        
        // Clear session data
        this.sessionCookies = {};
        this.refererHistory = [];
        
        console.log(chalk.gray('✨ Cleanup completed'));
    }

    getStats() {
        return {
            userAgentsAvailable: this.userAgents.length,
            currentUserAgent: this.currentUserAgent,
            refererHistoryLength: this.refererHistory.length,
            sessionCookiesDomains: Object.keys(this.sessionCookies).length,
            browserActive: !!this.browser
        };
    }

    // Method to save progress during batch processing
    async saveProgress(processedUrls, failedUrls, totalUrls) {
        const progressData = {
            timestamp: new Date().toISOString(),
            totalUrls: totalUrls,
            processedUrls: processedUrls,
            failedUrls: failedUrls,
            remaining: totalUrls - processedUrls.length,
            successRate: ((processedUrls.length / totalUrls) * 100).toFixed(1)
        };
        
        const progressFile = path.join(this.outputDir, 'batch_progress.json');
        await fs.writeJson(progressFile, progressData, { spaces: 2 });
        
        console.log(chalk.gray(`💾 Progress saved: ${processedUrls.length}/${totalUrls} URLs processed`));
    }

    // Method to resume batch processing from where it left off
    async getProcessingProgress() {
        const progressFile = path.join(this.outputDir, 'batch_progress.json');
        
        if (await fs.pathExists(progressFile)) {
            const progress = await fs.readJson(progressFile);
            console.log(chalk.blue(`📋 Found previous batch progress:`));
            console.log(chalk.gray(`   Processed: ${progress.processedUrls.length}/${progress.totalUrls} URLs`));
            console.log(chalk.gray(`   Success Rate: ${progress.successRate}%`));
            console.log(chalk.gray(`   Last Run: ${new Date(progress.timestamp).toLocaleString()}`));
            
            return progress;
        }
        
        return null;
    }

}

module.exports = AdvancedWebScraper;
