const path = require('node:path');

// Configuração via variáveis de ambiente (12-Factor), com valores padrão da especificação.
const DEFAULT_STORAGE_DIR = path.resolve(__dirname, '..', 'storage');
const DEFAULT_MAX_FILE_SIZE = 10 * 1024 * 1024;

module.exports = {
  port: Number(process.env.PORT) || 3000,
  storageDir: process.env.STORAGE_DIR
    ? path.resolve(process.env.STORAGE_DIR)
    : DEFAULT_STORAGE_DIR,
  maxFileSize: Number(process.env.MAX_FILE_SIZE) || DEFAULT_MAX_FILE_SIZE,
};
