# Arquitetura do aplicativo

O aplicativo React Native é independente da API e não referencia arquivos ou pacotes do
repositório backend.

## Responsabilidades

- Interface, navegação e acessibilidade.
- Câmera, sensores e permissões do dispositivo.
- Cache local e armazenamento seguro da sessão emitida pela API.
- Autenticação do usuário por endpoints do backend.
- Chamadas autenticadas à API para regras de negócio e dados do domínio; o app não conecta
  diretamente ao Supabase.

## Limites de segurança

- Variáveis `EXPO_PUBLIC_*` são públicas e não podem conter segredos.
- URLs, SDKs e chaves do Supabase nunca são incluídos no aplicativo.
- O papel do usuário não é aceito como fonte de autorização no cliente.
- O cliente pode adaptar a interface ao papel, mas a autorização definitiva pertence à API e ao
  RLS.
- Dados do domínio não são compartilhados entre usuários.

## Organização

```text
src/
|- config/       configuração pública validada
|- features/     telas e casos de uso agrupados por funcionalidade
|- services/     integração HTTP exclusiva com a API
|- theme/        tokens visuais
`- types/        contratos TypeScript do aplicativo
```
