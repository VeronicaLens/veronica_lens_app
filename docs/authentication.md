# Autenticação no aplicativo

O app envia credenciais somente à API VeronicaLens. Não há URL, chave ou SDK do Supabase no bundle
mobile.

## Sessão

Access token, refresh token e dados mínimos da sessão são persistidos pelo `expo-secure-store`. Ao
abrir o app, o refresh token é enviado à API, que renova e rotaciona a sessão. Se a renovação falhar,
o armazenamento seguro é limpo e a tela de login volta a ser exibida.

Enquanto o aplicativo permanece aberto, a sessão é renovada um minuto antes do vencimento. Tokens
expirados ou datas inválidas provocam uma tentativa imediata de renovação.

O logout tenta revogar todas as sessões no backend e sempre remove a cópia local, mesmo quando a
rede falha.

## Recuperação de senha

O usuário solicita a recuperação sem que a resposta revele se a conta existe. O e-mail do Supabase
abre `veronicalens://auth/reset-password`; o aplicativo aceita somente links com `type=recovery` e
envia o access token recebido à API para trocar a senha.

Para testar o deep link com o Expo em um dispositivo conectado:

```bash
npx uri-scheme open "veronicalens://auth/reset-password#type=recovery&access_token=TOKEN" --android
```

Use apenas tokens do ambiente de desenvolvimento e nunca registre URLs de recuperação em logs.
