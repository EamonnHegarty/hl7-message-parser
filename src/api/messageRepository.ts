import * as fs from 'fs';
import * as path from 'path';
import { ParsedMessage } from '../types';

const DB_PATH = path.join(process.cwd(), 'src', 'db', 'db.json');

function readAll(): ParsedMessage[] {
  const raw = fs.readFileSync(DB_PATH, 'utf-8');
  return JSON.parse(raw) as ParsedMessage[];
}

export function save(record: ParsedMessage): void {
  const records = readAll();
  records.push(record);
  fs.writeFileSync(DB_PATH, JSON.stringify(records, null, 2));
}
