import { Router, Request, Response } from 'express';
import { EvaluationRepository, JudgeRepository, QuestionRepository } from '../repositories';

const router = Router();

router.get('/evaluations', (req: Request, res: Response) => {
  try {
    const evaluationRepo = new EvaluationRepository();
    const judgeRepo = new JudgeRepository();
    const questionRepo = new QuestionRepository();
    const { judgeIds, questionIds, verdicts, submissionId } = req.query;

    const filters: any = {};

    if (submissionId && typeof submissionId === 'string') {
      filters.submissionId = submissionId;
    }

    if (judgeIds && typeof judgeIds === 'string') {
      filters.judgeIds = judgeIds.split(',').map(id => parseInt(id, 10)).filter(id => !isNaN(id));
    }

    if (questionIds && typeof questionIds === 'string') {
      filters.questionIds = questionIds.split(',');
    }

    if (verdicts && typeof verdicts === 'string') {
      filters.verdicts = verdicts.split(',');
    }

    const evaluations = Object.keys(filters).length > 0
      ? evaluationRepo.findByFilters(filters)
      : evaluationRepo.findAll();

    const enrichedEvaluations = evaluations.map(evaluation => {
      const judge = judgeRepo.findById(evaluation.judgeId);
      const question = questionRepo.findById(evaluation.questionId, '');
      
      return {
        id: evaluation.id,
        submissionId: evaluation.submissionId,
        questionId: evaluation.questionId,
        questionText: question?.questionText || '',
        judgeId: evaluation.judgeId,
        judgeName: judge?.name || '',
        verdict: evaluation.verdict,
        reasoning: evaluation.reasoning,
        createdAt: evaluation.createdAt,
      };
    });

    const totalEvaluations = enrichedEvaluations.length;
    const passedEvaluations = enrichedEvaluations.filter(e => e.verdict === 'pass').length;
    const passRate = totalEvaluations > 0 
      ? Math.round((passedEvaluations / totalEvaluations) * 100) 
      : 0;

    res.json({
      evaluations: enrichedEvaluations,
      statistics: {
        total: totalEvaluations,
        passed: passedEvaluations,
        failed: enrichedEvaluations.filter(e => e.verdict === 'fail').length,
        inconclusive: enrichedEvaluations.filter(e => e.verdict === 'inconclusive').length,
        passRate: `${passRate}%`,
      },
    });
  } catch (error) {
    console.error('Get evaluations error:', error);
    res.status(500).json({
      error: 'Failed to fetch evaluations',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
