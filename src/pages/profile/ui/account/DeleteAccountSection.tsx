import { useState } from 'react';
import { Text, View } from 'react-native';

import { deleteAccount } from '../../../../features/profile/index.ts';
import { Button, TextField } from '../../../../shared/ui/index.ts';

const CONFIRMATION_WORD = 'EXCLUIR';

function isDeletionConfirmed(value: string): boolean {
  return value.trim().toUpperCase() === CONFIRMATION_WORD;
}

export function DeleteAccountSection({
  accessToken,
  onDeleted,
}: {
  accessToken: string;
  onDeleted(): Promise<void>;
}) {
  const [confirming, setConfirming] = useState(false);
  const [confirmation, setConfirmation] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    setDeleting(true);
    setError(null);
    try {
      await deleteAccount(accessToken);
    } catch {
      setError('Não foi possível excluir sua conta agora. Nada foi alterado; tente novamente.');
      setDeleting(false);
      return;
    }
    await onDeleted().catch(() => undefined);
  };

  if (!confirming) {
    return (
      <View className="gap-3">
        <Text className="font-body text-xs leading-[18px] text-muted">
          Exclua sua conta e todos os dados associados: perfil, fotos, observações, progresso de
          aprendizado e dispositivos de alerta. Essa ação é permanente e não pode ser desfeita.
        </Text>
        <Button
          icon="trash-2"
          label="Excluir minha conta"
          onPress={() => setConfirming(true)}
          variant="secondary"
        />
      </View>
    );
  }

  return (
    <View className="gap-4 rounded-card border border-event bg-surface p-4">
      <Text accessibilityRole="header" className="font-label text-sm text-event">
        Excluir conta permanentemente
      </Text>
      <Text className="font-body text-xs leading-[18px] text-muted">
        Todas as suas fotos e informações serão apagadas e você não poderá recuperá-las. Para
        confirmar, digite {CONFIRMATION_WORD}.
      </Text>
      <TextField
        autoCapitalize="characters"
        autoCorrect={false}
        editable={!deleting}
        label="Confirmação"
        onChangeText={setConfirmation}
        placeholder={CONFIRMATION_WORD}
        value={confirmation}
      />
      {error ? (
        <Text accessibilityLiveRegion="polite" className="font-body text-xs text-event">
          {error}
        </Text>
      ) : null}
      <Button
        busy={deleting}
        disabled={!isDeletionConfirmed(confirmation)}
        icon="trash-2"
        label="Excluir definitivamente"
        onPress={() => void handleDelete()}
      />
      <Button
        disabled={deleting}
        label="Cancelar"
        onPress={() => {
          setConfirming(false);
          setConfirmation('');
          setError(null);
        }}
        variant="ghost"
      />
    </View>
  );
}
