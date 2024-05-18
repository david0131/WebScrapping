import { chromium } from 'playwright';

export async function scrapeAlkosto(productName) {
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();
    const productPrefix = productName.substring(0, 5);

    page.on('console', message => console.log('BROWSER-CONSOLE:', message.text()));

    console.log('Navegando a la página de Alkosto...');
    await page.goto('https://www.alkosto.com/', { waitUntil: 'domcontentloaded' });
    console.log('Rellenando el campo de búsqueda...');
    await page.$eval('#js-site-search-input', (element, value) => {
        element.value = value;
    }, productName);
    await page.evaluate(() => {
        document.querySelector('#js-search-button').disabled = false;
    });
    console.log('Dando clic en el botón de "Buscar"...');
    await page.click('#js-search-button');
    console.log('Esperando a que los resultados de búsqueda se carguen...');
    await page.waitForSelector('.ais-InfiniteHits-item', { timeout: 60000 });

    console.log('Extrayendo información de los productos...');
    const products = await page.$$eval('.ais-InfiniteHits-item', (nodes, productPrefix) => {
        // Extraer los productos y formatear la información
        const productList = nodes.slice(0, 5).map(node => {
            const title = node.querySelector('.product__item__top__title')?.innerText;
            let priceText = node.querySelector('.product__price--discounts__price .price')?.innerText || '';
            const price = parseFloat(priceText.replace(/[^\d,.-]+/g, '').replace(',', '.'));
            const formattedPrice = `${priceText}`;
            const image = node.querySelector('.product__item__information__image img')?.src;
            const link = node.querySelector('.product__item__information__view-details a')?.href;
            return { title, priceText: formattedPrice, image, link };
        });

        // Filtrar los productos que comienzan con el prefijo del producto proporcionado
        return productList.filter(product =>
            product.title.toLowerCase().startsWith(productPrefix.toLowerCase())
        );
    }, productPrefix);

    // Ordenar los productos por precio y seleccionar los 3 más baratos
    const sortedProducts = products.sort((a, b) => a.price - b.price);
    const cheapestProducts = sortedProducts.slice(0, 3);

    // Mostrar precios por consola
    cheapestProducts.forEach(product => {
        console.log(`Producto: ${product.title}, Precio: ${product.priceText}`);
    });

    console.log('Cerrando el navegador...');
    await browser.close();
    console.log('Proceso completado. Devolviendo los productos...');
    return cheapestProducts;
}

export default scrapeAlkosto;