# @andreunix/sql-migrations

> Sistema de migrations SQL estilo Laravel para PostgreSQL em TypeScript/JavaScript

![npm version](https://img.shields.io/npm/v/@andreunix/sql-migrations)
![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)

## 📦 Instalação

```bash
npm install @andreunix/sql-migrations pg
# ou
yarn add @andreunix/sql-migrations pg
# ou
bun add @andreunix/sql-migrations pg
```

## 🚀 Quick Start

### Uso Programático

```typescript
import { createMigrationRunner, DatabasePool } from '@andreunix/sql-migrations';

// Criar pool de conexões
const pool = DatabasePool.create({
  host: 'localhost',
  port: 5432,
  database: 'mydb',
  user: 'postgres',
  password: 'postgres'
});

// Criar runner
const runner = createMigrationRunner(pool, {
  migrationsDir: 'migrations'
});

// Executar migrations pendentes
await runner.up();

// Ver status
const status = await runner.status();
console.log(status);

// Cleanup
await pool.end();
```

### Uso via CLI

```bash
# Criar nova migration
npx sql-migrate create create_users_table
# ou usando o comando mais simples:
npx migrate create create_users_table

# Executar migrations pendentes
npx migrate up

# Ver status
npx sql-migrate status

# Reverter última migration
npx sql-migrate down

# Reverter 3 migrations
npx sql-migrate down 3

# Reset completo
npx sql-migrate reset

# Refresh (down + up)
npx sql-migrate refresh
```

## 📋 Formato de Migration

As migrations são arquivos SQL únicos com seções **UP** e **DOWN**:

```sql
-- ============================================
-- Migration: create_users_table
-- Created: 2026-01-18
-- ============================================

-- ============================================
-- UP
-- ============================================

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- DOWN
-- ============================================

DROP TABLE IF EXISTS users;
```

### Nomenclatura

Formato: `YYYY_MM_DD_HHMMSS_nome_da_migration.sql`

Exemplos:
- `2026_01_18_121955_create_users_table.sql`
- `2026_01_18_143022_add_email_to_tenants.sql`

## ⚙️ Configuração

Crie um arquivo `.env` na raiz do projeto:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=mydb
DB_USER=postgres
DB_PASSWORD=postgres
MIGRATIONS_DIR=migrations
MIGRATIONS_TABLE=migrations
```

## 📚 API

### MigrationRunner

```typescript
class MigrationRunner {
  constructor(pool: Pool, options?: MigrationOptions)
  
  // Executar migrations pendentes
  async up(): Promise<void>
  
  // Reverter migrations
  async down(steps?: number): Promise<void>
  
  // Exibir status
  async status(): Promise<MigrationStatus[]>
  
  // Reset completo
  async reset(): Promise<void>
  
  // Refresh (down + up)
  async refresh(steps?: number): Promise<void>
}
```

### MigrationCreator

```typescript
class MigrationCreator {
  constructor(migrationsDir: string)
  
  // Criar nova migration
  create(name: string): string
  
  // Listar migrations
  list(): MigrationFile[]
}
```

### DatabasePool

```typescript
class DatabasePool {
  // Criar pool
  static create(config?: PoolConfig): Pool
  
  // Testar conexão
  static test(pool: Pool): Promise<boolean>
  
  // Fechar pool
  static close(pool: Pool): Promise<void>
}
```

## 🎯 Comandos CLI

**Nota:** Você pode usar tanto `sql-migrate` quanto `migrate` como comando principal!

| Comando | Descrição |
|---------|-----------|
| `create <name>` | Criar nova migration |
| `up` / `migrate` | Executar migrations pendentes |
| `down [steps]` | Reverter migrations (padrão: 1) |
| `status` | Exibir status das migrations |
| `reset` | Reverter todas as migrations |
| `refresh [steps]` | Reverter e re-executar migrations |
| `list` | Listar todas as migrations |
| `help` | Exibir ajuda |

## 💡 Exemplos

### Exemplo 1: Setup Básico

```typescript
import { MigrationRunner, DatabasePool } from '@andreunix/sql-migrations';

const pool = DatabasePool.create();
const runner = new MigrationRunner(pool);

await runner.up();
await pool.end();
```

### Exemplo 2: Criar e Executar

```typescript
import { MigrationCreator, MigrationRunner, DatabasePool } from '@andreunix/sql-migrations';

// Criar migration
const creator = new MigrationCreator('migrations');
creator.create('add_avatar_to_users');

// Executar
const pool = DatabasePool.create();
const runner = new MigrationRunner(pool);
await runner.up();
```

### Exemplo 3: Status e Controle

```typescript
// Ver status
const status = await runner.status();

for (const item of status) {
  console.log(`${item.executed ? '✅' : '⏳'} ${item.migration.fullName}`);
}

// Reverter última
await runner.down(1);

// Refresh completo
await runner.refresh();
```

## 🔧 Build e Desenvolvimento

```bash
# Instalar dependências
npm install

# Build
npm run build

# Watch mode
npm run dev

# Link local para testes
npm link
```

## 📦 Publicação no NPM

```bash
# Login
npm login

# Build
npm run build

# Publicar
npm publish --access public
```

## 🛡️ Segurança

- ✅ Sanitização de nomes de migrations
- ✅ Validação de formato de arquivos SQL
- ✅ Prepared statements no PostgreSQL
- ✅ Transações automáticas por migration
- ✅ Validação de paths

## 🌍 Compatibilidade

- ✅ Node.js >= 18
- ✅ PostgreSQL >= 12
- ✅ TypeScript >= 5.0
- ✅ CommonJS

## 📝 Licença

MIT

## 🤝 Contribuindo

Contribuições são bem-vindas! Sinta-se à vontade para abrir issues e pull requests.

## 📖 Documentação

Ver [MIGRATION_LIBRARY_SPEC.md](./MIGRATION_LIBRARY_SPEC.md) para especificação completa.
