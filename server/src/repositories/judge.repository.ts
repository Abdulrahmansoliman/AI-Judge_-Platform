import Database from 'better-sqlite3';
import { DatabaseService, toCamelCase, toSnakeCase } from '../services/database.service';
import { JudgeRow, Judge, CreateJudgeInput, UpdateJudgeInput } from '../models/judge.model';

export class JudgeRepository {
  private db: Database.Database;

  constructor() {
    this.db = DatabaseService.getInstance().getDatabase();
  }

  findById(id: number): Judge | null {
    const stmt = this.db.prepare('SELECT * FROM judges WHERE id = ?');
    const row = stmt.get(id) as JudgeRow | undefined;
    return row ? toCamelCase(row) : null;
  }

  findAll(): Judge[] {
    const stmt = this.db.prepare('SELECT * FROM judges ORDER BY created_at DESC');
    const rows = stmt.all() as JudgeRow[];
    return rows.map(row => toCamelCase(row));
  }

  findActive(): Judge[] {
    const stmt = this.db.prepare('SELECT * FROM judges WHERE active = 1 ORDER BY created_at DESC');
    const rows = stmt.all() as JudgeRow[];
    return rows.map(row => toCamelCase(row));
  }

  findByName(name: string): Judge | null {
    const stmt = this.db.prepare('SELECT * FROM judges WHERE name = ?');
    const row = stmt.get(name) as JudgeRow | undefined;
    return row ? toCamelCase(row) : null;
  }

  create(input: CreateJudgeInput): Judge {
    const now = Date.now();
    const judge: Omit<Judge, 'id'> = {
      ...input,
      active: input.active ?? true,
      createdAt: now,
      updatedAt: now,
    };

    const stmt = this.db.prepare(`
      INSERT INTO judges (name, system_prompt, model, active, created_at, updated_at)
      VALUES (@name, @systemPrompt, @model, @active, @createdAt, @updatedAt)
    `);
    const data = toSnakeCase(judge);
    const result = stmt.run(data);
    return { ...judge, id: Number(result.lastInsertRowid) };
  }

  update(id: number, input: UpdateJudgeInput): Judge | null {
    const existing = this.findById(id);
    if (!existing) return null;

    const updated: Judge = {
      ...existing,
      ...input,
      updatedAt: Date.now(),
    };

    const stmt = this.db.prepare(`
      UPDATE judges
      SET name = @name,
          system_prompt = @systemPrompt,
          model = @model,
          active = @active,
          updated_at = @updatedAt
      WHERE id = @id
    `);
    const data = toSnakeCase(updated);
    stmt.run(data);
    return updated;
  }

  delete(id: number): boolean {
    const stmt = this.db.prepare('DELETE FROM judges WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  setActive(id: number, active: boolean): boolean {
    const stmt = this.db.prepare('UPDATE judges SET active = ?, updated_at = ? WHERE id = ?');
    const result = stmt.run(active ? 1 : 0, Date.now(), id);
    return result.changes > 0;
  }
}
