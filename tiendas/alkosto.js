import { chromium } from 'playwright';

export async function scrapeAlkosto(productName) {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    await page.goto('https://www.alkosto.com/');
    await page.fill('input#search', productName);
    await page.press('input#search', 'Enter');
    await page.waitForSelector('.product-item');

    const products = await page.$$eval('.product-item', nodes => {
        return nodes.slice(0, 5).map(node => ({
            title: node.querySelector('.product-item-link')?.innerText,
            price: parseFloat(node.querySelector('.price')?.innerText.replace('.', '')),
            link: node.querySelector('.product-item-link')?.href,
            image: node.querySelector('.product-image-photo')?.src
        }));
    });

    await browser.close();
    return products.sort((a, b) => a.price - b.price).slice(0, 3);
}

export default scrapeAlkosto