import { setupTestDatabase, teardownTestDatabase, getTestDb } from './setup';
import { QuestionRow } from '../models/question.model';

describe('Question Model', () => {
  beforeAll(() => {
    setupTestDatabase();
  });

  afterAll(() => {
    teardownTestDatabase();
  });

  beforeEach(() => {
    const db = getTestDb();
    db.exec('DELETE FROM questions');
  });

  describe('Database Operations', () => {
    it('should insert a question', () => {
      const db = getTestDb();
      const question: QuestionRow = {
        id: 'q1',
        queue_id: 'queue_1',
        question_text: 'Is the sky blue?',
        question_type: 'single_choice',
        rev: 1,
        created_at: Date.now(),
      };

      const stmt = db.prepare(`
        INSERT INTO questions (id, queue_id, question_text, question_type, rev, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      
      const result = stmt.run(
        question.id,
        question.queue_id,
        question.question_text,
        question.question_type,
        question.rev,
        question.created_at
      );

      expect(result.changes).toBe(1);
    });

    it('should retrieve questions by queue_id', () => {
      const db = getTestDb();
      const now = Date.now();
      
      db.prepare(`
        INSERT INTO questions (id, queue_id, question_text, question_type, rev, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run('q1', 'queue_1', 'Question 1', 'single_choice', 1, now);
      
      db.prepare(`
        INSERT INTO questions (id, queue_id, question_text, question_type, rev, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run('q2', 'queue_1', 'Question 2', 'multiple_choice', 1, now);

      const rows = db.prepare('SELECT * FROM questions WHERE queue_id = ?').all('queue_1') as QuestionRow[];

      expect(rows).toHaveLength(2);
      expect(rows.every(r => r.queue_id === 'queue_1')).toBe(true);
    });

    it('should enforce composite primary key', () => {
      const db = getTestDb();
      const now = Date.now();
      
      db.prepare(`
        INSERT INTO questions (id, queue_id, question_text, question_type, rev, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run('q1', 'queue_1', 'Question 1', 'single_choice', 1, now);

      expect(() => {
        db.prepare(`
          INSERT INTO questions (id, queue_id, question_text, question_type, rev, created_at)
          VALUES (?, ?, ?, ?, ?, ?)
        `).run('q1', 'queue_1', 'Question 1 Duplicate', 'single_choice', 1, now);
      }).toThrow();
    });

    it('should allow same question id in different queues', () => {
      const db = getTestDb();
      const now = Date.now();
      
      db.prepare(`
        INSERT INTO questions (id, queue_id, question_text, question_type, rev, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run('q1', 'queue_1', 'Question 1', 'single_choice', 1, now);
      
      db.prepare(`
        INSERT INTO questions (id, queue_id, question_text, question_type, rev, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run('q1', 'queue_2', 'Question 1', 'single_choice', 1, now);

      const rows = db.prepare('SELECT * FROM questions WHERE id = ?').all('q1') as QuestionRow[];

      expect(rows).toHaveLength(2);
    });

    it('should filter by question_type using index', () => {
      const db = getTestDb();
      const now = Date.now();
      
      db.prepare(`
        INSERT INTO questions (id, queue_id, question_text, question_type, rev, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run('q1', 'queue_1', 'Question 1', 'single_choice', 1, now);
      
      db.prepare(`
        INSERT INTO questions (id, queue_id, question_text, question_type, rev, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run('q2', 'queue_1', 'Question 2', 'free_form', 1, now);

      const rows = db.prepare('SELECT * FROM questions WHERE question_type = ?').all('single_choice') as QuestionRow[];

      expect(rows).toHaveLength(1);
      expect(rows[0].question_type).toBe('single_choice');
    });
  });
});
