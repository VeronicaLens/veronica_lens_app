# ADR 0001 — Controles manuais de câmera no Android

- Status: aceito
- Data: 2026-09-06
- História: VRLENS-40
- Escopo de implementação: VRLENS-52 e histórias posteriores de astrofotografia

## Contexto

O VeronicaLens precisa orientar capturas do céu em aparelhos Android heterogêneos. Antes da
VRLENS-52, o aplicativo usava `expo-camera`, que atendia ao preview do guia celeste no Expo Go, mas
sua API Android pública não oferece foco por ponto, compensação de exposição, ISO nem tempo de
exposição.

O VisionCamera usa CameraX no Android, expõe capacidades por dispositivo e permite extensão
nativa. Entretanto, é uma dependência nativa: sua instalação exige novo binário, portanto não pode
ser validada no cliente padrão do Expo Go.

## Evidências

| Controle                 | `expo-camera` SDK 57          | VisionCamera                                                                     | Camera2 / hardware                                                   | Decisão do MVP                                                                  |
| ------------------------ | ----------------------------- | -------------------------------------------------------------------------------- | -------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| Foco                     | Sem foco por ponto no Android | `focusTo`, com consulta das modalidades suportadas                               | AF varia por câmera física                                           | VisionCamera, somente quando suportado; caso contrário, foco automático central |
| Exposição automática     | Controlada pelo sistema       | Medição AE por ponto e lock 3A                                                   | Depende dos modos/locks anunciados                                   | Medição automática; lock opcional após confirmação no aparelho                  |
| Compensação de exposição | Não exposta                   | `exposure`/`setExposureBias`, limitada por `minExposureBias` e `maxExposureBias` | O intervalo Camera2 `[0,0]` significa indisponível                   | Slider apenas se suportado; caso contrário, ocultar e manter EV 0               |
| ISO                      | Não exposto                   | `setExposureLocked` existe, mas está marcado somente para iOS                    | Requer `MANUAL_SENSOR` e intervalo `SENSOR_INFO_SENSITIVITY_RANGE`   | Fora do caminho padrão do MVP Android; adaptador nativo posterior               |
| Tempo de exposição       | Não exposto                   | `setExposureLocked` existe, mas está marcado somente para iOS                    | Requer `MANUAL_SENSOR` e intervalo `SENSOR_INFO_EXPOSURE_TIME_RANGE` | Fora do caminho padrão do MVP Android; adaptador nativo posterior               |

As APIs Android devem ser consultadas por câmera física, não apenas por modelo de celular. ISO e
tempo de exposição são opcionais e podem ser ausentes mesmo quando o aparelho possui uma câmera
sofisticada. Em dispositivos `FULL`, o Camera2 garante `MANUAL_SENSOR`; em `LIMITED` é obrigatório
consultar as capacidades anunciadas.

## Decisão

1. A VRLENS-52 adotará VisionCamera para a experiência de captura de astrofotografia em um Expo
   Development Build. O binário pode ser gerado pelo EAS Build; Android Studio não é requisito para
   a pessoa que testa o APK.
2. A VRLENS-52 migra o preview do guia celeste para VisionCamera e o mantém atrás da interface da
   feature `camera-capture`, evitando dependência da biblioteca dentro das páginas e duas pilhas de
   câmera no binário.
3. O MVP oferecerá foco por toque, medição/lock 3A e compensação de exposição somente após
   verificar a capacidade da câmera selecionada.
4. ISO e tempo de exposição manual não bloquearão o MVP. Um futuro adaptador Android deverá usar
   Camera2 via CameraX Interop e só habilitar esses controles quando `MANUAL_SENSOR` e os respectivos
   intervalos existirem.
5. O produto nunca exibirá um controle sem efeito. A interface é derivada de uma fotografia das
   capacidades da câmera ativa e deve voltar ao modo automático em falha ou troca de lente.

## Fallbacks

| Capacidade ausente ou falha    | Comportamento                                                             |
| ------------------------------ | ------------------------------------------------------------------------- |
| Foco por ponto                 | Mantém AF contínuo/central e informa “foco automático”                    |
| Medição ou lock 3A             | Mantém o algoritmo automático da câmera; não exibe ação de lock           |
| Compensação EV                 | Mantém EV 0 e oculta/desabilita o slider com explicação acessível         |
| ISO manual                     | Mantém ISO automático; recomenda apoio firme e temporizador               |
| Tempo manual                   | Usa exposição automática; orienta redução de movimento e captura repetida |
| Câmera sem controles avançados | Mantém preview e captura básica da VRLENS-52                              |
| VisionCamera indisponível      | Bloqueia somente a captura avançada, preservando o restante do app        |

## Consequências

- O app de desenvolvimento deixa de depender apenas do Expo Go a partir da VRLENS-52.
- A primeira entrega não promete “modo manual” em todos os aparelhos Android.
- Uma ponte nativa para ISO/obturador é deliberadamente adiada até haver evidência em aparelhos e
  valor suficiente para assumir seu custo de manutenção.
- Toda telemetria de capacidade deve conter somente fabricante, modelo, versão Android, câmera e
  intervalos técnicos; não deve conter foto, localização ou identificadores pessoais.

## Validação pendente em hardware

A análise de API está concluída. O teste físico não foi executado neste ambiente por não haver dois
aparelhos conectados nem um Development Build com VisionCamera. O procedimento e a tabela de
evidências estão em [VRLENS-40 — protocolo de validação](spikes/VRLENS-40-camera-controls.md) e devem
ser executados como primeiro passo da VRLENS-52, antes de disponibilizar controles avançados.

## Referências

- Expo Camera SDK 57: https://docs.expo.dev/versions/v57.0.0/sdk/camera/
- Expo Development Builds: https://docs.expo.dev/develop/development-builds/introduction/
- VisionCamera — instalação e arquitetura: https://visioncamera.margelo.com/docs
- VisionCamera — foco: https://visioncamera.margelo.com/docs/tap-to-focus
- VisionCamera — compensação de exposição: https://visioncamera.margelo.com/docs/exposure-bias
- VisionCamera — API do controlador e disponibilidade por plataforma:
  https://visioncamera.margelo.com/api/react-native-vision-camera/hybrid-objects/CameraController
- Android Camera2 — características: https://developer.android.com/reference/android/hardware/camera2/CameraCharacteristics
