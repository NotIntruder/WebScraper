const AdvancedWebScraper = require('./AdvancedWebScraper');
const yargs = require('yargs');
const chalk = require('chalk');
const fs = require('fs-extra');

const argv = yargs
    .option('urls', {
        alias: 'u',
        type: 'array',
        description: 'URLs to scrape from any website',
        demandOption: false
    })
    .option('file', {
        alias: 'f',
        type: 'string',
        description: 'File containing URLs (one per line)',
        demandOption: false
    })
    .option('output', {
        alias: 'o',
        type: 'string',
        description: 'Output directory',
        default: './scraped_data'
    })
    .option('format', {
        type: 'string',
        description: 'Output format (json, csv, text, all)',
        default: 'all',
        choices: ['json', 'csv', 'text', 'all']
    })
    .option('delay', {
        alias: 'd',
        type: 'number',
        description: 'Base delay between requests in milliseconds',
        default: 3000
    })
    .option('browser', {
        alias: 'b',
        type: 'boolean',
        description: 'Enable browser simulation mode for advanced anti-bot evasion',
        default: false
    })
    .option('stealth', {
        alias: 's',
        type: 'boolean',
        description: 'Enable maximum stealth mode (forces browser simulation)',
        default: false
    })
    .option('viewport', {
        type: 'string',
        description: 'Custom viewport size (e.g., 1920x1080)',
        default: null
    })
    .option('human', {
        alias: 'h',
        type: 'boolean',
        description: 'Enable human behavior simulation (browser + enhanced delays + stealth)',
        default: false
    })
    .option('batch-delay', {
        type: 'number',
        description: 'Additional delay between each URL in batch processing (ms)',
        default: 0
    })
    .option('continue-on-error', {
        type: 'boolean',
        description: 'Continue processing remaining URLs if one fails',
        default: true
    })
    .option('max-concurrent', {
        type: 'number',
        description: 'Maximum number of concurrent requests (1 for sequential)',
        default: 1
    })
    .help()
    .argv;

