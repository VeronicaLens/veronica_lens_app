import { Lucide } from '@react-native-vector-icons/lucide';
import { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ApiError, type SignUpResult } from '../../../shared/api/index.ts';
import { GoogleSignInCancelledError } from '../../../features/auth/model/google-sign-in.ts';
import { theme } from '../../../shared/config/index.ts';
import { Button, TextField } from '../../../shared/ui/index.ts';

const backgroundImage = require('../../../../assets/loading-background.jpeg') as number;
const logoImage = require('../../../../assets/logo.png') as number;
const googleLogoImage = require('../../../../assets/google-logo.png') as number;
const LOGO_WIDTH = 176;
const LOGO_ASPECT_RATIO = 1600 / 533;

type Mode = 'sign-in' | 'sign-up' | 'recovery' | 'reset';

interface AuthPageProps {
  recoveryAccessToken: string | null;
  onSignIn(email: string, password: string): Promise<void>;
  onGoogleSignIn(): Promise<void>;
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
  if (error instanceof TypeError) {
    return 'Não foi possível conectar à API. Tente novamente.';
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return 'Não foi possível conectar à API. Tente novamente.';
}

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
  onGoogleSignIn,
  onSignUp,
  onRequestRecovery,
  onUpdatePassword,
  onResetComplete,
}: AuthPageProps) {
  const [mode, setMode] = useState<Mode>(recoveryAccessToken ? 'reset' : 'sign-in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);
  const emailIsValid = /^\S+@\S+\.\S+$/.test(email.trim());
  const passwordIsValid = mode === 'sign-in' ? password.length > 0 : password.length >= 8;
  const canSubmit = (mode === 'reset' || emailIsValid) && (mode === 'recovery' || passwordIsValid);
  const showSocialOptions = mode === 'sign-in' || mode === 'sign-up';

  const changeMode = (nextMode: Mode) => {
    setMode(nextMode);
    setPassword('');
    setMessage(null);
  };

  const submitGoogle = async () => {
    setGoogleBusy(true);
    setMessage(null);
    try {
      await onGoogleSignIn();
    } catch (error) {
      if (error instanceof GoogleSignInCancelledError) return;
      console.error('Google sign-in failed', error);
      setMessage(friendlyMessage(error));
    } finally {
      setGoogleBusy(false);
    }
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
    <ImageBackground className="flex-1 bg-canvas" resizeMode="cover" source={backgroundImage}>
      <SafeAreaView className="flex-1 bg-canvas/40">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          className="flex-1"
        >
          <ScrollView contentContainerClassName="flex-grow" keyboardShouldPersistTaps="handled">
            <View className="items-center gap-2 px-6 pb-8 pt-10">
              <Image
                resizeMode="contain"
                source={logoImage}
                style={{ width: LOGO_WIDTH, height: LOGO_WIDTH / LOGO_ASPECT_RATIO }}
              />
              <Text
                accessibilityRole="header"
                className="text-center font-display text-[34px] text-ink"
              >
                {mode === 'sign-up' ? (
                  <>
                    Criar <Text className="text-accent">conta</Text>
                  </>
                ) : mode === 'recovery' ? (
                  'Recuperar senha'
                ) : mode === 'reset' ? (
                  'Definir nova senha'
                ) : (
                  'Entrar'
                )}
              </Text>
              <Text className="max-w-xs text-center font-body text-sm leading-5 text-muted">
                {descriptions[mode]}
              </Text>
            </View>

            <View className="flex-1 gap-5 rounded-t-panel bg-canvas/90 px-6 pb-10 pt-8">
              {mode === 'sign-up' ? (
                <TextField
                  autoCapitalize="words"
                  autoComplete="name"
                  icon="user"
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
                  icon="mail"
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
                  icon="lock"
                  label={mode === 'reset' ? 'Nova senha' : 'Senha'}
                  onChangeText={setPassword}
                  placeholder={mode === 'reset' ? 'Mínimo de 8 caracteres' : 'Sua senha'}
                  secureTextEntry={!passwordVisible}
                  trailing={
                    <Pressable
                      accessibilityLabel={passwordVisible ? 'Ocultar senha' : 'Mostrar senha'}
                      accessibilityRole="button"
                      hitSlop={8}
                      onPress={() => setPasswordVisible((visible) => !visible)}
                    >
                      <Lucide
                        color={theme.colors.muted}
                        name={passwordVisible ? 'eye-off' : 'eye'}
                        size={18}
                      />
                    </Pressable>
                  }
                  value={password}
                />
              ) : null}

              {mode === 'sign-in' ? (
                <Pressable className="self-end" onPress={() => changeMode('recovery')}>
                  <Text className="font-label text-xs text-accent">Esqueci minha senha?</Text>
                </Pressable>
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

              {showSocialOptions ? (
                <>
                  <View className="flex-row items-center gap-3">
                    <View className="h-px flex-1 bg-border" />
                    <Text className="font-body text-xs text-muted">ou continue com</Text>
                    <View className="h-px flex-1 bg-border" />
                  </View>

                  <Pressable
                    accessibilityRole="button"
                    accessibilityState={{ busy: googleBusy, disabled: busy || googleBusy }}
                    className={`h-11 min-h-11 flex-row items-center justify-center gap-2 rounded-pill border border-border bg-surface-2 px-5 active:opacity-80 ${
                      busy || googleBusy ? 'opacity-60' : ''
                    }`}
                    disabled={busy || googleBusy}
                    onPress={() => void submitGoogle()}
                  >
                    {googleBusy ? (
                      <ActivityIndicator color={theme.colors.accent} />
                    ) : (
                      <>
                        <Image
                          resizeMode="contain"
                          source={googleLogoImage}
                          style={{ width: 18, height: 18 }}
                        />
                        <Text className="font-label text-xs text-ink">Continuar com Google</Text>
                      </>
                    )}
                  </Pressable>
                </>
              ) : null}

              {mode === 'sign-in' ? (
                <Pressable className="items-center pt-1" onPress={() => changeMode('sign-up')}>
                  <Text className="text-center font-body text-sm text-muted">
                    Não tem uma conta?{' '}
                    <Text className="font-label text-sm text-accent">Criar conta</Text>
                  </Text>
                </Pressable>
              ) : null}

              {mode === 'sign-up' || mode === 'recovery' ? (
                <Pressable className="items-center pt-1" onPress={() => changeMode('sign-in')}>
                  <Text className="text-center font-body text-sm text-muted">
                    Já tem uma conta? <Text className="font-label text-sm text-accent">Entrar</Text>
                  </Text>
                </Pressable>
              ) : null}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ImageBackground>
  );
}
