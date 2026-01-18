# 🧪 Testando a Biblioteca Localmente

## Passo 1: Build

```bash
bun run build
```

## Passo 2: Link Local

```bash
bun link
```

## Passo 3: Criar Projeto de Teste

```bash
mkdir ../test-migrations
cd ../test-migrations
bun init -y
bun add pg
bun link @satoru/sql-migrations
```

## Passo 4: Configurar .env

Crie `.env`:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=test_db
DB_USER=postgres
DB_PASSWORD=postgres
MIGRATIONS_DIR=migrations
```

## Passo 5: Usar CLI

```bash
# Criar migration
bun migrate create create_users_table

# Editar o arquivo SQL em migrations/

# Executar
bun migrate up

# Ver status
bun migrate status

# Reverter
bun migrate down

# Reset
bun migrate reset
```

## Passo 6: Uso Programático

Crie `test.ts`:

```typescript
import { createMigrationRunner, DatabasePool } from '@andreunix/sql-migrations';
import * as dotenv from 'dotenv';

dotenv.config();

async function main() {
  const pool = DatabasePool.create();
  const runner = createMigrationRunner(pool);
  
  console.log('Executando migrations...');
  await runner.up();
  
  console.log('Status:');
  const status = await runner.status();
  status.forEach(s => {
    console.log(`${s.executed ? '✅' : '⏳'} ${s.migration.fullName}`);
  });
  
  await pool.end();
}

main();
```

Execute:

```bash
bun test.ts
```

## Verificar no PostgreSQL

```sql
-- Ver tabela de controle
SELECT * FROM migrations;

-- Ver estrutura criada
\dt
\d users
```

## Deslinkar

Quando terminar os testes:

```bash
cd ../andreunix-db
bun unlink
```

## Dicas de Debug

1. Adicione `DEBUG=true` no `.env` para ver logs de conexão
2. Use `bun migrate status` para verificar estado
3. Use `bun migrate reset` para limpar tudo
4. Verifique logs de erro no console

## Exemplo Completo

```bash
# No projeto andreunix-db
bun run build
bun link

# Criar projeto teste
mkdir ../test-migrations && cd ../test-migrations
bun init -y
bun add pg dotenv
bun link @andreunix/sql-migrations

# Criar .env
echo "DB_HOST=localhost
DB_PORT=5432
DB_NAME=test_db
DB_USER=postgres
DB_PASSWORD=postgres" > .env

# Usar
bun migrate create create_users_table
# Editar migrations/YYYY_MM_DD_HHMMSS_create_users_table.sql
bun migrate up
bun migrate status
```
