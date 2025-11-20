import { Router, Request, Response } from 'express';
import { JudgeRepository } from '../repositories';

const router = Router();

router.get('/judges', (_req: Request, res: Response) => {
  try {
    const judgeRepo = new JudgeRepository();
    const judges = judgeRepo.findAll();
    res.json(judges);
  } catch (error) {
    console.error('Get judges error:', error);
    res.status(500).json({
      error: 'Failed to fetch judges',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

router.post('/judges', (req: Request, res: Response) => {
  try {
    const judgeRepo = new JudgeRepository();
    const { name, systemPrompt, model, active } = req.body;

    if (!name || !systemPrompt || !model) {
      return res.status(400).json({
        error: 'Missing required fields: name, systemPrompt, model',
      });
    }

    const existing = judgeRepo.findByName(name);
    if (existing) {
      return res.status(409).json({
        error: 'A judge with this name already exists',
      });
    }

    const judge = judgeRepo.create({
      name,
      systemPrompt,
      model,
      active: active !== undefined ? active : true,
    });

    res.status(201).json(judge);
  } catch (error) {
    console.error('Create judge error:', error);
    res.status(500).json({
      error: 'Failed to create judge',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

router.put('/judges/:id', (req: Request, res: Response) => {
  try {
    const judgeRepo = new JudgeRepository();
    const id = parseInt(req.params.id, 10);
    
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid judge ID' });
    }

    const { name, systemPrompt, model, active } = req.body;
    const updateData: any = {};

    if (name !== undefined) updateData.name = name;
    if (systemPrompt !== undefined) updateData.systemPrompt = systemPrompt;
    if (model !== undefined) updateData.model = model;
    if (active !== undefined) updateData.active = active;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        error: 'No fields to update',
      });
    }

    const updated = judgeRepo.update(id, updateData);
    
    if (!updated) {
      return res.status(404).json({
        error: 'Judge not found',
      });
    }

    res.json(updated);
  } catch (error) {
    console.error('Update judge error:', error);
    res.status(500).json({
      error: 'Failed to update judge',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

router.delete('/judges/:id', (req: Request, res: Response) => {
  try {
    const judgeRepo = new JudgeRepository();
    const id = parseInt(req.params.id, 10);
    
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid judge ID' });
    }

    const success = judgeRepo.delete(id);
    
    if (!success) {
      return res.status(404).json({
        error: 'Judge not found',
      });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Delete judge error:', error);
    res.status(500).json({
      error: 'Failed to delete judge',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
