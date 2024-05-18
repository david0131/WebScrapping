import { chromium } from 'playwright';

export async function scrapeMercadoLibre(productName) {
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();

    page.on('console', message => console.log('BROWSER-CONSOLE:', message.text()));

    console.log('Navegando a la página de MercadoLibre...');
    await page.goto('https://www.mercadolibre.com.co/', { waitUntil: 'domcontentloaded' });
    console.log('Rellenando el campo de búsqueda...');
    await page.fill('#cb1-edit', productName);
    console.log('Presionando Enter...');
    await page.press('#cb1-edit', 'Enter');
    console.log('Esperando a que los resultados de búsqueda se carguen...');
    await page.waitForSelector('.ui-search-layout__item', { timeout: 60000 });

    console.log('Extrayendo información de los productos...');
    const products = await page.$$eval('.ui-search-layout__item', nodes => {
        // Extrae los primeros 5 productos y sus precios
        let productList = nodes.slice(0, 5).map(node => {
            const title = node.querySelector('.ui-search-item__title')?.innerText;
            const priceText = node.querySelector('.price-tag-fraction')?.innerText;
            const price = parseFloat(priceText.replace(/\$|\./g, '').trim()); // Convierte el texto del precio a un número
            const image = node.querySelector('.ui-search-result-image__element img')?.src;
            const link = node.querySelector('.ui-search-link')?.href;
            return { title, price, image, link };
        });
        // Ordena los productos por precio y devuelve los 3 más baratos
        return productList.sort((a, b) => a.price - b.price).slice(0, 3);
    });
    

    console.log('Cerrando el navegador...');
    await browser.close();
    console.log('Proceso completado. Devolviendo los productos...');
    return products.sort((a, b) => a.price - b.price).slice(0, 3);

}

export default scrapeMercadoLibre;