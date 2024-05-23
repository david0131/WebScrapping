import { chromium } from 'playwright';

export const scrapeFalabella = async (productName) => {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    console.log('Navegando a la página de falabella...');
    await page.goto(`https://www.falabella.com.co/falabella-co/search?Ntt=${productName}`);

    await page.waitForSelector(".subTitle-rebrand");

    const productDetails = await page.evaluate((productName) => {
        function removeAccents(str) {
            return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        }

        const productNameNormalized = removeAccents(productName).toLowerCase().split(' ');

        let items = Array.from(document.querySelectorAll('.search-results-4-grid'));
        if (items.length == 0) {
            items = Array.from(document.querySelectorAll('.search-results-list'));
        }

        return items.slice(0, 5).map(item => {
            // Actualización del selector para obtener el nombre del producto
            const tittleElement = item.querySelector('.pod-subTitle.subTitle-rebrand');
            const title = tittleElement ? tittleElement.innerText.trim() : '';
            const nameNormalized = removeAccents(title).toLowerCase();

            let priceText = item.querySelector('.copy10.medium')?.innerText.trim() || '';
            let cleanedPriceText = priceText.replace(/[^\d,.-]+/g, '');
            cleanedPriceText = cleanedPriceText.replace(/\./g, '').replace(',', '.');
            const price = parseFloat(cleanedPriceText);

            const image = item.querySelector('img.jsx-1996933093')?.src;
            const link = item.querySelector('.pod-link')?.href;

            const store = 'Falabella';

            if (productNameNormalized.every(word => nameNormalized.includes(word))) {
                return { title, priceText, price, image, link, store };
            }
            return null;
        }).filter(Boolean);
    }, productName);

    console.log('Cerrando el navegador falabella');
    await browser.close();

    productDetails.map((product) => {
        if (typeof product.price === 'string') {
            product.price = parseInt(product.price.substring(2).replaceAll(".", ''));
        }
    });

    productDetails.sort((a, b) => a.price - b.price);

    return productDetails.slice(0, 3);
};

export default scrapeFalabella;
