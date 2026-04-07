

## Correção dos Erros de Build

O arquivo `src/lib/exportPdf.ts` importa `@capacitor/filesystem` e `@capacitor/share`, mas esses pacotes não estão instalados.

### Solução

Modificar `src/lib/exportPdf.ts` para importar esses módulos **dinamicamente** (com `import()`) em vez de estaticamente. Isso evita o erro de build e mantém a funcionalidade quando rodando no dispositivo (onde os plugins Capacitor estão disponíveis).

**Arquivo:** `src/lib/exportPdf.ts`
- Remover as importações estáticas de `@capacitor/filesystem` e `@capacitor/share` (linhas 3-4)
- Na função `saveAndSharePdf`, usar `import()` dinâmico dentro do `try` block para carregar os módulos apenas em runtime
- Manter o fallback `pdf.save()` para quando os plugins não estiverem disponíveis (navegador web)

