/**
 * Translates push registration failures into actionable messages. The most common cause on
 * Android development builds is a missing Firebase (FCM) configuration.
 */
export function describePushRegistrationError(cause: unknown): string {
  const message = cause instanceof Error ? cause.message : typeof cause === 'string' ? cause : '';
  if (/firebase|fcm|google-services|messaging/i.test(message)) {
    return 'As notificações push ainda não estão configuradas neste build do app (Firebase/FCM ausente no Android).';
  }
  if (/network|fetch|timeout|offline/i.test(message)) {
    return 'Sem conexão para registrar este dispositivo. Tente novamente quando estiver online.';
  }
  if (/projectId/i.test(message)) {
    return 'O projeto Expo deste build não está configurado para notificações push.';
  }
  return 'Não foi possível registrar este dispositivo para alertas.';
}
