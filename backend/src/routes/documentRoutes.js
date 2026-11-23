const { randomUUID } = require('node:crypto');
const express = require('express');
const multer = require('multer');
const config = require('../config');
const documentController = require('../controllers/documentController');
const documentRepository = require('../repositories/documentRepository');

documentRepository.ensureStorageDir();

const upload = multer({
  storage: multer.diskStorage({
    destination: config.storageDir,
    // Nome gerado no servidor: o nome enviado pelo cliente nunca vira caminho.
    filename: (req, file, cb) => cb(null, randomUUID()),
  }),
  limits: { fileSize: config.maxFileSize },
});

const router = express.Router();

router.post('/upload', upload.single('file'), documentController.upload);
router.get('/documents', documentController.list);
router.get('/documents/:id/download', documentController.download);

module.exports = router;
