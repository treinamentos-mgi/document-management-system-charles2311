const { randomUUID } = require('node:crypto');
const documentRepository = require('../repositories/documentRepository');
const { NotFoundError } = require('./errors');

// Remove o nome interno do arquivo gravado, que nunca é exposto pela API.
function toPublicDocument({ storedName, ...document }) {
  return document;
}

function registerUpload({ file, owner }) {
  const metadata = {
    id: randomUUID(),
    originalName: file.originalname,
    size: file.size,
    uploadedAt: new Date().toISOString(),
    owner,
    storedName: file.filename,
  };

  documentRepository.save(metadata);
  return toPublicDocument(metadata);
}

function listDocumentsByOwner(owner) {
  return documentRepository
    .findAll()
    .filter((document) => document.owner === owner)
    .sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt))
    .map(toPublicDocument);
}

async function getDocumentForDownload(id) {
  const document = documentRepository.findById(id);
  if (!document) {
    throw new NotFoundError('Documento não encontrado.');
  }

  if (!(await documentRepository.fileExists(document.storedName))) {
    throw new NotFoundError('Arquivo do documento não foi encontrado no armazenamento.');
  }

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
