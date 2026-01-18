import { Pool } from 'pg';
import type { PoolConfig as PgPoolConfig } from 'pg';
import type { PoolConfig } from './types';

export class DatabasePool {
  /**
   * Cria um pool de conexões PostgreSQL
   * @param config Configuração do pool. Se não fornecida, usa variáveis de ambiente
   */
  static create(config?: PoolConfig): Pool {
    const poolConfig: PgPoolConfig = config || {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || process.env.DB_DATABASE,
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD,
      max: parseInt(process.env.DB_POOL_MAX || '10'),
    };

    const pool = new Pool(poolConfig);

    // Event listeners para debug
    pool.on('error', (err) => {
      console.error('Erro inesperado no pool de conexões:', err);
    });

    pool.on('connect', () => {
      if (process.env.DEBUG === 'true') {
        console.log('Nova conexão estabelecida com o banco de dados');
      }
    });

    return pool;
  }

  /**
   * Testa a conexão com o banco de dados
   */
  static async test(pool: Pool): Promise<boolean> {
    try {
      const client = await pool.connect();
      await client.query('SELECT NOW()');
      client.release();
      return true;
    } catch (error) {
      console.error('Erro ao testar conexão:', error);
      return false;
    }
  }

  /**
   * Fecha todas as conexões do pool
   */
  static async close(pool: Pool): Promise<void> {
    await pool.end();
  }
}
