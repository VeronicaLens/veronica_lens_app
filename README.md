# VeronicaLens App

Aplicativo React Native do VeronicaLens, criado com Expo SDK 57 e TypeScript estrito. O app é
versionado e publicado independentemente da API.

## Requisitos

- Node.js 24 LTS
- npm 11+
- Dispositivo Android físico com Expo Go compatível com o Expo SDK 57
- Computador e dispositivo na mesma rede para conexão por LAN

## Configuração

```bash
npm ci
cp .env.example .env
npm run start:go
```

No PowerShell, copie o ambiente com `Copy-Item .env.example .env`.

Abra o Expo Go no aparelho, selecione **Scan QR code** e leia o código exibido no terminal. Se a
rede local bloquear a conexão, reinicie o servidor usando o tunnel:

```bash
npm run start:go:tunnel
```

O tunnel resolve a conexão com o Metro, mas não torna serviços locais como API ou Supabase
automaticamente acessíveis pelo aparelho. Nesses casos, configure uma URL alcançável pelo celular,
como o IP do computador na rede, e libere somente as portas necessárias no firewall.

O Expo Go é suficiente para a fase atual, enquanto o projeto usar bibliotecas presentes no Expo
SDK ou bibliotecas sem código nativo customizado. Alterações nativas, notificações push remotas e
bibliotecas nativas não incluídas no Expo Go exigirão um development build próprio no futuro.

Quando esse momento chegar, o build Android poderá ser gerado com:

```bash
npm run android:dev
```

Esse comando exige Android Studio/SDK para build local ou poderá ser substituído por EAS Build. O
identificador nativo reservado é `com.veronicalens.app` e o scheme de deep link é `veronicalens`.

Permissões de câmera e sensores serão declaradas quando cada funcionalidade for implementada. Isso
evita solicitar acesso antes de existir uma necessidade funcional e mantém o princípio de menor
privilégio.

## Scripts

- `npm start`: inicia o Metro/Expo.
- `npm run start:go`: inicia explicitamente para o Expo Go.
- `npm run start:go:tunnel`: inicia para o Expo Go usando tunnel.
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

O app valida a conectividade lendo somente o registro técnico `system_status/supabase`. Essa tabela
não contém dados de usuários e sua política RLS permite apenas a leitura do estado técnico. Dados
funcionais permanecem privados e sujeitos à identidade autenticada.

## Arquitetura e contribuição

- [Arquitetura do aplicativo](docs/architecture.md)
- [Ambientes e configuração pública](docs/environment.md)
- [Convenções de Git](docs/git-conventions.md)

Exemplo de branch e commit:

```text
chore/VRLENS-66-mobile-repository
chore(app): VRLENS-66 configure mobile repository
```
