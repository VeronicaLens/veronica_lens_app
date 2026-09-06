# Captura com VisionCamera

A feature `camera-capture` encapsula a dependência nativa, a permissão, o preview traseiro e a
captura em arquivo temporário. Páginas não importam o VisionCamera diretamente.

## Executar no Android sem Android Studio

O VisionCamera não faz parte do cliente padrão do Expo Go. Gere uma vez o Development Build no EAS:

```bash
npx eas-cli@23.2.0 login
npm run build:android:dev
```

Autentique-se no Expo quando solicitado, baixe o APK indicado pelo EAS e instale-o no celular. Em
seguida, para mudanças apenas em TypeScript/JavaScript, execute:

```bash
npm run start:dev
```

Abra o VeronicaLens Development Build instalado e conecte-o ao servidor exibido. Um novo build só
é necessário quando dependências ou configurações nativas mudarem.

## Comportamento

- A permissão é solicitada na primeira abertura e pode ser concedida depois nas configurações.
- A câmera traseira é selecionada automaticamente.
- O botão de captura só é habilitado após o primeiro frame do preview.
- A foto é gravada no cache temporário do aplicativo, sem localização embutida e sem publicação na
  galeria nesta história.
- Falhas de permissão, câmera ausente, câmera ocupada, preview não pronto e captura são convertidas
  em mensagens seguras para o usuário.

O armazenamento definitivo, galeria e upload são responsabilidades de histórias posteriores.

Referências:

- https://visioncamera.margelo.com/docs
- https://visioncamera.margelo.com/docs/photo-output
- https://docs.expo.dev/develop/development-builds/introduction/
