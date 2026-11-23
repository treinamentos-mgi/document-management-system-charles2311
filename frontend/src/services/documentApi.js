// Cliente da API de documentos. Todas as chamadas usam o prefixo /api,
// encaminhado ao backend pelo proxy do Vite.
const API_PREFIX = '/api';

async function readErrorMessage(response) {
  try {
    const body = await response.json();
    return body.error;
  } catch {
    return null;
  }
}

async function request(path, options) {
  const response = await fetch(`${API_PREFIX}${path}`, options);

  if (!response.ok) {
    const message = await readErrorMessage(response);
    throw new Error(message || `Erro na requisição (HTTP ${response.status}).`);
  }

  return response;
}

export async function listDocuments() {
  const response = await request('/documents');
  return response.json();
}

export async function uploadDocument(file) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await request('/upload', { method: 'POST', body: formData });
  return response.json();
}

export async function downloadDocument(documentId) {
  const response = await request(`/documents/${encodeURIComponent(documentId)}/download`);
  return response.blob();
}
