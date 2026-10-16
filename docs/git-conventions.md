# Convenções de Git

## Branches

Use branches curtas a partir de `main`, sempre com a chave Jira:

```text
feature/VRLENS-XX-description
fix/VRLENS-XX-description
chore/VRLENS-XX-description
docs/VRLENS-XX-description
```

## Commits

Use Conventional Commits com a chave Jira:

```text
feat(app): VRLENS-XX add camera permission flow
fix(auth): VRLENS-XX handle expired session
```

## Pull requests

- Não faça push direto na `main`.
- Abra PR com título `[VRLENS-XX] Descrição`.
- Execute `npm run validate`.
- Resolva todas as conversas antes do merge.
- Use squash merge e exclua a branch após o merge.

## Releases

O app usa SemVer e tags `vMAJOR.MINOR.PATCH`. A versão do app é independente da API.
