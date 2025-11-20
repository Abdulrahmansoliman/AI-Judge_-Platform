import { Router, Request, Response } from 'express';
import { AssignmentRepository } from '../repositories';

const router = Router();

router.post('/question-judges', (req: Request, res: Response) => {
  try {
    const assignmentRepo = new AssignmentRepository();
    const { queueId, questionId, judgeIds } = req.body;

    if (!queueId || !questionId || !Array.isArray(judgeIds)) {
      return res.status(400).json({
        error: 'Invalid request body. Expected { queueId, questionId, judgeIds: number[] }',
      });
    }

    assignmentRepo.replaceAssignments(queueId, questionId, judgeIds);

    res.json({
      queueId,
      questionId,
      assignedJudgeIds: judgeIds,
    });
  } catch (error) {
    console.error('Assign judges error:', error);
    res.status(500).json({
      error: 'Failed to assign judges',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
