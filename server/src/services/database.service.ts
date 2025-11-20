import Database from 'better-sqlite3';
import path from 'path';
import { DATABASE_SCHEMA } from '../models/schema';

class DatabaseService {
  private static instance: DatabaseService;
  private db: Database.Database | null = null;

  private constructor() {}

  static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  initialize(dbPath?: string): Database.Database {
    if (this.db) {
      return this.db;
    }

    const finalPath = dbPath || path.join(process.cwd(), 'data.db');
    
    this.db = new Database(finalPath, {
      verbose: process.env.NODE_ENV === 'development' ? console.log : undefined,
    });

    this.db.pragma('foreign_keys = ON');
    this.db.pragma('journal_mode = WAL');
    this.db.exec(DATABASE_SCHEMA);
    
    return this.db;
  }

  getDatabase(): Database.Database {
    if (!this.db) {
      throw new Error('Database not initialized. Call initialize() first.');
    }
    return this.db;
  }

  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }

  transaction<T>(fn: (db: Database.Database) => T): T {
    const database = this.getDatabase();
    const transaction = database.transaction(fn);
    return transaction(database);
  }
}

export const dbService = DatabaseService.getInstance();

export function toCamelCase<T>(obj: any): T {
  if (Array.isArray(obj)) {
    return obj.map(item => toCamelCase(item)) as any;
  }
  
  if (obj !== null && typeof obj === 'object') {
    return Object.keys(obj).reduce((acc, key) => {
      const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
      acc[camelKey] = obj[key];
      return acc;
    }, {} as any);
  }
  
  return obj;
}

export function toSnakeCase<T>(obj: any): T {
  if (Array.isArray(obj)) {
    return obj.map(item => toSnakeCase(item)) as any;
  }
  
  if (obj !== null && typeof obj === 'object') {
    return Object.keys(obj).reduce((acc, key) => {
      const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
      acc[snakeKey] = obj[key];
      return acc;
    }, {} as any);
  }
  
  return obj;
}

export { DatabaseService };
