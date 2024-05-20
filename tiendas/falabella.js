import { chromium } from 'playwright';

export async function scrapeFalabella(productName) {
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();

    page.on('console', message => console.log('BROWSER-CONSOLE:', message.text()));

    console.log('Navigating to Falabella website...');
    await page.goto('https://www.falabella.com.co/', { waitUntil: 'domcontentloaded' });

    await page.waitForTimeout(5000);

    console.log('Filling in the search field...');
    await page.fill('input.SearchBar-module_searchBar__Input__1kPKS', productName);

    console.log('Clicking the search button...');
    await page.click('button.SearchBar-module_searchBtnIcon__2L2s0');

    console.log('Waiting for the search results to load...');
    await page.waitForSelector('b.pod-subTitle', { timeout: 60000 });
    await page.waitForTimeout(5000);

    console.log('Extracting product information...');
    let products = await page.$$eval('div.search-results-list', (nodes, productName) => {
        // Función para eliminar tildes y normalizar texto
        function removeAccents(str) {
            return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        }

        const productNameNormalized = removeAccents(productName).toLowerCase();

        return nodes.map(node => {
            const titleElement = node.querySelector('b.pod-subTitle');
            const title = titleElement ? titleElement.innerText.trim() : '';
            const titleNormalized = removeAccents(title).toLowerCase();

            // Verificar si el título normalizado contiene el nombre del producto normalizado
            if (!titleNormalized.includes(productNameNormalized)) {
                return null;
            }

            const priceElement = node.querySelector('div.jsx-2112733514.cmr-icon-container span.copy10');
            const priceText = priceElement ? priceElement.innerText.trim() : '';
            const price = parseFloat(priceText.replace(/[^\d,.-]+/g, '').replace(',', '.'));

            const imageElement = node.querySelector('img.jsx-1996933093'); // Asegúrate de que este selector sea correcto
            const imageSrc = imageElement ? imageElement.src : '';

            const linkElement = node.querySelector('a.pod-link');
            const link = linkElement ? linkElement.href : '';

            const store = 'Falabella';
            return { title, priceText, price, image: imageSrc, link, store };
        }).filter(Boolean); // Eliminar nulos
    }, productName);

    // Ordenar los productos por precio y seleccionar los 3 más baratos
    const sortedProducts = products.sort((a, b) => a.price - b.price);
    const cheapestProducts = sortedProducts.slice(0, 3);

    // Mostrar precios por consola
    cheapestProducts.forEach(product => {
        console.log(`Product: ${product.title}, Price: ${product.priceText}`);
    });

    console.log('Closing the browser...');
    await browser.close();
    console.log('Process completed. Returning the products...');
    return cheapestProducts;
}

export default scrapeFalabella;
