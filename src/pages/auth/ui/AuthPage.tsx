import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ApiError, type SignUpResult } from '../../../shared/api/index.ts';
import { Button, TextField } from '../../../shared/ui/index.ts';

type Mode = 'sign-in' | 'sign-up' | 'recovery' | 'reset';

interface AuthPageProps {
  recoveryAccessToken: string | null;
  onSignIn(email: string, password: string): Promise<void>;
  onSignUp(email: string, password: string, displayName: string): Promise<SignUpResult>;
  onRequestRecovery(email: string): Promise<string>;
  onUpdatePassword(accessToken: string, password: string): Promise<void>;
  onResetComplete(): void;
}

function friendlyMessage(error: unknown): string {
  if (error instanceof ApiError) {
    const messages: Record<string, string> = {
      AUTH_INVALID_CREDENTIALS: 'E-mail ou senha inválidos.',
      AUTH_EMAIL_NOT_CONFIRMED: 'Confirme seu e-mail antes de entrar.',
      AUTH_ACCOUNT_EXISTS: 'Já existe uma conta para este e-mail.',
      AUTH_RATE_LIMITED: 'Muitas tentativas. Aguarde alguns minutos.',
      VALIDATION_ERROR: 'Revise os dados informados.',
    };
    return messages[error.code] ?? 'Não foi possível concluir a solicitação.';
  }
  return 'Não foi possível conectar à API. Tente novamente.';
}

const titles: Record<Mode, string> = {
  'sign-in': 'Entrar',
  'sign-up': 'Criar conta',
  recovery: 'Recuperar senha',
  reset: 'Definir nova senha',
};

const actions: Record<Mode, string> = {
  'sign-in': 'Entrar',
  'sign-up': 'Criar conta',
  recovery: 'Enviar instruções',
  reset: 'Atualizar senha',
};

const descriptions: Record<Mode, string> = {
  'sign-in': 'Acesse sua jornada de observação do céu.',
  'sign-up': 'Crie seu espaço pessoal no VeronicaLens.',
  recovery: 'Informe seu e-mail para receber as instruções.',
  reset: 'Escolha uma senha segura para continuar.',
};

export function AuthPage({
  recoveryAccessToken,
  onSignIn,
  onSignUp,
  onRequestRecovery,
  onUpdatePassword,
  onResetComplete,
}: AuthPageProps) {
  const [mode, setMode] = useState<Mode>(recoveryAccessToken ? 'reset' : 'sign-in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const emailIsValid = /^\S+@\S+\.\S+$/.test(email.trim());
  const passwordIsValid = mode === 'sign-in' ? password.length > 0 : password.length >= 8;
  const canSubmit = (mode === 'reset' || emailIsValid) && (mode === 'recovery' || passwordIsValid);

  const changeMode = (nextMode: Mode) => {
    setMode(nextMode);
    setPassword('');
    setMessage(null);
  };

  const submit = async () => {
    setBusy(true);
    setMessage(null);

    try {
      if (mode === 'sign-in') {
        await onSignIn(email.trim(), password);
      } else if (mode === 'sign-up') {
        const result = await onSignUp(email.trim(), password, displayName);
        if (result.confirmationRequired) {
          changeMode('sign-in');
          setMessage('Conta criada. Confira seu e-mail para confirmar o cadastro.');
        }
      } else if (mode === 'recovery') {
        await onRequestRecovery(email.trim());
        setMessage('Se a conta existir, enviaremos as instruções de recuperação.');
      } else if (recoveryAccessToken) {
        await onUpdatePassword(recoveryAccessToken, password);
        onResetComplete();
        changeMode('sign-in');
        setMessage('Senha atualizada. Entre novamente com sua nova senha.');
      }
    } catch (error) {
      setMessage(friendlyMessage(error));
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-canvas">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <ScrollView
          contentContainerClassName="flex-grow justify-center px-6 py-10"
          keyboardShouldPersistTaps="handled"
        >
          <View className="mx-auto w-full max-w-md gap-5">
            <View className="items-center gap-2 pb-3">
              <Text className="font-label text-[11px] uppercase tracking-[2px] text-accent">
                VeronicaLens
              </Text>
              <Text
                accessibilityRole="header"
                className="text-center font-display text-[32px] text-ink"
              >
                {titles[mode]}
              </Text>
              <Text className="max-w-xs text-center font-body text-sm leading-5 text-muted">
                {descriptions[mode]}
              </Text>
            </View>

            {mode === 'sign-up' ? (
              <TextField
                autoCapitalize="words"
                autoComplete="name"
                label="Nome"
                onChangeText={setDisplayName}
                placeholder="Como você quer ser chamada?"
                value={displayName}
              />
            ) : null}

            {mode !== 'reset' ? (
              <TextField
                autoCapitalize="none"
                autoComplete="email"
                keyboardType="email-address"
                label="E-mail"
                onChangeText={setEmail}
                placeholder="voce@exemplo.com"
                value={email}
              />
            ) : null}

            {mode !== 'recovery' ? (
              <TextField
                autoCapitalize="none"
                autoComplete={mode === 'sign-in' ? 'current-password' : 'new-password'}
                label={mode === 'reset' ? 'Nova senha' : 'Senha'}
                onChangeText={setPassword}
                placeholder={mode === 'reset' ? 'Mínimo de 8 caracteres' : 'Sua senha'}
                secureTextEntry
                value={password}
              />
            ) : null}

            {message ? (
              <Text
                accessibilityLiveRegion="polite"
                className="text-center font-body text-sm leading-5 text-muted"
              >
                {message}
              </Text>
            ) : null}

            <Button
              busy={busy}
              disabled={!canSubmit}
              label={actions[mode]}
              onPress={() => void submit()}
            />

            {mode === 'sign-in' ? (
              <View className="items-center gap-4 pt-1">
                <Pressable onPress={() => changeMode('sign-up')}>
                  <Text className="text-center font-label text-xs text-accent">
                    Criar uma conta
                  </Text>
                </Pressable>
                <Pressable onPress={() => changeMode('recovery')}>
                  <Text className="text-center font-label text-xs text-accent">
                    Esqueci minha senha
                  </Text>
                </Pressable>
              </View>
            ) : null}

            {mode === 'sign-up' || mode === 'recovery' ? (
              <Pressable onPress={() => changeMode('sign-in')}>
                <Text className="text-center font-label text-xs text-accent">
                  Voltar para o login
                </Text>
              </Pressable>
            ) : null}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
