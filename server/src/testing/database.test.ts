import { dbService, toCamelCase, toSnakeCase } from '../services/database.service';
import { setupTestDatabase, teardownTestDatabase } from './setup';

describe('Database Service', () => {
  beforeAll(() => {
    setupTestDatabase();
  });

  afterAll(() => {
    teardownTestDatabase();
  });

  describe('Singleton Pattern', () => {
    it('should return same instance', () => {
      const instance1 = dbService;
      const instance2 = dbService;
      
      expect(instance1).toBe(instance2);
    });

    it('should maintain database connection', () => {
      const db1 = dbService.getDatabase();
      const db2 = dbService.getDatabase();
      
      expect(db1).toBe(db2);
    });
  });

  describe('Case Conversion', () => {
    it('should convert snake_case to camelCase', () => {
      const input = {
        submission_id: 'sub_1',
        question_id: 'q1',
        created_at: 123456,
        raw_json: '{}',
      };

      const result = toCamelCase(input);

      expect(result).toEqual({
        submissionId: 'sub_1',
        questionId: 'q1',
        createdAt: 123456,
        rawJson: '{}',
      });
    });

    it('should convert array of objects', () => {
      const input = [
        { submission_id: 'sub_1' },
        { submission_id: 'sub_2' },
      ];

      const result = toCamelCase(input);

      expect(result).toEqual([
        { submissionId: 'sub_1' },
        { submissionId: 'sub_2' },
      ]);
    });

    it('should convert camelCase to snake_case', () => {
      const input = {
        submissionId: 'sub_1',
        questionId: 'q1',
        createdAt: 123456,
        rawJson: '{}',
      };

      const result = toSnakeCase(input);

      expect(result).toEqual({
        submission_id: 'sub_1',
        question_id: 'q1',
        created_at: 123456,
        raw_json: '{}',
      });
    });

    it('should handle nested objects', () => {
      const input = {
        user_name: 'test',
        nested_object: {
          inner_field: 'value',
        },
      };

      const result: any = toCamelCase(input);

      expect(result.userName).toBe('test');
      expect(result.nestedObject).toBeDefined();
    });
  });

  describe('Transaction Support', () => {
    it('should execute transaction successfully', () => {
      const db = dbService.getDatabase();
      db.exec('DELETE FROM submissions');

      const result = dbService.transaction((db) => {
        db.prepare(`
          INSERT INTO submissions (id, queue_id, labeling_task_id, created_at)
          VALUES (?, ?, ?, ?)
        `).run('sub_1', 'queue_1', 'task_1', Date.now());
        
        return db.prepare('SELECT COUNT(*) as count FROM submissions').get() as { count: number };
      });

      expect(result.count).toBe(1);
    });

    it('should rollback on error', () => {
      const db = dbService.getDatabase();
      db.exec('DELETE FROM submissions');

      expect(() => {
        dbService.transaction((db) => {
          db.prepare(`
            INSERT INTO submissions (id, queue_id, labeling_task_id, created_at)
            VALUES (?, ?, ?, ?)
          `).run('sub_1', 'queue_1', 'task_1', Date.now());
          
          throw new Error('Test error');
        });
      }).toThrow('Test error');

      const count = db.prepare('SELECT COUNT(*) as count FROM submissions').get() as { count: number };
      expect(count.count).toBe(0);
    });
  });
});
