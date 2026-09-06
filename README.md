# VeronicaLens App

Aplicativo React Native do VeronicaLens, criado com Expo SDK 57 e TypeScript estrito. O app é
versionado e publicado independentemente da API.

## Requisitos

- Node.js 24 LTS
- npm 11+
- Dispositivo Android físico com o VeronicaLens Development Build instalado
- Computador e dispositivo na mesma rede para conexão por LAN

## Configuração

```bash
npm ci
cp .env.example .env
npm run start:dev
```

No PowerShell, copie o ambiente com `Copy-Item .env.example .env`.

Abra o VeronicaLens Development Build no aparelho e conecte-o ao servidor exibido. A câmera usa
VisionCamera e não está disponível no cliente padrão do Expo Go. Para gerar o APK sem Android
Studio, execute `npm run build:android:dev`. Veja [Captura com VisionCamera](docs/camera-capture.md).

Se a rede local bloquear a conexão do Development Build com o Metro, use o tunnel:

```bash
npm run start:dev:tunnel
```

O tunnel resolve a conexão com o Metro, mas não torna a API local automaticamente acessível pelo
aparelho. Nesse caso, configure uma URL alcançável pelo celular,
como o IP do computador na rede, e libere somente as portas necessárias no firewall.

O build Android também pode ser compilado localmente com:

```bash
npm run android:dev
```

Esse comando exige Android Studio/SDK. O script `build:android:dev` usa EAS Build na nuvem e não
exige ferramentas nativas locais. O identificador nativo reservado é `com.veronicalens.app` e o
scheme de deep link é `veronicalens`.

As permissões de câmera, localização e movimento são declaradas somente porque as respectivas
funcionalidades já estão implementadas, mantendo o princípio de menor privilégio.

## Scripts

- `npm start`: inicia o Metro/Expo.
- `npm run start:dev`: inicia o Metro para o Development Build.
- `npm run start:dev:tunnel`: inicia para o Development Build usando tunnel.
- `npm run android`: abre o app Android já disponível.
- `npm run android:dev`: compila e instala o development build Android local.
- `npm run build:android:dev`: gera um APK de desenvolvimento no EAS Build.
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
- [Arquitetura frontend com FSD e NativeWind](docs/frontend-architecture.md)
- [Contrato HTTP consumido](docs/api-contract.md)
- [Autenticação e sessão segura](docs/authentication.md)
- [Ambientes e configuração pública](docs/environment.md)
- [Captura com VisionCamera](docs/camera-capture.md)
- [Decisão sobre controles de câmera Android](docs/adr-0001-android-camera-controls.md)
- [Protocolo do spike de câmera Android](docs/spikes/VRLENS-40-camera-controls.md)
- [Convenções de Git](docs/git-conventions.md)

Exemplo de branch e commit:

```text
chore/VRLENS-66-mobile-repository
chore(app): VRLENS-66 configure mobile repository
```
