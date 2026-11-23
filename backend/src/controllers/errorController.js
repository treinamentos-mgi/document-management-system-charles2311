const multer = require('multer');
const { NotFoundError } = require('../services/errors');
const config = require('../config');

// Converte erros das camadas internas e do multer em respostas HTTP.
function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  if (err instanceof NotFoundError) {
    return res.status(404).json({ error: err.message });
  }

  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      const limitInMb = (config.maxFileSize / (1024 * 1024)).toFixed(0);
      return res.status(413).json({ error: `Arquivo acima do limite de ${limitInMb} MB.` });
    }
    return res.status(400).json({ error: 'Requisição de upload inválida.' });
  }

  console.error(err);
  return res.status(500).json({ error: 'Erro interno do servidor.' });
}

module.exports = { errorHandler };
