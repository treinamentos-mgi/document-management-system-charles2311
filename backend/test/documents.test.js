const { test, before, after } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

// Configuração de ambiente precisa estar definida antes de carregar o app.
const storageDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dms-test-'));
process.env.STORAGE_DIR = storageDir;
process.env.MAX_FILE_SIZE = '1024';

const app = require('../src/app');

let server;
let baseUrl;

function uploadFile({ name = 'contrato.txt', content = 'conteudo', owner, field = 'file' } = {}) {
  const form = new FormData();
  if (field) {
    form.append(field, new Blob([content], { type: 'text/plain' }), name);
  }
  const headers = owner ? { 'X-User-Id': owner } : {};
  return fetch(`${baseUrl}/upload`, { method: 'POST', body: form, headers });
}

before(async () => {
  server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(() => {
  server.close();
  fs.rmSync(storageDir, { recursive: true, force: true });
});

test('upload válido retorna 201 com metadados e grava o arquivo no storage', async () => {
  const response = await uploadFile({ name: 'relatorio.txt', content: 'abc', owner: 'ana' });
  const body = await response.json();

  assert.strictEqual(response.status, 201);
  assert.strictEqual(body.originalName, 'relatorio.txt');
  assert.strictEqual(body.size, 3);
  assert.strictEqual(body.owner, 'ana');
  assert.ok(body.id);
  assert.strictEqual(body.storedName, undefined, 'storedName não deve ser exposto');
  assert.strictEqual(fs.readdirSync(storageDir).length, 1);
});

test('upload sem o campo file retorna 400', async () => {
  const response = await uploadFile({ field: null });
  const body = await response.json();

  assert.strictEqual(response.status, 400);
  assert.ok(body.error);
});

test('upload acima de MAX_FILE_SIZE retorna 413', async () => {
  const response = await uploadFile({ content: 'x'.repeat(2048) });
  const body = await response.json();

  assert.strictEqual(response.status, 413);
  assert.match(body.error, /limite/);
});

test('listagem retorna somente os documentos do dono, do mais recente ao mais antigo', async () => {
  await uploadFile({ name: 'primeiro.txt', owner: 'lista-user' });
  await new Promise((resolve) => setTimeout(resolve, 5));
  await uploadFile({ name: 'segundo.txt', owner: 'lista-user' });
  await uploadFile({ name: 'outro.txt', owner: 'outro-user' });

  const response = await fetch(`${baseUrl}/documents`, { headers: { 'X-User-Id': 'lista-user' } });
  const body = await response.json();

  assert.strictEqual(response.status, 200);
  assert.deepStrictEqual(
    body.map((doc) => doc.originalName),
    ['segundo.txt', 'primeiro.txt'],
  );
  assert.ok(body.every((doc) => doc.owner === 'lista-user'));
});

test('download retorna o conteúdo original com Content-Disposition', async () => {
  const uploadResponse = await uploadFile({ name: 'baixar.txt', content: 'conteudo do arquivo' });
  const { id } = await uploadResponse.json();

  const response = await fetch(`${baseUrl}/documents/${id}/download`);

  assert.strictEqual(response.status, 200);
  assert.strictEqual(await response.text(), 'conteudo do arquivo');
  assert.strictEqual(response.headers.get('content-disposition'), 'attachment; filename="baixar.txt"');
  assert.match(response.headers.get('content-type'), /^text\/plain/);
});

test('download de documento de outro dono retorna 404', async () => {
  const uploadResponse = await uploadFile({ name: 'privado.txt', owner: 'dono-real' });
  const { id } = await uploadResponse.json();

  const intruder = await fetch(`${baseUrl}/documents/${id}/download`, {
    headers: { 'X-User-Id': 'intruso' },
  });
  const owner = await fetch(`${baseUrl}/documents/${id}/download`, {
    headers: { 'X-User-Id': 'dono-real' },
  });

  assert.strictEqual(intruder.status, 404);
  assert.strictEqual(owner.status, 200);
});

test('download de id inexistente retorna 404', async () => {
  const response = await fetch(`${baseUrl}/documents/nao-existe/download`);
  const body = await response.json();

  assert.strictEqual(response.status, 404);
  assert.ok(body.error);
});
