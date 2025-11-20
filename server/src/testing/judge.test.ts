import { setupTestDatabase, teardownTestDatabase, getTestDb } from './setup';
import { JudgeRow } from '../models/judge.model';

describe('Judge Model', () => {
  beforeAll(() => {
    setupTestDatabase();
  });

  afterAll(() => {
    teardownTestDatabase();
  });

  beforeEach(() => {
    const db = getTestDb();
    db.exec('DELETE FROM judges');
  });

  describe('Database Operations', () => {
    it('should insert a judge', () => {
      const db = getTestDb();
      const now = Date.now();
      const judge = {
        name: 'Accuracy Judge',
        system_prompt: 'Check for accuracy',
        model: 'gpt-4o-mini',
        active: 1,
        created_at: now,
        updated_at: now,
      };

      const stmt = db.prepare(`
        INSERT INTO judges (name, system_prompt, model, active, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      
      const result = stmt.run(
        judge.name,
        judge.system_prompt,
        judge.model,
        judge.active,
        judge.created_at,
        judge.updated_at
      );

      expect(result.changes).toBe(1);
    });

    it('should auto-increment id', () => {
      const db = getTestDb();
      const now = Date.now();
      
      const stmt = db.prepare(`
        INSERT INTO judges (name, system_prompt, model, active, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      
      const result1 = stmt.run('Judge 1', 'prompt', 'gpt-4o-mini', 1, now, now);
      const result2 = stmt.run('Judge 2', 'prompt', 'gpt-4o-mini', 1, now, now);

      expect(result2.lastInsertRowid).toBe(Number(result1.lastInsertRowid) + 1);
    });

    it('should enforce unique name constraint', () => {
      const db = getTestDb();
      const now = Date.now();
      
      db.prepare(`
        INSERT INTO judges (name, system_prompt, model, active, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run('Judge 1', 'prompt', 'gpt-4o-mini', 1, now, now);

      expect(() => {
        db.prepare(`
          INSERT INTO judges (name, system_prompt, model, active, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?)
        `).run('Judge 1', 'different prompt', 'gpt-4', 1, now, now);
      }).toThrow();
    });

    it('should filter by active status', () => {
      const db = getTestDb();
      const now = Date.now();
      
      db.prepare(`
        INSERT INTO judges (name, system_prompt, model, active, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run('Active Judge', 'prompt', 'gpt-4o-mini', 1, now, now);
      
      db.prepare(`
        INSERT INTO judges (name, system_prompt, model, active, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run('Inactive Judge', 'prompt', 'gpt-4o-mini', 0, now, now);

      const activeJudges = db.prepare('SELECT * FROM judges WHERE active = 1').all() as JudgeRow[];
      const inactiveJudges = db.prepare('SELECT * FROM judges WHERE active = 0').all() as JudgeRow[];

      expect(activeJudges).toHaveLength(1);
      expect(inactiveJudges).toHaveLength(1);
      expect(activeJudges[0].name).toBe('Active Judge');
    });

    it('should update a judge', () => {
      const db = getTestDb();
      const now = Date.now();
      
      const result = db.prepare(`
        INSERT INTO judges (name, system_prompt, model, active, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run('Judge 1', 'old prompt', 'gpt-4o-mini', 1, now, now);

      const judgeId = result.lastInsertRowid;
      const newNow = Date.now() + 1000;

      db.prepare(`
        UPDATE judges SET system_prompt = ?, updated_at = ? WHERE id = ?
      `).run('new prompt', newNow, judgeId);

      const judge = db.prepare('SELECT * FROM judges WHERE id = ?').get(judgeId) as JudgeRow;
      
      expect(judge.system_prompt).toBe('new prompt');
      expect(judge.updated_at).toBe(newNow);
    });

    it('should enforce active check constraint', () => {
      const db = getTestDb();
      const now = Date.now();
      
      expect(() => {
        db.prepare(`
          INSERT INTO judges (name, system_prompt, model, active, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?)
        `).run('Judge', 'prompt', 'gpt-4o-mini', 2, now, now);
      }).toThrow();
    });
  });
});
