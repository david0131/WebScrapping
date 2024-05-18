import { chromium } from 'playwright';

export async function scrapeExito(productName) {
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();
    const productPrefix = productName.substring(0, 5);

    page.on('console', message => console.log('BROWSER-CONSOLE:', message.text()));

    console.log('Navigating to Exito website...');
    await page.goto('https://www.exito.com/', { waitUntil: 'domcontentloaded' });

    let products = [];
    let currentPage = 0;
    const maxPages = 2; // Define el número máximo de páginas a las que quieres navegar

    do {
        console.log(`Checking page ${currentPage + 1} for products...`);
        console.log('Filling in the search field...');
        await page.fill('input[data-testid="store-input"]', productName);
        console.log('Pressing Enter');
        await page.keyboard.press('Enter')
        console.log('Waiting for the search results to load...');
        await page.waitForSelector('article[data-testid="store-product-card"]', { timeout: 60000 });

        console.log('Extracting product information...');
        let newProducts = await page.$$eval('article[data-testid="store-product-card"]', (nodes, productPrefix) => {
            const productList = nodes.map(node => {
                const titleElement = node.querySelector('h3[data-fs-product-card-title="true"] a');
                if (!titleElement) return null; // Si no se encuentra el elemento del título, retorna null
                const title = titleElement.innerText;
                if (!title || title.toLowerCase().includes('reacondicionado')) {
                    return null; // Ignorar si no hay título o si es un producto reacondicionado
                }
                let priceText = node.querySelector('p[data-fs-container-price-otros="true"]')?.innerText || '';
                const price = parseFloat(priceText.replace(/[^\d,.-]+/g, '').replace(',', '.')) || 0;
                const formattedPrice = `${priceText}`;
                const image = node.querySelector('a[data-fs-link="true"] img')?.src;
                const link = node.querySelector('h3[data-fs-product-card-title="true"] a')?.href;
                return { title, priceText: formattedPrice, image, link };
            }).filter(Boolean); // Eliminar nulos

            return productList.filter(product =>
                product.title.toLowerCase().startsWith(productPrefix.toLowerCase())
            );
        }, productPrefix);

        products = [...products, ...newProducts];

        if (products.length >= 3 || currentPage >= maxPages - 1) {
            break; // Si ya tienes 3 productos o has alcanzado el máximo de páginas, detente
        }

        console.log('Not enough products found, going to next page...');
        const nextPageButton = await page.$('button.Pagination_nextPreviousLink__f7_2J[aria-label="Próxima Pagina"]');
        if (nextPageButton) {
            await nextPageButton.click();
            currentPage++;
            await page.waitForNavigation({ waitUntil: 'domcontentloaded' }); // Espera a que la siguiente página se cargue completamente
        } else {
            console.log('No more pages to navigate to.');
            break;
        }
    } while (currentPage < maxPages);

    const sortedProducts = products.sort((a, b) => a.price - b.price);
    const cheapestProducts = sortedProducts.slice(0, 3);

    cheapestProducts.forEach(product => {
        console.log(`Product: ${product.title}, Price: ${product.priceText}`);
    });

    console.log('Closing the browser...');
    await browser.close();
    console.log('Process completed. Returning the products...');
    return cheapestProducts;
}

export default scrapeExito;