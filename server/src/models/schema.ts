export const DATABASE_SCHEMA = `
CREATE TABLE IF NOT EXISTS submissions (
  id TEXT PRIMARY KEY,
  queue_id TEXT NOT NULL,
  labeling_task_id TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_submissions_queue_id 
  ON submissions(queue_id);

CREATE INDEX IF NOT EXISTS idx_submissions_created_at 
  ON submissions(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_submissions_queue_created 
  ON submissions(queue_id, created_at DESC);

CREATE TABLE IF NOT EXISTS questions (
  id TEXT NOT NULL,
  queue_id TEXT NOT NULL,
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL,
  rev INTEGER,
  created_at INTEGER NOT NULL,
  PRIMARY KEY (id, queue_id)
);

CREATE INDEX IF NOT EXISTS idx_questions_queue_id 
  ON questions(queue_id);

CREATE INDEX IF NOT EXISTS idx_questions_type 
  ON questions(question_type);

CREATE TABLE IF NOT EXISTS answers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  submission_id TEXT NOT NULL,
  question_id TEXT NOT NULL,
  choice TEXT,
  reasoning TEXT,
  raw_json TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (submission_id) REFERENCES submissions(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_answers_submission_id 
  ON answers(submission_id);

CREATE INDEX IF NOT EXISTS idx_answers_question_id 
  ON answers(question_id);

CREATE INDEX IF NOT EXISTS idx_answers_submission_question 
  ON answers(submission_id, question_id);

CREATE TABLE IF NOT EXISTS judges (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  system_prompt TEXT NOT NULL,
  model TEXT NOT NULL,
  active INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  CHECK (active IN (0, 1))
);

CREATE INDEX IF NOT EXISTS idx_judges_active 
  ON judges(active);

CREATE INDEX IF NOT EXISTS idx_judges_name 
  ON judges(name);

CREATE TABLE IF NOT EXISTS question_judges (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  queue_id TEXT NOT NULL,
  question_id TEXT NOT NULL,
  judge_id INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (judge_id) REFERENCES judges(id) ON DELETE CASCADE,
  UNIQUE(queue_id, question_id, judge_id)
);

CREATE INDEX IF NOT EXISTS idx_question_judges_queue 
  ON question_judges(queue_id);

CREATE INDEX IF NOT EXISTS idx_question_judges_question 
  ON question_judges(question_id);

CREATE INDEX IF NOT EXISTS idx_question_judges_judge 
  ON question_judges(judge_id);

CREATE INDEX IF NOT EXISTS idx_question_judges_queue_question 
  ON question_judges(queue_id, question_id);

CREATE TABLE IF NOT EXISTS evaluations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  submission_id TEXT NOT NULL,
  question_id TEXT NOT NULL,
  judge_id INTEGER NOT NULL,
  verdict TEXT NOT NULL CHECK (verdict IN ('pass', 'fail', 'inconclusive')),
  reasoning TEXT NOT NULL,
  raw_response TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (submission_id) REFERENCES submissions(id) ON DELETE CASCADE,
  FOREIGN KEY (judge_id) REFERENCES judges(id) ON DELETE CASCADE,
  UNIQUE(submission_id, question_id, judge_id)
);

CREATE INDEX IF NOT EXISTS idx_evaluations_submission 
  ON evaluations(submission_id);

CREATE INDEX IF NOT EXISTS idx_evaluations_question 
  ON evaluations(question_id);

CREATE INDEX IF NOT EXISTS idx_evaluations_judge 
  ON evaluations(judge_id);

CREATE INDEX IF NOT EXISTS idx_evaluations_verdict 
  ON evaluations(verdict);

CREATE INDEX IF NOT EXISTS idx_evaluations_created_at 
  ON evaluations(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_evaluations_judge_verdict 
  ON evaluations(judge_id, verdict);

CREATE INDEX IF NOT EXISTS idx_evaluations_question_verdict 
  ON evaluations(question_id, verdict);

CREATE INDEX IF NOT EXISTS idx_evaluations_submission_question 
  ON evaluations(submission_id, question_id);
`;

