const fs = require('node:fs');
const path = require('node:path');
const config = require('../config');

// Metadados em memória (fase inicial). Arquivos ficam em config.storageDir.
const documents = new Map();

function ensureStorageDir() {
  fs.mkdirSync(config.storageDir, { recursive: true });
}

function save(metadata) {
  documents.set(metadata.id, metadata);
  return metadata;
}

function findAll() {
  return [...documents.values()];
}

function findById(id) {
  return documents.get(id) || null;
}

function getFilePath(storedName) {
  return path.join(config.storageDir, storedName);
}

async function fileExists(storedName) {
  try {
    await fs.promises.access(getFilePath(storedName));
    return true;
  } catch {
    return false;
  }
}

module.exports = {
  ensureStorageDir,
  save,
  findAll,
  findById,
  getFilePath,
  fileExists,
};
