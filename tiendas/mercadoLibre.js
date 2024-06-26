import { chromium } from 'playwright';

export async function scrapeMercadoLibre(productName) {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    console.log('Navegando a la página de MercadoLibre...');
    await page.goto('https://www.mercadolibre.com.co/', { waitUntil: 'domcontentloaded' });

    console.log('Rellenando el campo de búsqueda...');
    await page.fill('input.nav-search-input', productName);
    console.log('Dando clic en el botón de "Buscar"...');
    await page.click('button.nav-search-btn');
    console.log('Esperando a que los resultados de búsqueda se carguen...');
    await page.waitForSelector('.ui-search-results.ui-search-results--without-disclaimer', { timeout: 60000 });
    await page.waitForTimeout(6000);

    console.log('Extrayendo información de los primeros 5 productos...');
    let products = await page.$$eval('.ui-search-layout__item.shops__layout-item.ui-search-layout__stack', (nodes, productName) => {
        // Función para eliminar tildes
        function removeAccents(str) {
            return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        }

        const productNameNormalized = removeAccents(productName).toLowerCase().split(' ');

        // Extraer y filtrar los primeros 5 productos que coincidan con el nombre del producto
        const productList = nodes.slice(0, 5).map(node => {
            const title = node.querySelector('section').getAttribute('aria-label') || '';

            const priceElement = node.querySelector('.andes-money-amount.ui-search-price__part--medium:not(.ui-search-price__part--small) .andes-money-amount__fraction');
            let priceText = '';
            if (priceElement) {
                priceText = priceElement.innerText.trim();
            }
            let cleanedPriceText = priceText.replace(/[^\d.,]+/g, '');
            cleanedPriceText = cleanedPriceText.replace(/\./g, '').replace(',', '.');
            const price = parseFloat(cleanedPriceText);
            const formattedPrice = `${priceText}`;

            const imageElement = node.querySelector('.ui-search-result-image__element');
            const imageSrc = imageElement ? imageElement.getAttribute('src') : '';
            const link = node.querySelector('a.ui-search-link')?.href || '';
            const store = 'MercadoLibre';
            return { title, priceText: formattedPrice, price, image: imageSrc, link, store };
        }).filter(product => {
            const productTitleNormalized = removeAccents(product.title).toLowerCase();
            // Comprobar si el nombre del producto incluye todas las partes del productNameNormalized
            return productNameNormalized.every(word => productTitleNormalized.includes(word));
        });

        return productList;
    }, productName);

    // De los productos filtrados, ordenar por precio y seleccionar los 3 más baratos
    const sortedProducts = products.sort((a, b) => a.price - b.price);
    const cheapestProducts = sortedProducts.slice(0, 3);

    // Mostrar precios por consola
    cheapestProducts.forEach(product => {
        console.log(`Producto: ${product.title}, Precio: ${product.priceText}`);
    });

    console.log('Cerrando el navegador MercadoLibre');
    await browser.close();
    console.log('Proceso completado. Devolviendo los productos...');
    return cheapestProducts;
}

export default scrapeMercadoLibre;
