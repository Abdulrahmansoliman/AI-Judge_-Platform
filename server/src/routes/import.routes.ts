import { Router, Request, Response } from 'express';
import { ImportService } from '../services/import.service';

const router = Router();

router.post('/import-submissions', (req: Request, res: Response) => {
  try {
    const importService = new ImportService();
    const { submissions } = req.body;

    if (!submissions || !Array.isArray(submissions)) {
      return res.status(400).json({
        error: 'Invalid request body. Expected { submissions: SubmissionFromJson[] }',
      });
    }

    const result = importService.importSubmissions(submissions);

    res.json(result);
  } catch (error) {
    console.error('Import error:', error);
    res.status(500).json({
      error: 'Failed to import submissions',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
