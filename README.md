# VeronicaLens App

Aplicativo React Native do VeronicaLens, criado com Expo SDK 57 e TypeScript estrito. O app é
versionado e publicado independentemente da API.

## Requisitos

- Node.js 24 LTS
- npm 11+
- Android Studio com Android SDK, emulador ou dispositivo físico configurado

## Configuração

```bash
npm ci
cp .env.example .env
npm start
```

No PowerShell, copie o ambiente com `Copy-Item .env.example .env`.

Para gerar, instalar e iniciar o development build Android sem Expo Go:

```bash
npm run android:dev
```

Na primeira execução, o Expo gera o projeto nativo Android por Continuous Native Generation. Nas
execuções seguintes, mantenha o development build instalado e use `npm start` para iniciar o Metro.
O identificador nativo é `com.veronicalens.app` e o scheme de deep link é `veronicalens`.

Permissões de câmera e sensores serão declaradas quando cada funcionalidade for implementada. Isso
evita solicitar acesso antes de existir uma necessidade funcional e mantém o princípio de menor
privilégio.

## Scripts

- `npm start`: inicia o Metro/Expo.
- `npm run android`: abre o app Android já disponível.
- `npm run android:dev`: compila e instala o development build Android local.
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
- [Ambientes e configuração pública](docs/environment.md)
- [Convenções de Git](docs/git-conventions.md)

Exemplo de branch e commit:

```text
chore/VRLENS-66-mobile-repository
chore(app): VRLENS-66 configure mobile repository
```
