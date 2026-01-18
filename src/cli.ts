#!/usr/bin/env node

import { MigrationRunner } from './MigrationRunner';
import { MigrationCreator } from './MigrationCreator';
import { DatabasePool } from './DatabasePool';
import * as dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

const commands = {
  create: 'Criar uma nova migration',
  up: 'Executar todas as migrations pendentes',
  migrate: 'Alias para "up"',
  down: 'Reverter migrations (padrão: 1)',
  status: 'Exibir status das migrations',
  reset: 'Reverter todas as migrations',
  refresh: 'Reverter e re-executar migrations',
  list: 'Listar todas as migrations',
  help: 'Exibir ajuda',
};

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command || command === 'help' || command === '--help' || command === '-h') {
    showHelp();
    return;
  }

  try {
    switch (command) {
      case 'create':
        await handleCreate(args.slice(1));
        break;

      case 'up':
      case 'migrate':
        await handleUp();
        break;

      case 'down':
        await handleDown(args.slice(1));
        break;

      case 'status':
        await handleStatus();
        break;

      case 'reset':
        await handleReset();
        break;

      case 'refresh':
        await handleRefresh(args.slice(1));
        break;

      case 'list':
        await handleList();
        break;

      default:
        console.error(`❌ Comando desconhecido: ${command}`);
        console.log('Execute "sql-migrate help" para ver os comandos disponíveis\n');
        process.exit(1);
    }
  } catch (error) {
    console.error('❌ Erro:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

function showHelp() {
  console.log(`
📦 SQL Migrations - Sistema de migrations SQL para PostgreSQL

USO:
  sql-migrate <comando> [opções]

COMANDOS:
${Object.entries(commands)
  .map(([cmd, desc]) => `  ${cmd.padEnd(15)} ${desc}`)
  .join('\n')}

EXEMPLOS:
  sql-migrate create create_users_table
  sql-migrate up
  sql-migrate down 3
  sql-migrate status
  sql-migrate reset
  sql-migrate refresh

CONFIGURAÇÃO (.env):
  DB_HOST=localhost
  DB_PORT=5432
  DB_NAME=mydb
  DB_USER=postgres
  DB_PASSWORD=postgres
  MIGRATIONS_DIR=migrations
  MIGRATIONS_TABLE=migrations
`);
}

async function handleCreate(args: string[]) {
  const name = args[0];

  if (!name) {
    console.error('❌ Nome da migration não fornecido');
    console.log('Uso: sql-migrate create <nome_da_migration>');
    process.exit(1);
  }

  const migrationsDir = process.env.MIGRATIONS_DIR || 'migrations';
  const creator = new MigrationCreator(migrationsDir);
  
  creator.create(name);
}

async function handleUp() {
  const pool = DatabasePool.create();
  
  try {
    const runner = new MigrationRunner(pool);
    await runner.up();
  } finally {
    await pool.end();
  }
}

async function handleDown(args: string[]) {
  const steps = args[0] ? parseInt(args[0]) : 1;

  if (isNaN(steps) || steps < 1) {
    console.error('❌ Número de steps inválido');
    process.exit(1);
  }

  const pool = DatabasePool.create();
  
  try {
    const runner = new MigrationRunner(pool);
    await runner.down(steps);
  } finally {
    await pool.end();
  }
}

async function handleStatus() {
  const pool = DatabasePool.create();
  
  try {
    const runner = new MigrationRunner(pool);
    const status = await runner.status();

    if (status.length === 0) {
      console.log('📦 Nenhuma migration encontrada');
      return;
    }

    console.log('\n📊 Status das Migrations:\n');
    console.log('Status | Batch | Migration');
    console.log('-------|-------|----------');

    for (const item of status) {
      const statusIcon = item.executed ? '✅' : '⏳';
      const batch = item.batch ? `#${item.batch}` : '-';
      console.log(`${statusIcon}     | ${batch.padEnd(5)} | ${item.migration.fullName}`);
    }

    console.log();

    const pending = status.filter(s => !s.executed).length;
    const executed = status.filter(s => s.executed).length;

    console.log(`Total: ${status.length} | Executadas: ${executed} | Pendentes: ${pending}\n`);
  } finally {
    await pool.end();
  }
}

async function handleReset() {
  const pool = DatabasePool.create();
  
  try {
    const runner = new MigrationRunner(pool);
    await runner.reset();
  } finally {
    await pool.end();
  }
}

async function handleRefresh(args: string[]) {
  const steps = args[0] ? parseInt(args[0]) : undefined;

  if (steps !== undefined && (isNaN(steps) || steps < 1)) {
    console.error('❌ Número de steps inválido');
    process.exit(1);
  }

  const pool = DatabasePool.create();
  
  try {
    const runner = new MigrationRunner(pool);
    await runner.refresh(steps);
  } finally {
    await pool.end();
  }
}

async function handleList() {
  const migrationsDir = process.env.MIGRATIONS_DIR || 'migrations';
  const creator = new MigrationCreator(migrationsDir);
  
  const migrations = creator.list();

  if (migrations.length === 0) {
    console.log('📦 Nenhuma migration encontrada');
    return;
  }

  console.log(`\n📋 Migrations (${migrations.length}):\n`);

  for (const migration of migrations) {
    console.log(`  • ${migration.fullName}`);
  }

  console.log();
}

main();
