import express, { Request, Response, NextFunction } from 'express';
import router from './api/routes';
import { ParseError } from './types';

const app = express();
const PORT = process.env.PORT ?? 3000;

app.use(express.json());
app.use('/api', router);

app.use((err: Error, _req: Request, res: Response, _next: NextFunction): void => {
  if (err instanceof ParseError) {
    res.status(400).json({ error: err.message });
  } else {
    res.status(500).json({ error: 'Internal server error' });
  }
});

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export { app, server };
