import * as fs from 'fs';
import * as path from 'path';
import type { MigrationFile } from './types';

export class MigrationCreator {
  private migrationsDir: string;
  private templatePath: string;

  constructor(migrationsDir: string = 'migrations') {
    this.migrationsDir = migrationsDir;
    this.templatePath = path.join(__dirname, '..', 'templates', 'migration.sql.template');
  }

  /**
   * Cria uma nova migration
   * @param name Nome da migration (será convertido para snake_case)
   * @returns Nome do arquivo criado
   */
  create(name: string): string {
    // Sanitizar nome
    const sanitizedName = this.sanitizeName(name);

    // Gerar timestamp estilo Laravel
    const timestamp = this.generateTimestamp();

    // Nome completo do arquivo
    const filename = `${timestamp}_${sanitizedName}.sql`;
    const filePath = path.join(this.migrationsDir, filename);

    // Verificar se diretório existe
    if (!fs.existsSync(this.migrationsDir)) {
      fs.mkdirSync(this.migrationsDir, { recursive: true });
    }

    // Verificar se arquivo já existe
    if (fs.existsSync(filePath)) {
      throw new Error(`Migration já existe: ${filename}`);
    }

    // Ler template
    let template: string;
    if (fs.existsSync(this.templatePath)) {
      template = fs.readFileSync(this.templatePath, 'utf-8');
    } else {
      template = this.getDefaultTemplate();
    }

    // Substituir placeholders
    const content = template
      .replace(/{{name}}/g, sanitizedName)
      .replace(/{{date}}/g, this.formatDate(new Date()));

    // Criar arquivo
    fs.writeFileSync(filePath, content);

    console.log(`✅ Migration criada: ${filename}`);

    return filename;
  }

  /**
   * Lista todas as migrations no diretório
   */
  list(): MigrationFile[] {
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
        filePath: path.join(this.migrationsDir, filename),
      };
    });
  }

  /**
   * Gera timestamp estilo Laravel: YYYY_MM_DD_HHMMSS
   */
  private generateTimestamp(): string {
    const now = new Date();
    
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');

    return `${year}_${month}_${day}_${hours}${minutes}${seconds}`;
  }

  /**
   * Formata data para exibição
   */
  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  /**
   * Sanitiza nome da migration para snake_case
   */
  private sanitizeName(name: string): string {
    return name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');
  }

  /**
   * Retorna template padrão se arquivo não existir
   */
  private getDefaultTemplate(): string {
    return `-- ============================================
-- Migration: {{name}}
-- Created: {{date}}
-- ============================================

-- ============================================
-- UP
-- ============================================

-- Escreva aqui o SQL para aplicar a migration


-- ============================================
-- DOWN
-- ============================================

-- Escreva aqui o SQL para reverter a migration

`;
  }
}
