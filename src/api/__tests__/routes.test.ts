import request from 'supertest';
import { app, server } from '../../index';

jest.mock('../messageRepository', () => ({
  save: jest.fn(),
}));

const VALID_MESSAGE = [
  'MSG|^~\\&|SenderSystem|Location|ReceiverSystem|Location|20230502112233',
  'EVT|TYPE|20230502112233',
  'PRS|1|9876543210^^^Location^ID||Smith^John^A|||M|19800101|',
  'DET|1|I|^^MainDepartment^101^Room 1|Common Cold',
].join('\n');

describe('POST /api/parse', () => {
  afterAll((done) => {
    server.close(done);
  });

  it('should return 200 with parsed data for a valid message', async () => {
    const res = await request(app).post('/api/parse').send({ message: VALID_MESSAGE });
    expect(res.status).toBe(200);
    expect(res.body.fullName.lastName).toBe('Smith');
    expect(res.body.dateOfBirth).toBe('1980-01-01');
    expect(res.body.primaryCondition).toBe('Common Cold');
  });

  it('should return 400 if message field is missing from body', async () => {
    const res = await request(app).post('/api/parse').send({});
    expect(res.status).toBe(400);
  });

  it('should return 400 if message is not a string', async () => {
    const res = await request(app).post('/api/parse').send({ message: 123 });
    expect(res.status).toBe(400);
  });

  it('should return 400 if message cannot be parsed', async () => {
    const res = await request(app).post('/api/parse').send({ message: 'garbage' });
    expect(res.status).toBe(400);
  });
});
