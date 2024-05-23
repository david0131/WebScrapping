import { chromium } from 'playwright';

export async function scrapeExito(productName) {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    console.log('Navigating to Exito website...');
    await page.goto('https://www.exito.com/', { waitUntil: 'domcontentloaded' });

    await page.waitForTimeout(5000);

    console.log('Filling in the search field...');
    await page.fill('input[data-testid="store-input"]', productName);
    console.log('Pressing Enter');
    await page.keyboard.press('Enter');
    console.log('Waiting for the search results to load...');
    await page.waitForSelector('article[data-testid="store-product-card"]', { timeout: 60000 });
    await page.waitForTimeout(5000);

    console.log('Extracting product information...');
    let products = await page.$$eval('article[data-testid="store-product-card"]', (nodes, productName) => {
        // Función para eliminar tildes
        function removeAccents(str) {
            return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        }

        const productNameNormalized = removeAccents(productName).toLowerCase().split(' ');

        const productList = nodes.map(node => {
            const titleElement = node.querySelector('h3[data-fs-product-card-title="true"] a');
            if (!titleElement) return null; // Si no se encuentra el elemento del título, retorna null
            const title = titleElement.innerText;
            if (!title || title.toLowerCase().includes('reacondicionado') || title.toLowerCase().includes('Reacondicionado')) {
                return null; // Ignorar si no hay título o si es un producto reacondicionado
            }

            const priceElement = node.querySelector('p[data-fs-container-price-otros="true"]');
            let priceText = '';
            if (priceElement) {
                priceText = priceElement.innerText.trim();
            }
            let cleanedPriceText = priceText.replace(/[^\d.,]+/g, '');
            cleanedPriceText = cleanedPriceText.replace(/\./g, '').replace(',', '.');
            const price = parseFloat(cleanedPriceText);
            const formattedPrice = `${priceText}`;

            const image = node.querySelector('a[data-fs-link="true"] img')?.src || '';
            const link = titleElement.href;
            const store = 'Exito';
            return { title, priceText: formattedPrice, price, image, link, store };
        }).filter(Boolean); // Eliminar nulos

        let exactMatchProducts = productList.filter(product => {
            const productTitleNormalized = removeAccents(product.title).toLowerCase();
            return productTitleNormalized.includes(productNameNormalized.join(' '));
        });

        // Luego, buscar productos que contengan todas las palabras de productNameNormalized pero no necesariamente en ese orden
        let partialMatchProducts = productList.filter(product => {
            const productTitleNormalized = removeAccents(product.title).toLowerCase();
            const containsAllWords = productNameNormalized.every(word => productTitleNormalized.includes(word));
            const excludedTerms = ['reacondicionado', 'cargador', 'funda', 'cable', 'accesorio'];
            const excludesTerms = !excludedTerms.some(term => productTitleNormalized.includes(term));
            return containsAllWords && excludesTerms;
        });        

        // Combinar los productos encontrados
        return [...exactMatchProducts, ...partialMatchProducts];
    }, productName);

    // Si hay más de 5 productos, solo tomamos los primeros 5
    if (products.length > 5) {
        products = products.slice(0, 5);
    }

    // Ordenar los productos por precio y seleccionar los 3 más baratos
    const sortedProducts = products.sort((a, b) => a.price - b.price);
    const cheapestProducts = sortedProducts.slice(0, 3);

    // Mostrar precios por consola
    cheapestProducts.forEach(product => {
        console.log(`Product: ${product.title}, Price: ${product.priceText}`);
    });

    console.log('Cerrando el navegador exito');
    await browser.close();
    console.log('Process completed. Returning the products...');
    return cheapestProducts;
}

export default scrapeExito;