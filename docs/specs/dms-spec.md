# Especificação - Document Management System

> Especificação do DMS, preenchida a partir de `spec-template.md` para orientar
> o desenvolvimento guiado por especificação (Spec Driven Development).

## 1. Objetivo

Entregar uma aplicação web que permita enviar, listar e baixar documentos,
com gestão simples por usuário e armazenamento estritamente local.

## 2. Escopo

### Dentro do escopo

- Upload de documentos
- Listagem de documentos
- Download de documentos
- Gestão simples por usuário

### Fora do escopo

- Armazenamento externo ou em nuvem
- Versionamento de documentos
- Autenticação e controle de acesso completos (o dono é apenas identificado)
- Exclusão, edição e renomeação de documentos
- Paginação e busca na listagem
- Persistência dos metadados em banco de dados

## 3. Requisitos funcionais

| ID    | Requisito                                                                                   |
| ----- | ------------------------------------------------------------------------------------------- |
| RF-01 | O usuário pode enviar um documento (campo `file`, multipart/form-data)                      |
| RF-02 | O usuário pode listar os documentos enviados                                                |
| RF-03 | O usuário pode baixar um documento pelo identificador                                       |
| RF-04 | O sistema associa cada documento a um dono (`owner`) identificado pelo cabeçalho `X-User-Id` |
| RF-05 | A listagem exibe apenas os documentos do usuário informado em `X-User-Id`                   |
| RF-06 | O download retorna o arquivo original com o nome original em `Content-Disposition`          |
| RF-07 | O envio sem arquivo ou com arquivo acima do limite é recusado com mensagem de erro clara   |
| RF-08 | O frontend exibe o formulário de envio, a lista de documentos e o botão de download         |

Premissa: sem autenticação nesta fase. Se `X-User-Id` não for informado, o dono
assume o valor `anonymous`.

## 4. Requisitos não funcionais

| ID     | Requisito                                                                                    |
| ------ | -------------------------------------------------------------------------------------------- |
| RNF-01 | Arquivos gravados no filesystem local em `backend/storage`, via `multer` com `diskStorage`   |
| RNF-02 | Metadados mantidos em memória nesta fase                                                     |
| RNF-03 | Configuração via variáveis de ambiente (12-Factor): `PORT`, `STORAGE_DIR`, `MAX_FILE_SIZE`    |
| RNF-04 | Nenhum serviço externo de armazenamento ou upload de terceiros                               |
| RNF-05 | Erros tratados nos limites do sistema: entrada HTTP e leitura/escrita de arquivos            |
| RNF-06 | Mensagens ao usuário em português; símbolos de código em inglês                              |
| RNF-07 | Backend em CommonJS com Express 5 e testes via `node:test`; frontend em ESM com React e Vite |

Valores padrão: `PORT=3000`, `STORAGE_DIR=backend/storage`, `MAX_FILE_SIZE=10485760` (10 MB).

## 5. Modelo de dados (metadados do documento)

| Campo        | Tipo   | Descrição                                                      |
| ------------ | ------ | -------------------------------------------------------------- |
| id           | string | Identificador único do documento (UUID v4)                     |
| originalName | string | Nome original do arquivo enviado                               |
| size         | number | Tamanho em bytes                                               |
| uploadedAt   | string | Data/hora do upload (ISO 8601)                                 |
| owner        | string | Identificador do usuário dono (valor de `X-User-Id`)           |

Campo interno, nunca exposto na API: `storedName` (nome do arquivo gravado em
disco, gerado pelo `multer`). Ele é usado apenas pela camada de repositórios
para localizar o arquivo no download.

Os metadados ficam em um `Map` em memória. Reiniciar a aplicação apaga os
metadados, mas não os arquivos já gravados em `STORAGE_DIR`.

## 6. Contratos de API

Prefixo no frontend: `/api`, encaminhado ao backend pelo proxy do Vite.

### POST /upload

- Cabeçalhos: `X-User-Id` (opcional, default `anonymous`)
- Entrada: `multipart/form-data` com o campo `file`
- Sucesso: `201 Created`, corpo com os metadados do documento

```json
{
  "id": "3f2c1a9e-6b7d-4e2a-9c1e-2d5f8a7b6c10",
  "originalName": "contrato.pdf",
  "size": 40231,
  "uploadedAt": "2026-11-23T13:00:00.000Z",
  "owner": "anonymous"
}
```

