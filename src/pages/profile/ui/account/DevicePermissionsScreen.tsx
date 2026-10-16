import { Pressable, Text } from 'react-native';

import {
  describePermission,
  useDevicePermissions,
  type DevicePermissionKey,
} from '../../../../features/device-permissions/index.ts';
import { AccountScreenLayout, AccountSection, InfoRow } from './AccountScreenParts.tsx';
import { openSystemSettings } from './external-links.ts';

const permissionRows: readonly {
  key: DevicePermissionKey;
  icon: 'camera' | 'map-pin' | 'bell' | 'image';
  title: string;
  description: string;
}[] = [
  {
    key: 'camera',
    icon: 'camera',
    title: 'Câmera',
    description: 'Necessária para capturar astrofotos e usar o guia celeste.',
  },
  {
    key: 'location',
    icon: 'map-pin',
    title: 'Localização',
    description: 'Usada durante a observação para calcular o que está visível no céu.',
  },
  {
    key: 'notifications',
    icon: 'bell',
    title: 'Notificações',
    description: 'Permite avisar sobre eventos astronômicos antes de começarem.',
  },
  {
    key: 'photos',
    icon: 'image',
    title: 'Fotos',
    description: 'Usada apenas para escolher sua foto de perfil.',
  },
];

export function DevicePermissionsScreen({ onBack }: { onBack(): void }) {
  const permissions = useDevicePermissions();

  return (
    <AccountScreenLayout
      onBack={onBack}
      subtitle="Veja o que o app pode usar no seu aparelho. Você pode mudar isso quando quiser."
      title="Permissões do dispositivo"
    >
      <AccountSection title="Acessos do app">
        {permissionRows.map((row) => {
          const snapshot = permissions.snapshots[row.key];
          const presentation = snapshot ? describePermission(snapshot) : null;
          return (
            <InfoRow
              key={row.key}
              description={`${row.description}${presentation ? ` Status: ${presentation.label}.` : ''}`}
              icon={row.icon}
              title={row.title}
              trailing={
                presentation ? (
                  <Pressable
                    accessibilityLabel={`${presentation.actionLabel}: ${row.title}`}
                    accessibilityRole="button"
                    className="min-h-9 justify-center rounded-pill bg-[#292354] px-3 active:opacity-80"
                    onPress={() =>
                      presentation.action === 'request'
                        ? void permissions.request(row.key)
                        : openSystemSettings()
                    }
                  >
                    <Text className="font-label text-[10px] text-accent">
                      {presentation.actionLabel}
                    </Text>
                  </Pressable>
                ) : null
              }
            />
          );
        })}
      </AccountSection>
      <Text className="font-body text-xs leading-[18px] text-muted">
        Para revogar uma permissão já concedida, use Gerenciar e altere o acesso nos ajustes do
        Android. O app continua disponível, mas os recursos que dependem dela ficam limitados.
      </Text>
    </AccountScreenLayout>
  );
}
