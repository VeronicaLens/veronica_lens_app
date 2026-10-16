import { getPublicEnvironment } from '../../../../shared/config/index.ts';
import { AccountScreenLayout, AccountSection, InfoRow, LinkRow } from './AccountScreenParts.tsx';
import { openExternalUrl } from './external-links.ts';

export function PrivacyScreen({ email, onBack }: { email: string; onBack(): void }) {
  const { privacyPolicyUrl } = getPublicEnvironment();

  return (
    <AccountScreenLayout
      onBack={onBack}
      subtitle="Veja quais informações o VeronicaLens guarda, para que servem e como você controla cada uma."
      title="Dados e privacidade"
    >
      <AccountSection title="Informações da sua conta">
        <InfoRow
          description={`E-mail ${email}, nome e foto de perfil, usados para identificar sua conta e personalizar o app.`}
          icon="user"
          title="Perfil"
        />
        <InfoRow
          description="Local e coordenadas que você informa ou autoriza, usados para eventos, condições do céu e guia celeste. As coordenadas são enviadas ao servidor do app, que as repassa ao serviço meteorológico Open-Meteo e à API astronômica JPL Horizons para gerar os dados."
          icon="map-pin"
          title="Localização"
        />
        <InfoRow
          description="Fotos que você captura e seus detalhes (data, local e ajustes da câmera), guardadas na sua galeria em nuvem e visíveis só para você."
          icon="image"
          title="Fotos e observações"
        />
        <InfoRow
          description="Identificador do aparelho para push, tipos de alerta escolhidos e antecedência, usados apenas para avisar sobre eventos."
          icon="bell"
          title="Notificações"
        />
        <InfoRow
          description="Seu avanço nas trilhas e aulas de astronomia, para retomar de onde parou."
          icon="graduation-cap"
          title="Aprendizado"
        />
      </AccountSection>

      <AccountSection title="Você no controle">
        <InfoRow
          description="Na aba Galeria, abra uma foto e use a lixeira, ou mantenha o toque na miniatura. Os arquivos são removidos do armazenamento."
          icon="trash-2"
          title="Excluir fotos"
        />
        <InfoRow
          description="No Perfil, desative Notificações para parar os avisos; seu aparelho deixa de receber alertas."
          icon="bell-off"
          title="Desativar alertas"
        />
        <InfoRow
          description="No Perfil, desative Localização para apagar o local e as coordenadas salvos na sua conta."
          icon="map-pin-off"
          title="Remover localização"
        />
        <InfoRow
          description="Ao tocar em Sair da conta, o aparelho é desvinculado dos alertas e a sessão é encerrada."
          icon="log-out"
          title="Sair da conta"
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
