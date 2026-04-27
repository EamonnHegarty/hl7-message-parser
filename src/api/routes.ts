import { Router, Request, Response, NextFunction } from 'express';
import { parseMessage } from '../parser/messageParser';
import { save } from './messageRepository';

const router = Router();

router.post('/parse', (req: Request, res: Response, next: NextFunction): void => {
  try {
    const { message } = req.body as { message: unknown };

    if (!message || typeof message !== 'string') {
      res.status(400).json({ error: 'Request body must include a "message" string field' });
      return;
    }

    const result = parseMessage(message);
    save(result);

    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
});

export default router;
