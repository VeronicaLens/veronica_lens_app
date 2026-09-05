# Ambientes e configuração pública

## Desenvolvimento

Copie `.env.example` para `.env` e informe somente valores públicos. O Expo inclui toda variável
`EXPO_PUBLIC_*` no bundle, portanto ela nunca pode conter secret key, `service_role`, senha ou token
privilegiado.

## Produção

Configure somente `EXPO_PUBLIC_API_URL` no ambiente de build do Expo/EAS ou da pipeline. A URL deve
apontar para a API própria do ambiente; credenciais e endereços do Supabase pertencem exclusivamente
ao backend.

## Falhas de configuração

`getPublicEnvironment` interrompe a inicialização do serviço dependente com o nome da variável
ausente. O erro nunca imprime valores configurados. Depois de alterar `.env`, reinicie o Metro para
que o bundle seja recriado.

## Checklist

- Nunca prefixar um segredo com `EXPO_PUBLIC_`.
- Nunca copiar URL, publishable key, `SUPABASE_SECRET_KEY` ou `service_role` do Supabase para este
  repositório.
- Revisar o bundle e o diff do PR antes de promover uma build.
- Consumir dados e autenticação somente pelos endpoints da API.
