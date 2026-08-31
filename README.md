# VeronicaLens App

Aplicativo React Native do VeronicaLens, criado com Expo SDK 57 e TypeScript estrito. O app é
versionado e publicado independentemente da API.

## Requisitos

- Node.js 24 LTS
- npm 11+
- Expo Development Build ou ambiente Android compatível

## Configuração

```bash
npm ci
cp .env.example .env
npm start
```

No PowerShell, copie o ambiente com `Copy-Item .env.example .env`.

Para iniciar no Android:

```bash
npm run android
```

## Scripts

- `npm start`: inicia o Metro/Expo.
- `npm run android`: inicia o fluxo Android.
- `npm run lint`: executa o ESLint.
- `npm run format`: formata o projeto.
- `npm run typecheck`: valida o TypeScript.
- `npm test`: executa os testes.
- `npm run bundle:android`: valida o bundle Android.
- `npm run validate`: executa todos os checks do CI.

## Ambiente

Somente valores públicos usam o prefixo `EXPO_PUBLIC_`. A publishable key permite usar Supabase
Auth, mas o acesso aos dados continua limitado por grants e RLS. Nunca adicione secret keys ou a
`service_role` neste repositório.

## Arquitetura e contribuição

- [Arquitetura do aplicativo](docs/architecture.md)
- [Convenções de Git](docs/git-conventions.md)

Exemplo de branch e commit:

```text
chore/VRLENS-66-mobile-repository
chore(app): VRLENS-66 configure mobile repository
```
