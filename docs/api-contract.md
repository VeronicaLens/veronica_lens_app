# Contrato HTTP consumido

`contracts/openapi.v1.yaml` é o snapshot aprovado do contrato cuja fonte de verdade está em
`VeronicaLens/veronica_lens_api/openapi/openapi.yaml`. O app não edita modelos públicos manualmente
e não depende de pacotes ou caminhos do repositório da API.

## Atualização

1. Atualizar primeiro o documento OpenAPI no repositório da API.
2. Copiar o documento aprovado para `contracts/openapi.v1.yaml`.
3. Executar `npm run contract:generate`.
4. Revisar e versionar o snapshot e `src/shared/api/generated` no mesmo commit.

`npm run contract:check` repete a geração e falha se os arquivos versionados estiverem
desatualizados. Mudanças incompatíveis só podem ser consumidas depois da adoção de uma nova versão
da API ou durante um período explícito de compatibilidade.
