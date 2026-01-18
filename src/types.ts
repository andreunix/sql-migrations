import type { PoolConfig as PgPoolConfig } from 'pg';

export interface MigrationOptions {
  migrationsDir?: string;
  tableName?: string;
}

export interface Migration {
  timestamp: string;
  name: string;
  filename: string;
  fullName: string;
}

export interface MigrationStatus {
  migration: Migration;
  executed: boolean;
  executedAt?: Date;
  batch?: number;
}

export interface ParsedMigration {
  up: string;
  down: string;
}

export interface MigrationFile {
  timestamp: string;
  name: string;
  filename: string;
  fullName: string;
  filePath: string;
}

export interface MigrationMetadata {
  name: string;
  created: string;
}

export interface PoolConfig extends PgPoolConfig {
  host?: string;
  port?: number;
  database?: string;
  user?: string;
  password?: string;
  max?: number;
}

export interface MigrationRecord {
  id: number;
  migration: string;
  batch: number;
  executed_at: Date;
}