- Erros:
  - `400 Bad Request`: campo `file` ausente
  - `413 Payload Too Large`: arquivo acima de `MAX_FILE_SIZE`
  - `500 Internal Server Error`: falha ao gravar o arquivo

### GET /documents

- Cabeçalhos: `X-User-Id` (opcional, default `anonymous`)
- Sucesso: `200 OK`, array com os metadados dos documentos do dono, ordenado por `uploadedAt` decrescente

```json
[
  {
    "id": "3f2c1a9e-6b7d-4e2a-9c1e-2d5f8a7b6c10",
    "originalName": "contrato.pdf",
    "size": 40231,
    "uploadedAt": "2026-11-23T13:00:00.000Z",
    "owner": "anonymous"
  }
]
```

- Lista vazia retorna `200 OK` com `[]`.

### GET /documents/:id/download

- Sucesso: `200 OK`, corpo binário do arquivo, com `Content-Type` inferido e
  `Content-Disposition: attachment; filename="<originalName>"`
- Erros:
  - `404 Not Found`: id inexistente, ou arquivo ausente no disco
  - `500 Internal Server Error`: falha de leitura do arquivo

### Formato de erro

Todas as respostas de erro usam o formato:

```json
{ "error": "Mensagem legível em português" }
```

## 7. Decisões arquiteturais

### Backend: Clean Architecture simples

Estrutura em `backend/src`:

- `routes/`: definem os endpoints e delegam para os controllers
- `controllers/`: tratam entrada e saída HTTP e validação básica
- `services/`: concentram as regras de negócio (por exemplo, limite de tamanho e filtro por dono)
- `repositories/`: cuidam da persistência (`Map` em memória e gravação em disco)

Fluxo de dependência: `routes -> controllers -> services -> repositories`.
Camadas internas não importam camadas externas. O `multer` é configurado na
borda HTTP (routes/controllers) e o repositório recebe o caminho do arquivo já
gravado.

### Armazenamento

- `multer` com `diskStorage` grava em `STORAGE_DIR` com nome gerado (UUID), sem
  usar o nome enviado pelo cliente diretamente no caminho.
- `limits.fileSize` do `multer` aplica `MAX_FILE_SIZE`.
- Nenhum provedor externo.

### Frontend

- React com componentes funcionais e Hooks
- Organização: `components/`, `pages/`, `services/`
- `services/` concentra as chamadas `fetch` ao prefixo `/api`
- Componentes previstos: `UploadComponent`, `DocumentList`, `DownloadButton`

### Ambiente

- Node.js 24 (conforme `engines` do frontend)
- Sem TypeScript nesta fase

## 8. Plano de execução

Etapas na ordem de implementação. Cada etapa depende da anterior.

1. **Configuração do backend**: ler `PORT`, `STORAGE_DIR` e `MAX_FILE_SIZE` do ambiente, com defaults; garantir a existência de `STORAGE_DIR`.
2. **Repositório de documentos**: `Map` em memória para os metadados e funções de gravação e leitura de arquivos em disco.
3. **Serviço de documentos**: regras de upload (aceitar arquivo, montar metadados), listagem por dono e obtenção para download.
4. **Controllers e rotas**: `POST /upload`, `GET /documents`, `GET /documents/:id/download`, com configuração do `multer` e tratamento de erros (400, 404, 413, 500).
5. **Montagem da aplicação**: conectar rotas em `backend/src/app.js` e iniciar o servidor.
6. **Testes do backend**: testes com `node:test` cobrindo upload válido, upload sem arquivo, arquivo acima do limite, listagem por dono e download inexistente.
7. **Serviço HTTP do frontend**: funções em `services/` que chamam `/api/upload`, `/api/documents` e `/api/documents/:id/download`.
8. **Componentes e página**: `UploadComponent`, `DocumentList`, `DownloadButton` e a página principal que os compõe, substituindo o seed de `App.jsx`.
9. **Validação integrada**: fluxo completo upload -> listagem -> download, com build do frontend (`vite build`) e execução dos testes do backend.

## Premissas adotadas

- Autenticação fora do escopo: o dono vem de `X-User-Id`, com default `anonymous`.
- Limite de arquivo de 10 MB, configurável por `MAX_FILE_SIZE`.
- Listagem sem paginação.
- Nome do campo de upload: `file`.
- Ids gerados com `crypto.randomUUID()`.
