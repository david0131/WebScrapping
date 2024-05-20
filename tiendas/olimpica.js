import { chromium } from 'playwright';

export async function scrapeOlimpica(productName) {
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();

    page.on('console', message => console.log('BROWSER-CONSOLE:', message.text()));

    console.log('Navegando a la página de Olímpica...');
    await page.goto('https://www.olimpica.com/', { waitUntil: 'domcontentloaded' });

    await page.waitForTimeout(3500);

    console.log('Rellenando el campo de búsqueda...');
    await page.fill('input.vtex-styleguide-9-x-input', productName);

    console.log('Dando Enter...');
    await page.keyboard.press('Enter');

    console.log('Esperando a que los resultados de búsqueda se carguen...');
    try {
        await page.waitForSelector('.vtex-product-summary-2-x-clearLink', { timeout: 60000 });
    } catch (error) {
        console.error('Error: No se encontraron resultados de búsqueda dentro del tiempo esperado.');
        await browser.close();
        return [];
    }

    console.log('Realizando scroll down en la página de resultados...');
    const scrollHeight = await page.evaluate(() => document.documentElement.scrollHeight);
    await page.mouse.wheel(0, scrollHeight * 0.5);

    console.log('Esperando antes de hacer otro scroll...');
    await page.waitForTimeout(3000);

    console.log('Realizando segundo scroll down...');
    await page.mouse.wheel(0, scrollHeight * 0.3);

    console.log('Esperando antes de volver al inicio...');
    await page.waitForTimeout(3000);

    console.log('Volviendo al inicio de la página...');
    await page.mouse.wheel(0, -scrollHeight * 1.3); // Ajusta este valor si es necesario

    await page.waitForTimeout(3000);

    await page.waitForSelector('.vtex-product-summary-2-x-clearLink', { timeout: 60000 });

    console.log('Extrayendo información de los productos...');
    let products = [];
    try {
        while (products.length < 5) {
            let newProducts = await page.$$eval('.vtex-product-summary-2-x-clearLink', (nodes, productName) => {
                // Función para remover acentos y normalizar texto
                function removeAccents(str) {
                    if (typeof str === 'string') {
                        return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                    } else {
                        console.error('removeAccents espera una cadena como argumento');
                        return ''; // o manejar el error de manera adecuada
                    }
                }

                const productNameNormalized = removeAccents(productName).toLowerCase().split(' ');

                const productList = nodes.map(node => {
                    const titleElement = node.querySelector('.vtex-product-summary-2-x-productNameContainer span');
                    const title = titleElement ? titleElement.innerText.trim() : '';

                    const priceElement = node.querySelector('.vtex-product-price-1-x-sellingPrice--hasListPrice--dynamicF');
                    let priceText = '';
                    if (priceElement) {
                        priceText = priceElement.innerText.trim(); // Utiliza innerText para obtener todo el texto del div
                    }
                    const price = parseFloat(priceText.replace(/[^\d,.-]+/g, '').replace(',', '.'));
                    const formattedPrice = `${priceText}`;

                    const imageElement = node.querySelector('.vtex-product-summary-2-x-imageNormal');
                    const imageSrc = imageElement ? imageElement.getAttribute('src') : '';

                    const link = node.getAttribute('href') || '';
                    const fullLink = `https://www.olimpica.com${link}`;

                    const store = 'Olímpica';
                    return { title, priceText: formattedPrice, price, image: imageSrc, link: fullLink, store };
                }).filter(product => {
                    const productTitleNormalized = removeAccents(product.title).toLowerCase();
                    return !productTitleNormalized.includes("reacondicionado") && productNameNormalized.every(word => productTitleNormalized.includes(word));
                });

                return productList;
            }, { productName });

            // Filtrar solo nuevos productos que no estén en la lista
            newProducts = newProducts.filter(newProduct => !products.some(product => product.title === newProduct.title));

            products = [...products, ...newProducts];

            if (products.length >= 3) {
                break;
            }
        }
    } catch (error) {
        console.error('Error durante la extracción de productos:', error);
        await browser.close();
        return [];
    }

    const sortedProducts = products.sort((a, b) => a.price - b.price);
    const cheapestProducts = sortedProducts.slice(0, 3);

    cheapestProducts.forEach(product => {
        console.log(`Producto: ${product.title}, Precio: ${product.priceText}`);
    });

    console.log('Cerrando el navegador...');
    await browser.close();
    console.log('Proceso completado. Devolviendo los productos...');
    return cheapestProducts;
}

export default scrapeOlimpica;