async function main() {
    console.log(chalk.cyan('🏛️  Advanced Web Scraper v2.0'));
    console.log(chalk.cyan('==================================\n'));

    // Parse viewport if provided
    let viewport = null;
    if (argv.viewport) {
        const [width, height] = argv.viewport.split('x').map(Number);
        if (width && height) {
            viewport = { width, height };
        } else {
            console.log(chalk.yellow('⚠️  Invalid viewport format. Use format: 1920x1080'));
        }
    }

    let enhancedDelay = argv.delay;
    let useBrowserMode = argv.browser || argv.stealth || argv.human;
    
    if (argv.human) {
        enhancedDelay = Math.max(argv.delay, 5000);
        if (!argv['batch-delay']) {
            argv['batch-delay'] = 3000;
        }
    }

    const scraper = new AdvancedWebScraper({
        outputDir: argv.output,
        delay: enhancedDelay,
        useBrowser: useBrowserMode,
        humanMode: argv.human
    });

    if (viewport) {
        scraper.customViewport = viewport;
    }

    if (argv.human) {
        console.log(chalk.blue('👤 Human behavior simulation enabled'));
        console.log(chalk.gray('   🧠 Enhanced delays for natural behavior'));
        console.log(chalk.gray('   🖱️  Mouse movements and scrolling simulation'));
        console.log(chalk.gray('   👁️  Reading pattern simulation'));
        console.log(chalk.gray('   🔄 Advanced User-Agent rotation'));
    } else if (argv.stealth) {
        console.log(chalk.blue('🥷 Maximum stealth mode enabled'));
    } else if (argv.browser) {
        console.log(chalk.blue('🤖 Browser simulation mode enabled'));
    }

    // Display configuration after setup
    const stats = scraper.getStats();
    console.log(chalk.gray(`📊 Configuration:`));
    console.log(chalk.gray(`   User-Agents: ${stats.userAgentsAvailable} available`));
    
    let modeDescription = 'HTTP Only';
    if (argv.human) modeDescription = 'Human Simulation';
    else if (argv.stealth) modeDescription = 'Maximum Stealth';
    else if (argv.browser) modeDescription = 'Browser Automation';
    
    console.log(chalk.gray(`   Mode: ${modeDescription}`));
    console.log(chalk.gray(`   Base Delay: ${enhancedDelay}ms`));
    console.log(chalk.gray(`   Output Format: ${argv.format}`));
    console.log('');

    let urls = [];

    if (argv.urls) {
        urls = argv.urls;
    } else if (argv.file) {
        try {
            const fileContent = await fs.readFile(argv.file, 'utf8');
            
            // Enhanced URL parsing with better validation
            const rawUrls = fileContent.split('\n')
                                     .map(line => line.trim())
                                     .filter(line => line && !line.startsWith('#')) // Allow comments
                                     .filter(line => line.startsWith('http'));
            
            urls = rawUrls;
            
            console.log(chalk.blue(`📄 Loaded ${urls.length} URLs from ${argv.file}`));
            
            // Show preview of URLs if there are many
            if (urls.length > 5) {
                console.log(chalk.gray('   Preview:'));
                urls.slice(0, 3).forEach((url, i) => {
                    console.log(chalk.gray(`     ${i + 1}. ${url.substring(0, 60)}${url.length > 60 ? '...' : ''}`));
                });
                console.log(chalk.gray(`     ... and ${urls.length - 3} more URLs`));
            } else {
                urls.forEach((url, i) => {
                    console.log(chalk.gray(`   ${i + 1}. ${url}`));
                });
            }
            console.log('');
            
        } catch (error) {
            console.error(chalk.red(`❌ Error reading file ${argv.file}: ${error.message}`));
            console.log(chalk.yellow('\n💡 Tips for creating a URL file:'));
            console.log(chalk.gray('  • One URL per line'));
            console.log(chalk.gray('  • URLs must start with http:// or https://'));
            console.log(chalk.gray('  • Lines starting with # are treated as comments'));
            console.log(chalk.gray('  • Empty lines are ignored'));
            process.exit(1);
        }
    } else {
        console.log(chalk.yellow('📋 No URLs provided. Please specify URLs to scrape.'));
        console.log(chalk.blue('\nUsage examples:'));
        console.log(chalk.gray('  node index.js --urls https://example.com/page1 https://example.com/page2'));
        console.log(chalk.gray('  node index.js --file urls.txt'));
        console.log(chalk.gray('  node index.js --file batch_urls.txt --stealth --batch-delay 5000'));
        console.log(chalk.gray('  node index.js --urls https://some-wiki.com/page --delay 5000'));
        
        console.log(chalk.blue('\n📝 URL file format:'));
        console.log(chalk.gray('  # This is a comment'));
        console.log(chalk.gray('  https://site1.com/page1'));
        console.log(chalk.gray('  https://site2.com/page2'));
        console.log(chalk.gray('  # Another comment'));
        console.log(chalk.gray('  https://site3.com/page3'));
        process.exit(0);
    }

    if (urls.length === 0) {
        console.error(chalk.red('❌ No valid URLs found to scrape.'));
        process.exit(1);
    }

    console.log(chalk.green(`🎯 Found ${urls.length} URLs to scrape:`));
    urls.forEach((url, index) => {
        console.log(chalk.gray(`  ${index + 1}. ${url}`));
    });
    console.log();

    try {
        // Prepare batch processing options
        const batchOptions = {
            batchDelay: argv['batch-delay'] || 0,
            continueOnError: argv['continue-on-error'],
            maxConcurrent: argv['max-concurrent'] || 1,
            showProgress: true
        };

        console.log(chalk.blue(`📊 Batch Processing Configuration:`));
        console.log(chalk.gray(`   Continue on Error: ${batchOptions.continueOnError ? 'Yes' : 'No'}`));
        console.log(chalk.gray(`   Max Concurrent: ${batchOptions.maxConcurrent}`));
        if (batchOptions.batchDelay > 0) {
            console.log(chalk.gray(`   Batch Delay: ${batchOptions.batchDelay}ms`));
        }
        console.log('');

        const results = await scraper.scrapeMultiplePages(urls, argv.format, batchOptions);
        
        if (results.length > 0) {
            console.log(chalk.green('\n✅ Scraping completed successfully!'));
            console.log(chalk.cyan('\n📂 Generated files:'));
            console.log(chalk.gray('  ├── json/ (structured data for each page)'));
            console.log(chalk.gray('  ├── csv/ (tabular data)'));
            console.log(chalk.gray('  ├── text/ (plain text content)'));
            console.log(chalk.gray('  ├── consolidated_*.json (all data combined)'));
            console.log(chalk.gray('  ├── consolidated_*.csv (all data in CSV)'));
            console.log(chalk.gray('  ├── consolidated_*.txt (all text combined)'));
            console.log(chalk.gray('  └── training_dataset_*.jsonl (AI training format)'));
        } else {
            console.log(chalk.red('\n❌ No pages were successfully scraped.'));
            console.log(chalk.yellow('This may be due to:'));
            console.log(chalk.gray('  • Anti-bot protection blocking requests'));
            console.log(chalk.gray('  • Invalid or non-existent URLs'));
            console.log(chalk.gray('  • Network connectivity issues'));
            console.log(chalk.gray('  • Server-side restrictions'));
        }

    } catch (error) {
        console.error(chalk.red(`\n❌ Error during scraping: ${error.message}`));
        
        // Ensure cleanup even on error
        try {
            await scraper.cleanup();
        } catch (cleanupError) {
            console.error(chalk.gray(`Warning: Cleanup error: ${cleanupError.message}`));
        }
        
        process.exit(1);
    } finally {
        // Always perform cleanup
        try {
            await scraper.cleanup();
        } catch (cleanupError) {
            console.error(chalk.gray(`Warning: Cleanup error: ${cleanupError.message}`));
        }
    }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', async (reason, promise) => {
    console.error(chalk.red('Unhandled Rejection at:', promise, 'reason:', reason));
    process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', async (error) => {
    console.error(chalk.red('Uncaught Exception:', error));
    process.exit(1);
});

// Handle process termination signals
process.on('SIGINT', async () => {
    console.log(chalk.yellow('\n⚠️  Received SIGINT, cleaning up...'));
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log(chalk.yellow('\n⚠️  Received SIGTERM, cleaning up...'));
    process.exit(0);
});

if (require.main === module) {
    main();
}

module.exports = { AdvancedWebScraper };
