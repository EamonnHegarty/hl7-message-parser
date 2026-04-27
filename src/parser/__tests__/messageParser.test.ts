import { parseMessage } from '../messageParser';
import { ParseError } from '../../types';

describe('messageParser', () => {
  it('should extract patient name, DOB and diagnosis from a valid message', () => {
    // Arrange
    const message = [
      'MSG|^~\\&|SenderSystem|Location|ReceiverSystem|Location|20230502112233',
      '||DATA^TYPE|123456|P|2.5',
      'EVT|TYPE|20230502112233',
      'PRS|1|9876543210^^^Location^ID||Smith^John^A|||M|19800101|',
      'DET|1|I|^^MainDepartment^101^Room 1|Common Cold',
    ].join('\n');

    // Act
    const result = parseMessage(message);

    // Assert
    expect(result).toEqual({
      fullName: {
        lastName: 'Smith',
        firstName: 'John',
        middleName: 'A',
      },
      dateOfBirth: '1980-01-01',
      primaryCondition: 'Common Cold',
    });
  });

  it('should handle missing middle name and omit it from output', () => {
    // Arrange
    const message = [
      'PRS|1|9876543210^^^Location^ID||Smith^John|||M|19800101|',
      'DET|1|I|^^MainDepartment^101^Room 1|Common Cold',
    ].join('\n');

    // Act
    const result = parseMessage(message);

    // Assert
    expect(result.fullName).toEqual({ lastName: 'Smith', firstName: 'John' });
    expect(result.fullName).not.toHaveProperty('middleName');
  });

  it('should throw if PRS segment is missing', () => {
    // Arrange
    const message = [
      'MSG|^~\\&|SenderSystem|Location|20230502112233',
      'EVT|TYPE|20230502112233',
      'DET|1|I|^^MainDepartment^101^Room 1|Common Cold',
    ].join('\n');

    // Act & Assert
    expect(() => parseMessage(message)).toThrow(ParseError);
    expect(() => parseMessage(message)).toThrow('Missing required PRS segment');
  });

  it('should throw if DET segment is missing', () => {
    // Arrange
    const message = [
      'MSG|^~\\&|SenderSystem|Location|20230502112233',
      'EVT|TYPE|20230502112233',
      'PRS|1|9876543210^^^Location^ID||Smith^John^A|||M|19800101|',
    ].join('\n');

    // Act & Assert
    expect(() => parseMessage(message)).toThrow(ParseError);
    expect(() => parseMessage(message)).toThrow('Missing required DET segment');
  });

  it('should throw if firstName is empty', () => {
    // Arrange
    const message = [
      'PRS|1|9876543210^^^Location^ID||Smith^|||M|19800101|',
      'DET|1|I|^^MainDepartment^101^Room 1|Common Cold',
    ].join('\n');

    // Act & Assert
    expect(() => parseMessage(message)).toThrow(ParseError);
    expect(() => parseMessage(message)).toThrow('Patient name missing first name');
  });

  it('should throw if lastName is empty', () => {
    // Arrange
    const message = [
      'PRS|1|9876543210^^^Location^ID||^John^A|||M|19800101|',
      'DET|1|I|^^MainDepartment^101^Room 1|Common Cold',
    ].join('\n');

    // Act & Assert
    expect(() => parseMessage(message)).toThrow(ParseError);
    expect(() => parseMessage(message)).toThrow('Patient name missing last name');
  });

  it('should throw if DOB is not 8 digits', () => {
    // Arrange
    const message = [
      'PRS|1|9876543210^^^Location^ID||Smith^John^A|||M|198001|',
      'DET|1|I|^^MainDepartment^101^Room 1|Common Cold',
    ].join('\n');

    // Act & Assert
    expect(() => parseMessage(message)).toThrow(ParseError);
    expect(() => parseMessage(message)).toThrow(
      'Date of birth must be 8 digits in YYYYMMDD format'
    );
  });

  it('should throw if DOB is not a real calendar date', () => {
    // Arrange
    const message = [
      'PRS|1|9876543210^^^Location^ID||Smith^John^A|||M|19801399|',
      'DET|1|I|^^MainDepartment^101^Room 1|Common Cold',
    ].join('\n');

    // Act & Assert
    expect(() => parseMessage(message)).toThrow(ParseError);
    expect(() => parseMessage(message)).toThrow('Invalid date of birth: "19801399"');
  });

  it('should ignore unknown segments in any position', () => {
    // Arrange
    const message = [
      'UNK|some|random|data',
      'PRS|1|9876543210^^^Location^ID||Smith^John^A|||M|19800101|',
      'FOO|bar|baz',
      'DET|1|I|^^MainDepartment^101^Room 1|Common Cold',
      'BAR|extra|segment',
    ].join('\n');

    // Act
    const result = parseMessage(message);

    // Assert
    expect(result).toEqual({
      fullName: { lastName: 'Smith', firstName: 'John', middleName: 'A' },
      dateOfBirth: '1980-01-01',
      primaryCondition: 'Common Cold',
    });
  });

  it('should handle messages with Windows line endings CRLF', () => {
    // Arrange
    const message = [
      'PRS|1|9876543210^^^Location^ID||Smith^John^A|||M|19800101|',
      'DET|1|I|^^MainDepartment^101^Room 1|Common Cold',
    ].join('\r\n');

    // Act
    const result = parseMessage(message);

    // Assert
    expect(result).toEqual({
      fullName: { lastName: 'Smith', firstName: 'John', middleName: 'A' },
      dateOfBirth: '1980-01-01',
      primaryCondition: 'Common Cold',
    });
  });

  it('should handle segments without trailing pipe', () => {
    // Arrange
    const message = [
      'PRS|1|9876543210^^^Location^ID||Smith^John^A|||M|19800101',
      'DET|1|I|^^MainDepartment^101^Room 1|Common Cold',
    ].join('\n');

    // Act
    const result = parseMessage(message);

    // Assert
    expect(result).toEqual({
      fullName: { lastName: 'Smith', firstName: 'John', middleName: 'A' },
      dateOfBirth: '1980-01-01',
      primaryCondition: 'Common Cold',
    });
  });
});
