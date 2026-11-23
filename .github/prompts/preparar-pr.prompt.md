---
description: Prepara uma alteração do backend para Pull Request: valida testes, camadas e gera o resumo do PR.
name: preparar-pr
argument-hint: branch ou escopo da alteração (opcional, ex. feature/dms)
agent: agent
---

# Preparar Pull Request do backend

Prepare a alteração do backend${input:escopo:escopo opcional, ex. feature/dms} para abrir um Pull Request.

Passos:

1. Verifique `git status` e `git diff main...HEAD` e liste os arquivos alterados em `backend/`.
2. Rode `npm test` dentro de `backend` e reporte testes passando e falhando.
3. Confira o fluxo `routes -> controllers -> services -> repositories` nos arquivos alterados.
4. Confirme que o nome enviado pelo cliente não é usado como caminho em disco.
5. Sugira a mensagem de commit no padrão Conventional Commits (ex.: `feat: ...`, `fix: ...`).
6. Escreva o título e a descrição do PR com: resumo, arquivos principais, como testar e riscos.

Não faça commit nem push sem confirmação. Se algum teste ou regra falhar, indique arquivo e linha e pare antes de gerar o PR.
