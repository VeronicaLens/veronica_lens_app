# VRLENS-40 — protocolo de validação de câmera Android

Este documento registra o resultado reproduzível do spike. Não há resultado físico inventado: a
execução em dois aparelhos requer o Development Build que será criado na VRLENS-52.

## Objetivo

Confirmar, por câmera traseira física, se o aparelho permite:

- foco/medição por toque;
- lock de AE, AF e AWB;
- compensação de exposição;
- seleção manual de ISO;
- seleção manual do tempo de exposição.

## Preparação

1. Gerar um Expo Development Build Android com VisionCamera pelo EAS Build.
2. Instalar o APK em um aparelho de referência e, quando disponível, em um segundo fabricante/faixa.
3. Usar a câmera traseira `wide-angle` física, evitando inicialmente um dispositivo virtual
   multi-câmera.
4. Testar em ambiente claro e em cena noturna estática, com o aparelho apoiado.
5. Não registrar imagens, localização ou identificadores pessoais no relatório.

## Dados a coletar

Para cada aparelho e câmera, registrar:

- fabricante, modelo, versão Android e nível da API;
- versão do app e do VisionCamera;
- identificador não pessoal e tipo da câmera física;
- suporte a medição de AE, AF e AWB;
- suporte e intervalo de compensação EV;
- nível de hardware Camera2 e presença de `MANUAL_SENSOR`;
- intervalos de ISO e tempo de exposição, quando presentes;
- resultado observado e erro retornado por operação.

## Roteiro funcional

| Caso        | Ação                                              | Evidência esperada                                                                     |
| ----------- | ------------------------------------------------- | -------------------------------------------------------------------------------------- |
| Foco        | Tocar em objeto próximo e depois distante         | Indicador acompanha o toque e a nitidez muda; fallback automático se não suportado     |
| AE          | Medir alternadamente uma região clara e escura    | Luminosidade-alvo muda sem encerrar o preview                                          |
| Lock 3A     | Medir, bloquear e recompor a cena                 | Parâmetros permanecem estáveis até reset/troca de câmera                               |
| EV          | Aplicar mínimo, zero e máximo anunciados          | Imagem escurece/normaliza/clareia sem aceitar valor fora do intervalo                  |
| ISO         | Aplicar mínimo, intermediário e máximo anunciados | Só executar com adaptador nativo e `MANUAL_SENSOR`; metadado confirma o valor          |
| Exposição   | Aplicar três tempos dentro do intervalo           | Só executar com adaptador nativo e `MANUAL_SENSOR`; duração/metadado confirmam o valor |
| Recuperação | Revogar permissão, trocar lente e reabrir app     | Erro amigável; capacidades são recalculadas e nenhum valor antigo é reaplicado         |

## Matriz de execução

| Aparelho               | Android/API | Câmera        | AF/AE/AWB     | EV (mín/máx) | `MANUAL_SENSOR` | ISO           | Exposição     | Resultado         |
| ---------------------- | ----------- | ------------- | ------------- | ------------ | --------------- | ------------- | ------------- | ----------------- |
| A definir — aparelho 1 | —           | wide traseira | Não executado | —            | Não consultado  | Não executado | Não executado | Aguarda VRLENS-52 |
| A definir — aparelho 2 | —           | wide traseira | Não executado | —            | Não consultado  | Não executado | Não executado | Quando disponível |

## Critério de aprovação

- Preview e captura básica funcionam mesmo sem controles avançados.
- A UI só apresenta capacidades confirmadas em runtime.
- Valores são limitados aos intervalos anunciados pelo hardware.
- Falhas retornam ao modo automático sem encerrar a tela.
- Diferenças entre aparelhos ficam registradas nesta matriz antes da liberação do recurso.

## Resultado do spike

- **Viável no MVP:** preview/captura, foco por ponto, medição/lock 3A e compensação EV via
  VisionCamera, sempre protegidos por capability checks.
- **Exige desenvolvimento nativo adicional no Android:** embora o VisionCamera exponha leitura de
  ISO/duração e `setExposureLocked`, a referência atual marca o setter apenas para iOS. O Android
  precisa de Camera2/CameraX Interop para esses controles manuais.
- **Estratégia escolhida:** experiência progressiva por capacidade, com captura automática como
  baseline universal.
- **Restrição de execução:** os testes físicos foram planejados, mas não executados durante o spike
  por ausência de dois dispositivos e do binário nativo, que pertence à VRLENS-52.
