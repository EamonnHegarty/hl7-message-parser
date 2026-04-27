export type PatientName = {
  lastName: string;
  firstName: string;
  middleName?: string;
};

export type ParsedMessage = {
  fullName: PatientName;
  dateOfBirth: string;
  primaryCondition: string;
};

export class ParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ParseError';
  }
}
