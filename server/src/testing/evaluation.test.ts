import { setupTestDatabase, teardownTestDatabase, getTestDb } from './setup';
import { EvaluationRow, Verdict } from '../models/evaluation.model';

describe('Evaluation Model', () => {
  beforeAll(() => {
    setupTestDatabase();
  });

  afterAll(() => {
    teardownTestDatabase();
  });

  let testJudgeId: number;

  beforeEach(() => {
    const db = getTestDb();
    db.exec('DELETE FROM evaluations');
    db.exec('DELETE FROM judges');
    db.exec('DELETE FROM submissions');
    
    const now = Date.now();
    db.prepare(`
      INSERT INTO submissions (id, queue_id, labeling_task_id, created_at)
      VALUES (?, ?, ?, ?)
    `).run('sub_1', 'queue_1', 'task_1', now);
    
    const result = db.prepare(`
      INSERT INTO judges (name, system_prompt, model, active, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run('Judge 1', 'prompt', 'gpt-4o-mini', 1, now, now);
    
    testJudgeId = Number(result.lastInsertRowid);
  });

  describe('Database Operations', () => {
    it('should insert an evaluation', () => {
      const db = getTestDb();
      const evaluation = {
        submission_id: 'sub_1',
        question_id: 'q1',
        judge_id: testJudgeId,
        verdict: 'pass',
        reasoning: 'Answer is correct',
        raw_response: JSON.stringify({ verdict: 'pass', reasoning: 'Answer is correct' }),
        created_at: Date.now(),
      };

      const stmt = db.prepare(`
        INSERT INTO evaluations (submission_id, question_id, judge_id, verdict, reasoning, raw_response, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      
      const result = stmt.run(
        evaluation.submission_id,
        evaluation.question_id,
        evaluation.judge_id,
        evaluation.verdict,
        evaluation.reasoning,
        evaluation.raw_response,
        evaluation.created_at
      );

      expect(result.changes).toBe(1);
    });

    it('should enforce verdict check constraint', () => {
      const db = getTestDb();
      
      expect(() => {
        db.prepare(`
          INSERT INTO evaluations (submission_id, question_id, judge_id, verdict, reasoning, raw_response, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run('sub_1', 'q1', 1, 'invalid', 'test', '{}', Date.now());
      }).toThrow();
    });

    it('should accept valid verdicts', () => {
      const db = getTestDb();
      const now = Date.now();
      const verdicts: Verdict[] = ['pass', 'fail', 'inconclusive'];
      
      verdicts.forEach((verdict, i) => {
        const result = db.prepare(`
          INSERT INTO evaluations (submission_id, question_id, judge_id, verdict, reasoning, raw_response, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run('sub_1', `q${i + 1}`, testJudgeId, verdict, 'test', '{}', now);
        
        expect(result.changes).toBe(1);
      });

      const rows = db.prepare('SELECT * FROM evaluations').all() as EvaluationRow[];
      expect(rows).toHaveLength(3);
    });

    it('should enforce unique constraint for submission/question/judge', () => {
      const db = getTestDb();
      const now = Date.now();
      
      db.prepare(`
        INSERT INTO evaluations (submission_id, question_id, judge_id, verdict, reasoning, raw_response, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run('sub_1', 'q1', testJudgeId, 'pass', 'test', '{}', now);

      expect(() => {
        db.prepare(`
          INSERT INTO evaluations (submission_id, question_id, judge_id, verdict, reasoning, raw_response, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run('sub_1', 'q1', testJudgeId, 'fail', 'different', '{}', now);
      }).toThrow();
    });

    it('should filter by verdict', () => {
      const db = getTestDb();
      const now = Date.now();
      
      db.prepare(`
        INSERT INTO evaluations (submission_id, question_id, judge_id, verdict, reasoning, raw_response, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run('sub_1', 'q1', testJudgeId, 'pass', 'test', '{}', now);
      
      db.prepare(`
        INSERT INTO evaluations (submission_id, question_id, judge_id, verdict, reasoning, raw_response, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run('sub_1', 'q2', testJudgeId, 'fail', 'test', '{}', now);

      const passRows = db.prepare('SELECT * FROM evaluations WHERE verdict = ?').all('pass') as EvaluationRow[];
      const failRows = db.prepare('SELECT * FROM evaluations WHERE verdict = ?').all('fail') as EvaluationRow[];

      expect(passRows).toHaveLength(1);
      expect(failRows).toHaveLength(1);
    });

    it('should cascade delete with submission', () => {
      const db = getTestDb();
      const now = Date.now();
      
      db.prepare(`
        INSERT INTO evaluations (submission_id, question_id, judge_id, verdict, reasoning, raw_response, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run('sub_1', 'q1', testJudgeId, 'pass', 'test', '{}', now);

      db.prepare('DELETE FROM submissions WHERE id = ?').run('sub_1');

      const rows = db.prepare('SELECT * FROM evaluations').all() as EvaluationRow[];
      expect(rows).toHaveLength(0);
    });

    it('should cascade delete with judge', () => {
      const db = getTestDb();
      const now = Date.now();
      
      db.prepare(`
        INSERT INTO evaluations (submission_id, question_id, judge_id, verdict, reasoning, raw_response, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run('sub_1', 'q1', testJudgeId, 'pass', 'test', '{}', now);

      db.prepare('DELETE FROM judges WHERE id = ?').run(testJudgeId);

      const rows = db.prepare('SELECT * FROM evaluations').all() as EvaluationRow[];
      expect(rows).toHaveLength(0);
    });

    it('should filter by judge_id and verdict composite index', () => {
      const db = getTestDb();
      const now = Date.now();
      
      db.prepare(`
        INSERT INTO evaluations (submission_id, question_id, judge_id, verdict, reasoning, raw_response, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run('sub_1', 'q1', testJudgeId, 'pass', 'test', '{}', now);
      
      db.prepare(`
        INSERT INTO evaluations (submission_id, question_id, judge_id, verdict, reasoning, raw_response, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run('sub_1', 'q2', testJudgeId, 'fail', 'test', '{}', now);

      const rows = db.prepare(
        'SELECT * FROM evaluations WHERE judge_id = ? AND verdict = ?'
      ).all(testJudgeId, 'pass') as EvaluationRow[];

      expect(rows).toHaveLength(1);
      expect(rows[0].verdict).toBe('pass');
    });
  });
});
