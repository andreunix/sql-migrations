import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import type { MigrationOptions, MigrationStatus, Migration, MigrationRecord } from './types';
import { MigrationParser } from './MigrationParser';

export class MigrationRunner {
  private pool: Pool;
  private migrationsDir: string;
  private tableName: string;

  constructor(pool: Pool, options: MigrationOptions = {}) {
    this.pool = pool;
    this.migrationsDir = options.migrationsDir || process.env.MIGRATIONS_DIR || 'migrations';
    this.tableName = options.tableName || process.env.MIGRATIONS_TABLE || 'migrations';
  }

  /**
   * Executa todas as migrations pendentes
   */
  async up(): Promise<void> {
    await this.ensureMigrationsTable();

    const pending = await this.getPendingMigrations();

    if (pending.length === 0) {
      console.log('✅ Nenhuma migration pendente');
      return;
    }

    console.log(`📦 Executando ${pending.length} migration(s)...`);

    const batch = await this.getNextBatch();

    for (const migration of pending) {
      await this.executeMigration(migration, batch, 'up');
    }

    console.log('✅ Migrations executadas com sucesso!');
  }

  /**
   * Reverte migrations
   * @param steps Número de migrations para reverter (padrão: 1)
   */
  async down(steps: number = 1): Promise<void> {
    await this.ensureMigrationsTable();

    const executed = await this.getExecutedMigrations();

    if (executed.length === 0) {
      console.log('✅ Nenhuma migration para reverter');
      return;
    }

    const toRevert = executed.slice(0, steps);

    console.log(`📦 Revertendo ${toRevert.length} migration(s)...`);

    for (const migration of toRevert) {
      await this.executeMigration(migration, 0, 'down');
    }

    console.log('✅ Migrations revertidas com sucesso!');
  }

  /**
   * Exibe o status de todas as migrations
   */
  async status(): Promise<MigrationStatus[]> {
    await this.ensureMigrationsTable();

    const allMigrations = this.getAllMigrations();
    const executedRecords = await this.getExecutedRecords();

    const executedMap = new Map(
      executedRecords.map(r => [r.migration, { executedAt: r.executed_at, batch: r.batch }])
    );

    return allMigrations.map(migration => ({
      migration,
      executed: executedMap.has(migration.fullName),
      executedAt: executedMap.get(migration.fullName)?.executedAt,
      batch: executedMap.get(migration.fullName)?.batch,
    }));
  }

  /**
   * Reverte todas as migrations
   */
  async reset(): Promise<void> {
    await this.ensureMigrationsTable();

    const executed = await this.getExecutedMigrations();

    if (executed.length === 0) {
      console.log('✅ Nenhuma migration para reverter');
      return;
    }

    console.log(`📦 Revertendo todas as ${executed.length} migration(s)...`);

    for (const migration of executed) {
      await this.executeMigration(migration, 0, 'down');
    }

    console.log('✅ Banco de dados resetado!');
  }

  /**
   * Reverte e re-executa migrations
   * @param steps Número de migrations para refresh (padrão: todas)
   */
  async refresh(steps?: number): Promise<void> {
    if (steps !== undefined) {
      await this.down(steps);
      await this.up();
    } else {
      await this.reset();
      await this.up();
    }
  }

  /**
   * Garante que a tabela de migrations existe
   */
  private async ensureMigrationsTable(): Promise<void> {
    const query = `
      CREATE TABLE IF NOT EXISTS ${this.tableName} (
        id SERIAL PRIMARY KEY,
        migration VARCHAR(255) NOT NULL UNIQUE,
        batch INTEGER NOT NULL,
        executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;

    await this.pool.query(query);
  }

  /**
   * Obtém todas as migrations do diretório
   */
  private getAllMigrations(): Migration[] {
    if (!fs.existsSync(this.migrationsDir)) {
      return [];
    }

    const files = fs.readdirSync(this.migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();

    return files.map(filename => {
      const match = filename.match(/^(\d{4}_\d{2}_\d{2}_\d{6})_(.+)\.sql$/);
      
      if (!match || !match[1] || !match[2]) {
        throw new Error(`Nome de arquivo inválido: ${filename}`);
      }

      return {
        timestamp: match[1],
        name: match[2],
        filename,
        fullName: `${match[1]}_${match[2]}`,
      };
    });
  }

  /**
   * Obtém migrations pendentes
   */
  private async getPendingMigrations(): Promise<Migration[]> {
    const all = this.getAllMigrations();
    const executedRecords = await this.getExecutedRecords();
    const executedSet = new Set(executedRecords.map(r => r.migration));

    return all.filter(m => !executedSet.has(m.fullName));
  }

  /**
   * Obtém migrations executadas (ordem reversa)
   */
  private async getExecutedMigrations(): Promise<Migration[]> {
    const all = this.getAllMigrations();
    const executedRecords = await this.getExecutedRecords();
    const executedSet = new Set(executedRecords.map(r => r.migration));

    return all.filter(m => executedSet.has(m.fullName)).reverse();
  }

  /**
   * Obtém registros de migrations executadas
   */
  private async getExecutedRecords(): Promise<MigrationRecord[]> {
    const result = await this.pool.query<MigrationRecord>(
      `SELECT * FROM ${this.tableName} ORDER BY id ASC`
    );

    return result.rows;
  }

  /**
   * Obtém o próximo número de batch
   */
  private async getNextBatch(): Promise<number> {
    const result = await this.pool.query<{ max: number }>(
      `SELECT MAX(batch) as max FROM ${this.tableName}`
    );

    const maxBatch = result.rows[0]?.max || 0;
    return maxBatch + 1;
  }

  /**
   * Executa uma migration (UP ou DOWN)
   */
  private async executeMigration(
    migration: Migration,
    batch: number,
    direction: 'up' | 'down'
  ): Promise<void> {
    const filePath = path.join(this.migrationsDir, migration.filename);
    
    console.log(`${direction === 'up' ? '⬆️' : '⬇️'} ${direction.toUpperCase()}: ${migration.fullName}`);

    // Parsear migration
    const parsed = MigrationParser.parse(filePath);
    const sql = direction === 'up' ? parsed.up : parsed.down;

    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');

      // Executar SQL
      await client.query(sql);

      // Atualizar tabela de controle
      if (direction === 'up') {
        await client.query(
          `INSERT INTO ${this.tableName} (migration, batch) VALUES ($1, $2)`,
          [migration.fullName, batch]
        );
      } else {
        await client.query(
          `DELETE FROM ${this.tableName} WHERE migration = $1`,
          [migration.fullName]
        );
      }

      await client.query('COMMIT');
      console.log(`   ✅ Sucesso`);
    } catch (error) {
      await client.query('ROLLBACK');
      console.error(`   ❌ Erro: ${error}`);
      throw error;
    } finally {
      client.release();
    }
  }
}
