// Servidor backend do Document Management System.
//
// Camadas em src/: routes -> controllers -> services -> repositories.
// Uploads são gravados no filesystem local (backend/storage) via multer com
// diskStorage. Não utilize provedores externos.

const express = require('express');
const config = require('./config');
const documentRoutes = require('./routes/documentRoutes');
const { errorHandler } = require('./controllers/errorController');

const app = express();

app.use(express.json());

// Endpoint de verificação de saúde.
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use(documentRoutes);
app.use(errorHandler);

if (require.main === module) {
  app.listen(config.port, () => {
    console.log(`DMS backend ouvindo na porta ${config.port}`);
  });
}

module.exports = app;
