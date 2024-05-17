import { scrapeMercadoLibre } from './mercadoLibre.js';
import { scrapeAlkosto } from './alkosto.js';
// Importa funciones similares para Olímpica, Éxito, y Falabella

export async function getBestPrices(productName) {
    const results = [];

    const mercadoLibre = await scrapeMercadoLibre(productName);
    results.push(...mercadoLibre);

    const alkosto = await scrapeAlkosto(productName);
    results.push(...alkosto);

    // Agrega aquí las funciones para Olímpica, Éxito y Falabella
    // const olimpica = await scrapeOlimpica(productName);
    // results.push(...olimpica);
    // const exito = await scrapeExito(productName);
    // results.push(...exito);
    // const falabella = await scrapeFalabella(productName);
    // results.push(...falabella);

    // Ordenar por precio
    results.sort((a, b) => a.price - b.price);

    // Tomar los 15 primeros
    return results.slice(0, 15);
}

export default getBestPrices