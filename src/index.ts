export { MigrationRunner } from './MigrationRunner';
export { MigrationCreator } from './MigrationCreator';
export { MigrationParser } from './MigrationParser';
export { DatabasePool } from './DatabasePool';

export * from './types';

import { Pool } from 'pg';
import type { PoolConfig as PgPoolConfig } from 'pg';
import { MigrationRunner } from './MigrationRunner';
import type { MigrationOptions, PoolConfig } from './types';

/**
 * Função helper para criar um MigrationRunner
 * @param poolOrConfig Pool existente ou configuração para criar um novo
 * @param options Opções do MigrationRunner
 */
export function createMigrationRunner(
  poolOrConfig: Pool | PoolConfig,
  options?: MigrationOptions
): MigrationRunner {
  let pool: Pool;

  if (poolOrConfig instanceof Pool) {
    pool = poolOrConfig;
  } else {
    const { Pool: PgPool } = require('pg');
    pool = new PgPool(poolOrConfig);
  }

  return new MigrationRunner(pool, options);
}
