const documentService = require('../services/documentService');

const DEFAULT_OWNER = 'anonymous';

function getOwner(req) {
  return req.get('X-User-Id')?.trim() || DEFAULT_OWNER;
}

function upload(req, res) {
  if (!req.file) {
    return res.status(400).json({ error: 'Envie um arquivo no campo "file".' });
  }

  const document = documentService.registerUpload({ file: req.file, owner: getOwner(req) });
  return res.status(201).json(document);
}

function list(req, res) {
  res.json(documentService.listDocumentsByOwner(getOwner(req)));
}

async function download(req, res, next) {
  try {
    const { filePath, originalName } = await documentService.getDocumentForDownload(
      req.params.id,
      getOwner(req),
    );
    // attachment() define Content-Type pela extensão do nome original, já que o arquivo gravado não tem extensão.
    res.attachment(originalName);
    res.sendFile(filePath, (err) => {
      if (err && !res.headersSent) {
        next(err);
      }
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { upload, list, download };
