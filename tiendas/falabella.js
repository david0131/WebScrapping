import { chromium } from 'playwright';

export const scrapeFalabella = async (productName) => {

    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();

    console.log('Navegando a la página de falabella...');
    await page.goto(`https://www.falabella.com.co/falabella-co/search?Ntt=${productName}`);

    await page.waitForSelector(".subTitle-rebrand");

    const productDetails = await page.evaluate((productName) => {
        // Función para eliminar tildes y normalizar texto
        function removeAccents(str) {
            return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        }

        const productNameNormalized = removeAccents(productName).toLowerCase().split(' ');

        let items = Array.from(document.querySelectorAll('.search-results-4-grid')); // Selector que engloba cada producto
        if (items.length == 0) {
            items = Array.from(document.querySelectorAll('.search-results-list'));
        }

        return items.slice(0, 5).map(item => {
            const nameElement = item.querySelector('b[id^="testId-pod-displaySubTitle"]');
            const name = nameElement ? nameElement.innerText.trim() : '';
            const nameNormalized = removeAccents(name).toLowerCase();

            let priceText = item.querySelector('.copy10.medium')?.innerText.trim() || '';
            const price = parseFloat(priceText.replace(/[^\d,.-]+/g, '').replace(',', '.'));

            const imageElement = item.querySelector('picture img');
            const imageLink = imageElement ? imageElement.src : '';

            const linkElement = item.querySelector('.jsx-1484439449');
            const articleLink = linkElement ? linkElement.children[0].href : '';

            const store = 'Falabella';

            // Filtrar productos que coincidan con el nombre buscado
            if (productNameNormalized.every(word => nameNormalized.includes(word))) {
                return { name, priceText, price, imageLink, articleLink, store };
            }
            return null;
        }).filter(Boolean); // Eliminar nulos
    }, productName);

    console.log('Cerrando el navegador falabella');
    await browser.close(); // Cierra el navegador una vez que has terminado de raspar los datos.

    productDetails.map((product) => {
        if (typeof product.price === 'string') {
            product.price = parseInt(product.price.substring(2).replaceAll(".", ''));
        }
        // No es necesario convertir 'product.rating' si ya es un número flotante.
    });

    productDetails.sort((a, b) => a.price - b.price); // Ordena los productos por precio, del más bajo al más alto.

    return productDetails.slice(0, 3); // Devuelve solo los 3 productos más baratos.
};

export default scrapeFalabella;