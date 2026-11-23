---
description: Valida o backend antes do commit: roda os testes e confere as regras de camadas da Clean Architecture.
name: validar-backend
argument-hint: arquivo ou pasta alterada (opcional, ex. backend/src/services)
agent: agent
---

# Validar backend antes do commit

Execute a validação do backend${input:escopo:escopo opcional, ex. backend/src/services}.

Passos:

1. Rode `npm test` dentro de `backend` e reporte o resultado (testes passando e falhando).
2. Verifique o fluxo de dependência `routes -> controllers -> services -> repositories`:
   - `routes/` não deve importar `services/` nem `repositories/` diretamente.
   - `services/` não deve importar `controllers/` nem `routes/`.
   - `repositories/` não deve importar camadas externas.
3. Confirme que o nome enviado pelo cliente nunca é usado como caminho em disco.
4. Confirme que os metadados continuam em memória e os arquivos ficam em `backend/storage`.

Saída: um resumo curto com ✅ ou ❌ por item. Se algum item falhar, indique o arquivo e a linha, e proponha a correção sem aplicá-la.
