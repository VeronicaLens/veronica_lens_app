# Orientação do dispositivo

A feature `device-orientation` encapsula o Expo Sensors e não depende de páginas ou componentes de
interface. O hook público `useDeviceOrientation` fornece:

- `headingDegrees`: direção normalizada entre 0° e menos de 360°;
- `pitchDegrees` e `rollDegrees`: ângulos normalizados entre -180° e 180°;
- disponibilidade individual de acelerômetro, giroscópio, magnetômetro e movimento fundido;
- amostras brutas mais recentes para diagnóstico e evolução da fusão;
- estado, qualidade (`full` ou `degraded`) e mensagem de fallback;
- ação `retry` para uma nova tentativa.

## Frequência

Os sensores são configurados para 50 ms, equivalentes a 20 Hz. Essa frequência oferece atualização
adequada ao overlay sem solicitar `HIGH_SAMPLING_RATE_SENSORS` no Android e sem provocar uma
renderização para cada sensor bruto. Apenas a medição fundida publica uma nova orientação.

## Disponibilidade e fallback

- O acesso só começa depois da permissão de movimento.
- Cada sensor é verificado com `isAvailableAsync` antes da assinatura.
- Sem `DeviceMotion`, a camada indica que o guia deve oferecer controle manual.
- Com movimento fundido, mas sem algum sensor bruto, a orientação permanece ativa em modo
  degradado e informa possível perda de precisão.
- Erros de inicialização não derrubam a tela e permitem tentar novamente.
- Todas as assinaturas são removidas ao desmontar a tela ou desativar o hook.

O aplicativo está bloqueado em retrato. Portanto, os eixos seguem a convenção do Expo em retrato:
X da esquerda para a direita, Y de baixo para cima e Z perpendicular à tela.

Referência: https://docs.expo.dev/versions/v57.0.0/sdk/devicemotion/
