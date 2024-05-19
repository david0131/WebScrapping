import { chromium } from 'playwright';

export async function scrapeAlkosto(productName) {
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();

    page.on('console', message => console.log('BROWSER-CONSOLE:', message.text()));

    console.log('Navegando a la página de Alkosto...');
    await page.goto('https://www.alkosto.com/', { waitUntil: 'domcontentloaded' });
    console.log('Rellenando el campo de búsqueda...');
    await page.fill('#js-site-search-input', productName);
    await page.evaluate(() => {
        document.querySelector('#js-search-button').disabled = false;
    });
    console.log('Dando clic en el botón de "Buscar"...');
    await page.click('#js-search-button');
    console.log('Esperando a que los resultados de búsqueda se carguen...');
    await page.waitForSelector('.ais-InfiniteHits-item', { timeout: 60000 });

    console.log('Extrayendo información de los productos...');
    let products = await page.$$eval('.ais-InfiniteHits-item', (nodes, productName) => {
        // Función para eliminar tildes
        function removeAccents(str) {
            return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        }

        const productNameNormalized = removeAccents(productName).toLowerCase().split(' ');

        // Extraer y filtrar los productos
        const productList = nodes.map(node => {
            const title = node.querySelector('.product__item__top__title')?.innerText || '';
            let priceText = node.querySelector('.product__price--discounts__price .price')?.innerText || '';
            const price = parseFloat(priceText.replace(/[^\d,.-]+/g, '').replace(',', '.'));
            const formattedPrice = `${priceText}`;
            const image = node.querySelector('.product__item__information__image img')?.src || '';
            const link = node.querySelector('.product__item__information__view-details a')?.href || '';
            const store = 'Alkosto';
            return { title, priceText: formattedPrice, price, image, link, store };
        }).filter(product => {
            const productTitleNormalized = removeAccents(product.title).toLowerCase();
            if (productTitleNormalized === productNameNormalized.join(' ')) {
                return true; // Si el título coincide exactamente, incluir el producto
            }
            // Si no coincide exactamente, buscar todas las palabras de productNameNormalized en el título
            return productNameNormalized.every(word => productTitleNormalized.includes(word));
        });

        return productList;
    }, productName);

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