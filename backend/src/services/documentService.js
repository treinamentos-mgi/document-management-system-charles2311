const { randomUUID } = require('node:crypto');
const documentRepository = require('../repositories/documentRepository');
const { NotFoundError } = require('./errors');

// Remove o nome interno do arquivo gravado, que nunca é exposto pela API.
function toPublicDocument({ storedName, ...document }) {
  return document;
}

// Monta os metadados a partir do arquivo recebido pelo multer.
function buildMetadata(file, owner) {
  return {
    id: randomUUID(),
    originalName: file.originalname,
    size: file.size,
    uploadedAt: new Date().toISOString(),
    owner,
    storedName: file.filename,
  };
}

function byMostRecentUpload(a, b) {
  return b.uploadedAt.localeCompare(a.uploadedAt);
}

// Documentos de outros donos são tratados como inexistentes para não revelar sua existência.
function findOwnedDocumentOrThrow(id, owner) {
  const document = documentRepository.findById(id);
  if (!document || document.owner !== owner) {
    throw new NotFoundError('Documento não encontrado.');
  }
  return document;
}

async function ensureFileExists(storedName) {
  if (!(await documentRepository.fileExists(storedName))) {
    throw new NotFoundError('Arquivo do documento não foi encontrado no armazenamento.');
  }
}

function registerUpload({ file, owner }) {
  const metadata = buildMetadata(file, owner);
  documentRepository.save(metadata);
  return toPublicDocument(metadata);
}

function listDocumentsByOwner(owner) {
  return documentRepository
    .findAll()
    .filter((document) => document.owner === owner)
    .sort(byMostRecentUpload)
    .map(toPublicDocument);
}

async function getDocumentForDownload(id, owner) {
  const document = findOwnedDocumentOrThrow(id, owner);
  await ensureFileExists(document.storedName);

  return {
    filePath: documentRepository.getFilePath(document.storedName),
    originalName: document.originalName,
  };
}

module.exports = {
  registerUpload,
  listDocumentsByOwner,
  getDocumentForDownload,
};
