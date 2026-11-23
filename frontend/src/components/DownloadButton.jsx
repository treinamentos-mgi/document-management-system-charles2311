import { useState } from 'react';
import { downloadDocument } from '../services/documentApi';

export default function DownloadButton({ documentId, fileName }) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState('');

  async function handleClick() {
    setIsDownloading(true);
    setError('');

    try {
      const blob = await downloadDocument(documentId);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      link.click();
      // Adiado para garantir que o navegador já iniciou o download.
      setTimeout(() => URL.revokeObjectURL(url), 0);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsDownloading(false);
    }
  }

  return (
    <>
      <button type="button" onClick={handleClick} disabled={isDownloading}>
        {isDownloading ? 'Baixando...' : 'Baixar'}
      </button>
      {error && <span role="alert" style={{ color: 'crimson', marginLeft: '0.5rem' }}>{error}</span>}
    </>
  );
}
