//import { scrapeMercadoLibre } from './mercadoLibre.js';
import { scrapeAlkosto } from './alkosto.js';
//import { scrapeOlimpica } from './olimpica.js'
import { scrapeExito } from './exito.js'
//import { scrapeFalabella } from './falabella.js'
// Importa funciones similares para Olímpica, Éxito, y Falabella

export async function getBestPrices(productName) {
    const results = [];

    //const mercadoLibre = await scrapeMercadoLibre(productName);
    //results.push(...mercadoLibre);

    const alkosto = await scrapeAlkosto(productName);
    results.push(...alkosto);

    // const olimpica = await scrapeOlimpica(productName);
    // results.push(...olimpica);

    const exito = await scrapeExito(productName);
    results.push(...exito);

    //const falabella = await scrapeFalabella(productName);
    //results.push(...falabella);

    results.forEach(product => {
        if (typeof product.price === 'string') {
            product.priceNumber = parseFloat(product.price.replace(/[^0-9.-]+/g, ""));
        } else {
            product.priceNumber = product.price; // Asume que el precio ya es un número
        }
    });

    results.sort((a, b) => a.priceNumber - b.priceNumber);

    // Tomar los 15 primeros
    return results.slice(0, 15);

}

export default getBestPrices