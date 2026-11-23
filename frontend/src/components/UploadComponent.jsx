import { useRef, useState } from 'react';
import { uploadDocument } from '../services/documentApi';

export default function UploadComponent({ onUploaded }) {
  const inputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();

    if (!file) {
      setError('Selecione um arquivo para enviar.');
      return;
    }

    setIsUploading(true);
    setError('');
    setMessage('');

    try {
      const document = await uploadDocument(file);
      setMessage(`"${document.originalName}" enviado com sucesso.`);
      setFile(null);
      inputRef.current.value = '';
      onUploaded?.(document);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        ref={inputRef}
        type="file"
        aria-label="Arquivo para envio"
        onChange={(event) => setFile(event.target.files[0] ?? null)}
      />
      <button type="submit" disabled={isUploading}>
        {isUploading ? 'Enviando...' : 'Enviar documento'}
      </button>
      {message && <p role="status">{message}</p>}
      {error && <p role="alert" style={{ color: 'crimson' }}>{error}</p>}
    </form>
  );
}
