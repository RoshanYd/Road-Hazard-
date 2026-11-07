const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
    page.on('requestfailed', request => {
        console.log('REQUEST FAILED:', request.url(), request.failure()?.errorText || request.response()?.status());
    });
    
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
    
    // Dump the body innerHTML to see if content is there
    const bodyHtml = await page.evaluate(() => document.body.innerHTML);
    console.log('BODY HTML LENGTH:', bodyHtml.length);
    console.log('BODY HTML START:', bodyHtml.substring(0, 500));
    
    await browser.close();
})();
