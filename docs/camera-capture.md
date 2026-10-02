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

## Persistência e retry

Após a captura, a imagem sai do cache temporário e é copiada para o diretório persistente do
aplicativo antes de qualquer tentativa de rede. A fila local guarda os identificadores idempotentes,
o instante, o aparelho, os parâmetros aplicados, a localização disponível e o objeto celeste
selecionado. A API autenticada envia o arquivo ao bucket privado `observations` no caminho
`<user_id>/<observation_id>/<photo_id>.jpg`.

Somente depois de a API confirmar o arquivo e os metadados a cópia local é removida. Uma falha de
rede ou Storage mantém a fila e o arquivo para nova tentativa na próxima abertura do guia.

## Captura assistida

A folha de ajustes mostra recomendações de foco, exposição e estabilidade derivadas das capacidades
da câmera ativa. Os controles de compensação de exposição, ISO e tempo respeitam os intervalos
reportados; as escolhas são aplicadas antes do disparo e qualquer falha retorna ao modo automático
sem impedir a captura básica. ISO e tempo manual permanecem automáticos no Android até existir um adaptador
Camera2/CameraX que consiga aplicar esses valores; esses controles só aparecem em plataformas que
confirmem suporte efetivo.

O resultado `CapturedPhoto` acompanha metadados internos com instante UTC, câmera ativa e os
parâmetros efetivamente aplicados. ISO e tempo de exposição são registrados como `automatic`
quando o Android não oferece controle manual. Esses metadados ficam prontos para persistência ou
upload posterior; esta história não reescreve EXIF nem publica a imagem na galeria.

Referências:

- https://visioncamera.margelo.com/docs
- https://visioncamera.margelo.com/docs/photo-output
- https://docs.expo.dev/develop/development-builds/introduction/
