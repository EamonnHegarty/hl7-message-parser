import { ParsedMessage, ParseError, PatientName } from '../types';

function parseName(raw: string): PatientName {
  const [lastName, firstName, middleName] = raw.split('^').map((p) => p.trim());

  if (!lastName) throw new ParseError('Patient name missing last name');
  if (!firstName) throw new ParseError('Patient name missing first name');

  return {
    lastName,
    firstName,
    // Spread conditional omits the key entirely — middleName: '' would imply
    // a name exists but is blank, which is semantically different from absent
    ...(middleName ? { middleName } : {}),
  };
}

function formatDob(raw: string): string {
  if (!/^\d{8}$/.test(raw)) {
    throw new ParseError(`Date of birth must be 8 digits in YYYYMMDD format, received: "${raw}"`);
  }

  const year = raw.slice(0, 4);
  const month = raw.slice(4, 6);
  const day = raw.slice(6, 8);

  const date = new Date(`${year}-${month}-${day}T00:00:00Z`);
  if (
    isNaN(date.getTime()) ||
    date.getUTCFullYear() !== Number(year) ||
    date.getUTCMonth() + 1 !== Number(month) ||
    date.getUTCDate() !== Number(day)
  ) {
    throw new ParseError(`Invalid date of birth: "${raw}"`);
  }

  return `${year}-${month}-${day}`;
}

export function parseMessage(raw: string): ParsedMessage {
  // Trim handles \r from line endings and any extra whitespace
  const segments = raw.split('\n').map((s) => s.trim());

  // Include pipe in prefix to avoid false matches e.g. PRSEXT|
  const prsSegment = segments.find((s) => s.startsWith('PRS|'));
  const detSegment = segments.find((s) => s.startsWith('DET|'));

  if (!prsSegment) throw new ParseError('Missing required PRS segment');
  if (!detSegment) throw new ParseError('Missing required DET segment');

  const prsFields = prsSegment.split('|');
  const detFields = detSegment.split('|');

  // Field order is fixed per spec — index 4 is name, index 8 is DOB
  const rawName = prsFields[4];
  const rawDob = prsFields[8];
  const rawDiagnosis = detFields[4];

  if (!rawName) throw new ParseError('PRS segment missing patient name at field 4');
  if (!rawDob) throw new ParseError('PRS segment missing date of birth at field 8');
  if (!rawDiagnosis) throw new ParseError('DET segment missing admitting diagnosis at field 4');

  return {
    fullName: parseName(rawName),
    dateOfBirth: formatDob(rawDob),
    primaryCondition: rawDiagnosis.trim(),
  };
}
