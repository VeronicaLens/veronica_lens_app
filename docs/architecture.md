# Arquitetura do aplicativo

O aplicativo React Native é independente da API e não referencia arquivos ou pacotes do
repositório backend.

## Responsabilidades

- Interface, navegação e acessibilidade.
- Câmera, sensores e permissões do dispositivo.
- Cache local e armazenamento seguro da sessão.
- Autenticação do usuário com Supabase Auth usando apenas a publishable key.
- Chamadas autenticadas à API para regras de negócio e dados do domínio.

## Limites de segurança

- Variáveis `EXPO_PUBLIC_*` são públicas e não podem conter segredos.
- A secret key/service role do Supabase nunca é incluída no aplicativo.
- O papel do usuário não é aceito como fonte de autorização no cliente.
- O cliente pode adaptar a interface ao papel, mas a autorização definitiva pertence à API e ao
  RLS.
- Dados do domínio não são compartilhados entre usuários.

## Organização

```text
src/
|- config/       configuração pública validada
|- features/     telas e casos de uso agrupados por funcionalidade
|- services/     integração HTTP e serviços externos
|- theme/        tokens visuais
`- types/        contratos TypeScript do aplicativo
```
