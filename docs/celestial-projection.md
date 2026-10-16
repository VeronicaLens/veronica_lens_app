# Projeção de objetos celestes

A feature `celestial-projection` transforma altitude e azimute em coordenadas da tela usando a
orientação do aparelho, o campo de visão da câmera e o tamanho do preview.

## Convenções

- Azimute começa no norte (`0°`) e cresce em direção ao leste (`90°`).
- Altitude varia de `-90°` a `90°`, com valores positivos acima do horizonte.
- `heading` e `pitch` indicam o centro óptico do preview.
- `roll` positivo gira o eixo horizontal da tela em direção ao alto.
- X cresce da esquerda para a direita; Y cresce do topo para a base.
- Os campos de visão horizontal e vertical devem representar o preview efetivamente exibido,
  considerando eventual recorte da câmera.

## Modelo

A projeção é pinhole/gnomônica. A direção celeste é convertida para um vetor no sistema local
leste-cima-norte e depois para a base da câmera. A divisão pela profundidade produz as coordenadas
normalizadas, escaladas separadamente pela tangente de metade de cada field of view.

`projectCelestialToScreen` retorna `null` quando o objeto está atrás da câmera ou fora do frustum.
`projectVisibleCelestialObjects` aplica a mesma regra a uma coleção e devolve somente os objetos que
podem ser desenhados no overlay, preservando todos os metadados do objeto em `celestialObject`.

Essa camada não acessa câmera, sensores ou rede. A tela de RA deve fornecer os dados produzidos pela
feature `device-orientation`, o FOV calibrado para o dispositivo e as dimensões reais do preview.
