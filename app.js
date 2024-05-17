import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { getBestPrices } from './tiendas/getBestPrices.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// Configura tu carpeta de vistas y motor de plantillas
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Ruta para búsqueda de productos
app.get('/search', async (req, res) => {
    const productName = req.query.product;
    const products = await getBestPrices(productName);

    res.render('results', { products });
});

// Servir archivos estáticos desde la carpeta "assets"
app.use(express.static(__dirname + '/assets'))

// Ruta principal
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'views/index.html'));
});

app.listen(PORT, () => {
    console.log(`Servidor escuchando en http://localhost:${PORT}`);
});