import { chromium } from 'playwright';

export async function scrapeFalabella(productName) {
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();

    page.on('console', message => console.log('BROWSER-CONSOLE:', message.text()));

    console.log('Navegando a la página de Falabella...');
    await page.goto('https://www.falabella.com.co/falabella-co', { waitUntil: 'domcontentloaded' });
    console.log('Rellenando el campo de búsqueda...');
    await page.fill('#testId-SearchBar-Input', productName);
    console.log('Dando clic en el botón de "Buscar"...');
    await page.click('.SearchBar-module_searchBtnIcon__2L2s0');
    console.log('Esperando a que los resultados de búsqueda se carguen...');
    await page.waitForSelector('.jsx-2175680197.search-results--products', { timeout: 60000 });

    console.log('Extrayendo información de los productos...');
    try {
        const products = await page.$$eval('.jsx-2175680197.search-results--products .pod-subTitle', (nodes, productName) => {
            if (!nodes) {
                throw new Error('No se encontraron nodos con el selector proporcionado.');
            }
            // Extraer los productos y formatear la información
            const productList = nodes.map(node => {
                const title = node.innerText;
                let priceText = node.querySelector('.copy10')?.innerText || '';
                const price = parseFloat(priceText.replace(/[^\d,.-]+/g, '').replace(',', '.'));
                const formattedPrice = `${priceText}`;
                const image = node.querySelector('[id^="testId-pod-image"]')?.src;
                const link = node.querySelector('[id^="testId-pod-"]')?.href;
                return { title, priceText: formattedPrice, image, link };
            });

            // Filtrar los productos que coincidan con el nombre del producto proporcionado
            return productList.filter(product =>
                product.title.toLowerCase().includes(productName.toLowerCase())
            );
        }, productName);
    } catch (e) {
        console.error('Error al extraer la información de los productos:', e.message);
        await browser.close();
        throw e; // Lanza el error para manejarlo más arriba en la cadena de promesas
    }

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

export default scrapeFalabella;