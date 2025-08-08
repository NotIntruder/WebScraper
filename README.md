# Advanced Web Scraper

A sophisticated Node.js web scraper with human behavior simulation and anti-bot evasion.

## Features

- **Human Behavior Simulation**: Mouse movements, scrolling, reading patterns
- **Anti-Bot Evasion**: Browser automation, User-Agent rotation, session management
- **Batch Processing**: Process multiple URLs from files
- **Multiple Formats**: JSON, CSV, Text, JSONL output
- **Error Handling**: Continue on errors, retry logic

## Quick Start

```bash
npm install
```

## Usage

### Single URL
```bash
node index.js --urls https://example.com --human
```

### Batch Processing
```bash
node index.js --file urls.txt --human --format json
```

### Advanced Options
```bash
node index.js --file urls.txt --human --batch-delay 5000 --continue-on-error
```

## Parameters

- `--urls`: Single or multiple URLs
- `--file`: File containing URLs (one per line)
- `--human`: Enable human behavior simulation
- `--format`: Output format (json, csv, text, all)
- `--batch-delay`: Delay between URLs (ms)
- `--continue-on-error`: Don't stop on errors
- `--output`: Output directory

## URL File Format

```
# Comments start with #
https://site1.com/page1
https://site2.com/page2
```

Perfect for scraping wikis, documentation, and other content-rich sites while avoiding detection.
