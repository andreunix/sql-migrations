# 📦 Publicação no NPM

## Pré-requisitos

1. Conta no NPM ([signup](https://www.npmjs.com/signup))
2. Email verificado
3. Autenticação 2FA configurada (opcional mas recomendado)

## Passo a Passo

### 1. Login no NPM

```bash
npm login
```

Você será solicitado a fornecer:
- Username
- Password
- Email
- OTP (se tiver 2FA habilitado)

### 2. Verificar Configuração

Verifique se o `package.json` está correto:

```bash
cat package.json | grep -E "name|version|main|bin"
```

Deve mostrar:
- `"name": "@andreunix/sql-migrations"`
- `"version": "1.0.0"`
- `"main": "dist/index.js"`
- `"bin": { "sql-migrate": ..., "migrate": ... }`

### 3. Build Final

```bash
# Limpar dist anterior
rm -rf dist

# Build
bun run build

# Verificar arquivos compilados
ls -la dist/
```

### 4. Testar Localmente

```bash
# Link local
bun link

# Testar em outro projeto
cd ../test-project
bun link @andreunix/sql-migrations
bun migrate help
```

### 5. Verificar Arquivos a Publicar

```bash
npm pack --dry-run
```

Isso mostrará quais arquivos serão incluídos no pacote.

### 6. Publicar

#### Primeira Publicação

```bash
npm publish --access public
```

Nota: Use `--access public` para pacotes com escopo (@andreunix).

#### Atualizações Futuras

```bash
# Atualizar versão (patch: 1.0.0 -> 1.0.1)
npm version patch

# Ou minor (1.0.0 -> 1.1.0)
npm version minor

# Ou major (1.0.0 -> 2.0.0)
npm version major

# Publicar
npm publish
```

### 7. Verificar Publicação

```bash
# Ver no NPM
npm view @andreunix/sql-migrations

# Instalar em projeto teste
mkdir ../test-install && cd ../test-install
npm install @andreunix/sql-migrations
npx migrate help
```

## Versionamento Semântico

- **MAJOR** (1.0.0 -> 2.0.0): Mudanças incompatíveis na API
- **MINOR** (1.0.0 -> 1.1.0): Novas funcionalidades compatíveis
- **PATCH** (1.0.0 -> 1.0.1): Correções de bugs

## Atualizações

### Corrigir Bug (1.0.0 -> 1.0.1)

```bash
# Fazer correções no código
bun run build

# Atualizar versão
npm version patch

# Publicar
npm publish
```

### Nova Feature (1.0.0 -> 1.1.0)

```bash
# Implementar feature
bun run build

# Atualizar versão
npm version minor

# Publicar
npm publish
```

### Breaking Change (1.0.0 -> 2.0.0)

```bash
# Fazer mudanças incompatíveis
bun run build

# Atualizar versão
npm version major

# Atualizar README com migration guide
# Publicar
npm publish
```

## Tags e Releases

```bash
# Git tags são criados automaticamente pelo npm version
git push origin main --tags

# Criar release no GitHub baseado na tag
```

## Despublicar (Cuidado!)

```bash
# Despublicar versão específica (dentro de 72h)
npm unpublish @andreunix/sql-migrations@1.0.0

# Despublicar tudo (cuidado extremo!)
npm unpublish @andreunix/sql-migrations --force
```

⚠️ **Nota:** Despublicar é irreversível e não recomendado para pacotes públicos.

## CI/CD com GitHub Actions

Crie `.github/workflows/publish.yml`:

```yaml
name: Publish to NPM

on:
  release:
    types: [created]

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: oven-sh/setup-bun@v1
      - run: bun install
      - run: bun run build
      - uses: JS-DevTools/npm-publish@v1
        with:
          token: ${{ secrets.NPM_TOKEN }}
```

## Checklist Final

- [ ] README.md atualizado e completo
- [ ] package.json com informações corretas
- [ ] Build realizado (`bun run build`)
- [ ] Testado localmente (`bun link`)
- [ ] Versão correta no package.json
- [ ] .gitignore incluindo node_modules e dist
- [ ] LICENSE file presente
- [ ] npm login realizado
- [ ] `npm publish --access public` executado
- [ ] Verificado no npmjs.com
- [ ] Git tags criadas e pushed
- [ ] GitHub release criado

## Links Úteis

- NPM Package: https://www.npmjs.com/package/@andreunix/sql-migrations
- NPM Docs: https://docs.npmjs.com/
- Semantic Versioning: https://semver.org/
