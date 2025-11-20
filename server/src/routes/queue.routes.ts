import { Router, Request, Response } from 'express';
import { QueueService } from '../services/queue.service';
import { AssignmentRepository } from '../repositories';
import { EvaluationService } from '../services/evaluation.service';

const router = Router();

router.get('/queues', (_req: Request, res: Response) => {
  try {
    const queueService = new QueueService();
    const queues = queueService.getQueues();
    res.json(queues);
  } catch (error) {
    console.error('Get queues error:', error);
    res.status(500).json({
      error: 'Failed to fetch queues',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

router.get('/queues/:queueId/questions', (req: Request, res: Response) => {
  try {
    const queueService = new QueueService();
    const assignmentRepo = new AssignmentRepository();
    const { queueId } = req.params;
    const result = queueService.getQueueQuestions(queueId, assignmentRepo);
    res.json(result);
  } catch (error) {
    console.error('Get queue questions error:', error);
    res.status(500).json({
      error: 'Failed to fetch queue questions',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

router.post('/queues/:queueId/run-evaluations', async (req: Request, res: Response) => {
  try {
    const evaluationService = new EvaluationService();
    const { queueId } = req.params;
    const { rerunExisting } = req.body;

    const result = await evaluationService.runEvaluations(queueId, {
      rerunExisting: rerunExisting || false,
    });

    res.json(result);
  } catch (error) {
    console.error('Run evaluations error:', error);
    res.status(500).json({
      error: 'Failed to run evaluations',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
