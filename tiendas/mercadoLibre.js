import { chromium } from 'playwright';

export async function scrapeMercadoLibre(productName) {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    await page.goto('https://www.mercadolibre.com.co/');
    await page.fill('input.nav-search-input', productName);
    await page.press('input.nav-search-input', 'Enter');
    await page.waitForSelector('.ui-search-result__content');

    const products = await page.$$eval('.ui-search-result__content', nodes => {
        return nodes.slice(0, 5).map(node => ({
            title: node.querySelector('.ui-search-item__title')?.innerText,
            price: parseFloat(node.querySelector('.price-tag-fraction')?.innerText.replace('.', '')),
            link: node.querySelector('a')?.href,
            image: node.querySelector('.ui-search-result-image__element')?.src
        }));
    });

    await browser.close();
    return products.sort((a, b) => a.price - b.price).slice(0, 3);
}

export default scrapeMercadoLibre