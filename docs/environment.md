# Ambientes e configuração pública

## Desenvolvimento

Copie `.env.example` para `.env` e informe somente valores públicos. O Expo inclui toda variável
`EXPO_PUBLIC_*` no bundle, portanto ela nunca pode conter secret key, `service_role`, senha ou token
privilegiado.

## Produção

Configure `EXPO_PUBLIC_API_URL`, `EXPO_PUBLIC_SUPABASE_URL` e
`EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` no ambiente de build do Expo/EAS ou da pipeline. Use um
projeto Supabase e uma API próprios do ambiente. A publishable key identifica o projeto, mas a
autorização dos dados continua obrigatoriamente protegida por grants e RLS.

## Falhas de configuração

`getPublicEnvironment` interrompe a inicialização do serviço dependente com o nome da variável
ausente. O erro nunca imprime valores configurados. Depois de alterar `.env`, reinicie o Metro para
que o bundle seja recriado.

## Checklist

- Nunca prefixar um segredo com `EXPO_PUBLIC_`.
- Nunca copiar `SUPABASE_SECRET_KEY` ou `service_role` para este repositório.
- Revisar o bundle e o diff do PR antes de promover uma build.
- Manter políticas RLS válidas mesmo quando a publishable key for conhecida publicamente.
