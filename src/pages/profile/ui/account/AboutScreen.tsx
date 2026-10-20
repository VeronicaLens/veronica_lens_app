import { Image, Text, View } from 'react-native';

import appConfig from '../../../../../app.json';
import { getPublicEnvironment } from '../../../../shared/config/index.ts';
import { AccountScreenLayout, AccountSection, InfoRow, LinkRow } from './AccountScreenParts.tsx';
import { openExternalUrl } from './external-links.ts';

const icon = require('../../../../../assets/icon.png') as number;

export function AboutScreen({ onBack }: { onBack(): void }) {
  const { privacyPolicyUrl } = getPublicEnvironment();
  const { name, version } = appConfig.expo;

  return (
    <AccountScreenLayout
      onBack={onBack}
      subtitle="Observação do céu com mais clareza, do planejamento à fotografia."
      title="Sobre o VeronicaLens"
    >
      <View className="items-center gap-3 rounded-card bg-surface p-6">
        <Image
          accessibilityLabel={`Ícone do ${name}`}
          className="h-20 w-20 rounded-card"
          source={icon}
        />
        <Text className="font-display text-xl text-ink">{name}</Text>
        <Text className="font-body text-xs text-muted">Versão {version}</Text>
      </View>

      <AccountSection title="O que você encontra no app">
        <InfoRow
          description="Próximos eventos de nascer, trânsito e ocaso de astros, com alertas antes de começarem."
          icon="calendar-clock"
          title="Eventos astronômicos"
        />
        <InfoRow
          description="Previsão e fatores que influenciam a qualidade da observação no seu local."
          icon="cloud-sun"
          title="Condições do céu"
        />
        <InfoRow
          description="Câmera com controles manuais e guia celeste para registrar o céu."
          icon="camera"
          title="Astrofotografia"
        />
        <InfoRow
          description="Trilha de aprendizado para evoluir aula a aula."
          icon="graduation-cap"
          title="Aprendizado"
        />
        <InfoRow
          description="Suas fotos organizadas por dia, mês e ano, com os detalhes de cada captura."
          icon="image"
          title="Galeria"
        />
      </AccountSection>

      <AccountSection title="Créditos de dados">
        <InfoRow
          description="Posições e eventos de astros calculados com a API JPL Horizons, do Jet Propulsion Laboratory da NASA."
          icon="telescope"
          title="JPL Horizons"
        />
        <InfoRow
          description="Previsão do tempo fornecida pela Open-Meteo."
          icon="cloud"
          title="Open-Meteo"
        />
      </AccountSection>

      {privacyPolicyUrl ? (
        <AccountSection title="Documentos">
          <LinkRow
            icon="file-text"
            label="Política de privacidade"
            onPress={() => openExternalUrl(privacyPolicyUrl)}
          />
        </AccountSection>
      ) : null}
    </AccountScreenLayout>
  );
}
