import * as fs from 'fs';
import * as path from 'path';
import type { ParsedMigration, MigrationMetadata } from './types';

export class MigrationParser {
  /**
   * Parseia um arquivo de migration SQL
   * @param filePath Caminho completo para o arquivo SQL
   */
  static parse(filePath: string): ParsedMigration {
    if (!fs.existsSync(filePath)) {
      throw new Error(`Arquivo de migration não encontrado: ${filePath}`);
    }

    const content = fs.readFileSync(filePath, 'utf-8');

    // Validar formato
    if (!this.validate(content)) {
      throw new Error(`Formato inválido de migration: ${filePath}`);
    }

    // Separar seções UP e DOWN
    const upMatch = content.match(/--\s*={10,}\s*--\s*UP\s*--\s*={10,}\s*([\s\S]*?)(?=--\s*={10,}\s*--\s*DOWN|$)/i);
    const downMatch = content.match(/--\s*={10,}\s*--\s*DOWN\s*--\s*={10,}\s*([\s\S]*?)$/i);

    if (!upMatch || !upMatch[1] || !downMatch || !downMatch[1]) {
      throw new Error(`Migration deve conter seções UP e DOWN: ${filePath}`);
    }

    const up = upMatch[1].trim();
    const down = downMatch[1].trim();

    if (!up) {
      throw new Error(`Seção UP vazia em: ${filePath}`);
    }

    if (!down) {
      throw new Error(`Seção DOWN vazia em: ${filePath}`);
    }

    return { up, down };
  }

  /**
   * Valida se o conteúdo tem o formato correto
   */
  static validate(content: string): boolean {
    // Deve conter seção UP
    const hasUp = /--\s*={10,}\s*--\s*UP\s*--\s*={10,}/i.test(content);
    
    // Deve conter seção DOWN
    const hasDown = /--\s*={10,}\s*--\s*DOWN\s*--\s*={10,}/i.test(content);

    return hasUp && hasDown;
  }

  /**
   * Valida um arquivo de migration
   */
  static validateFile(filePath: string): boolean {
    try {
      if (!fs.existsSync(filePath)) {
        return false;
      }

      const content = fs.readFileSync(filePath, 'utf-8');
      return this.validate(content);
    } catch {
      return false;
    }
  }

  /**
   * Extrai metadados do cabeçalho da migration
   */
  static extractMetadata(filePath: string): MigrationMetadata | null {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      
      const nameMatch = content.match(/--\s*Migration:\s*(.+)/i);
      const createdMatch = content.match(/--\s*Created:\s*(.+)/i);

      if (nameMatch && nameMatch[1] && createdMatch && createdMatch[1]) {
        return {
          name: nameMatch[1].trim(),
          created: createdMatch[1].trim(),
        };
      }

      return null;
    } catch {
      return null;
    }
  }
}
