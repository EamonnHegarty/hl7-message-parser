import * as fs from 'fs';
import { save } from '../messageRepository';
import { ParsedMessage } from '../../types';

jest.mock('fs');

const SAMPLE_RECORD: ParsedMessage = {
  fullName: { lastName: 'Smith', firstName: 'John', middleName: 'A' },
  dateOfBirth: '1980-01-01',
  primaryCondition: 'Common Cold',
};

describe('messageRepository', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should save a record to db.json', () => {
    // Arrange
    (fs.readFileSync as jest.Mock).mockImplementation(() => '[]');

    // Act
    save(SAMPLE_RECORD);

    // Assert
    expect(fs.writeFileSync as unknown as jest.Mock).toHaveBeenCalledWith(
      expect.stringContaining('db.json'),
      JSON.stringify([SAMPLE_RECORD], null, 2)
    );
  });

  it('should append to existing records not overwrite', () => {
    // Arrange
    const existingRecord: ParsedMessage = {
      fullName: { lastName: 'Jones', firstName: 'Jane' },
      dateOfBirth: '1990-05-15',
      primaryCondition: 'Flu',
    };
    (fs.readFileSync as jest.Mock).mockImplementation(() => JSON.stringify([existingRecord]));

    // Act
    save(SAMPLE_RECORD);

    // Assert
    expect(fs.writeFileSync as unknown as jest.Mock).toHaveBeenCalledWith(
      expect.stringContaining('db.json'),
      JSON.stringify([existingRecord, SAMPLE_RECORD], null, 2)
    );
  });

  it('should throw if db.json is not valid JSON', () => {
    // Arrange
    (fs.readFileSync as jest.Mock).mockImplementation(() => 'not valid json{{{{');

    // Act & Assert
    expect(() => save(SAMPLE_RECORD)).toThrow();
  });
});
