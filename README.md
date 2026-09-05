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

O tunnel resolve a conexão com o Metro, mas não torna a API local automaticamente acessível pelo
aparelho. Nesse caso, configure uma URL alcançável pelo celular,
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
- `npm run contract:generate`: gera os tipos TypeScript a partir do snapshot OpenAPI.
- `npm run contract:check`: confirma que os tipos gerados estão atualizados.
- `npm run bundle:android`: valida o bundle Android.
- `npm run validate`: executa todos os checks do CI.

## Ambiente

O aplicativo recebe somente `EXPO_PUBLIC_API_URL`. Nenhuma URL ou chave do Supabase deve ser
configurada neste repositório, pois autenticação, regras de negócio e dados são acessados por meio
da API.

O app valida a conectividade chamando a API. O backend lê o registro técnico
`system_status/supabase` e devolve apenas um estado seguro, sem expor credenciais ou detalhes do
provedor ao dispositivo.

## Arquitetura e contribuição

- [Arquitetura do aplicativo](docs/architecture.md)
- [Contrato HTTP consumido](docs/api-contract.md)
- [Ambientes e configuração pública](docs/environment.md)
- [Convenções de Git](docs/git-conventions.md)

Exemplo de branch e commit:

```text
chore/VRLENS-66-mobile-repository
chore(app): VRLENS-66 configure mobile repository
```
