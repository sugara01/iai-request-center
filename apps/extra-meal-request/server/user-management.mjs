import { randomBytes, scrypt } from 'node:crypto';
import { promisify } from 'node:util';

export const DEFAULT_USER_PASSWORD = 'ineos123';

const scryptAsync = promisify(scrypt);

export async function hashPassword(password) {
  const salt = randomBytes(16);
  const derivedKey = await scryptAsync(password, salt, 64, {
    N: 32_768,
    r: 8,
    p: 1,
    maxmem: 64 * 1024 * 1024,
  });
  return `scrypt$32768$${salt.toString('hex')}$${Buffer.from(derivedKey).toString('hex')}`;
}

export class CsvImportError extends Error {}

function parseCsvRows(csv) {
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;
  let closedQuote = false;
  const input = csv.replace(/^\uFEFF/, '');

  for (let index = 0; index < input.length; index += 1) {
    const character = input[index];
    if (quoted) {
      if (character === '"') {
        if (input[index + 1] === '"') {
          field += '"';
          index += 1;
        } else {
          quoted = false;
          closedQuote = true;
        }
      } else {
        field += character;
      }
      continue;
    }

    if (character === '"' && field.length === 0 && !closedQuote) {
      quoted = true;
    } else if (character === ',' || character === '\n' || character === '\r') {
      if (character === ',') {
        row.push(field);
        field = '';
        closedQuote = false;
      } else {
        row.push(field);
        if (row.some((value) => value.trim() !== '')) rows.push(row);
        row = [];
        field = '';
        closedQuote = false;
        if (character === '\r' && input[index + 1] === '\n') index += 1;
      }
    } else {
      if (closedQuote && character.trim() === '') continue;
      if (closedQuote || character === '"') throw new CsvImportError('Unexpected character after a quoted CSV field.');
      field += character;
    }
  }

  if (quoted) throw new CsvImportError('CSV contains an unterminated quoted field.');
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    if (row.some((value) => value.trim() !== '')) rows.push(row);
  }
  return rows;
}

const headerAliases = new Map([
  ['username', 'username'],
  ['samaccountname', 'username'],
  ['accountname', 'username'],
  ['email', 'email'],
  ['emailaddress', 'email'],
  ['mail', 'email'],
  ['userprincipalname', 'email'],
  ['upn', 'email'],
  ['displayname', 'displayName'],
  ['name', 'displayName'],
  ['cn', 'displayName'],
  ['department', 'department'],
  ['jobtitle', 'jobTitle'],
  ['title', 'jobTitle'],
  ['role', 'role'],
  ['vehicleadmin', 'vehicleAdmin'],
  ['mealadmin', 'mealAdmin'],
  ['approverdoa', 'approverDoa'],
]);

function normalizeHeader(value) {
  return value.trim().toLowerCase().replace(/[\s_-]/g, '');
}

export function parseUserCsv(csv) {
  const rows = parseCsvRows(csv);
  if (rows.length < 2) throw new CsvImportError('CSV must include a header and at least one user.');
  const headers = rows[0].map((header) => headerAliases.get(normalizeHeader(header)));
  if (!headers.includes('email')) throw new CsvImportError('CSV must include an email, mail, or userPrincipalName column.');
  const mappedHeaders = headers.filter(Boolean);
  if (new Set(mappedHeaders).size !== mappedHeaders.length) throw new CsvImportError('CSV contains duplicate user fields.');

  const users = rows.slice(1).map((values, index) => {
    if (values.length !== headers.length) {
      throw new CsvImportError(`CSV row ${index + 2} has ${values.length} values; expected ${headers.length}.`);
    }
    const record = {};
    headers.forEach((header, column) => {
      if (header) record[header] = values[column].trim();
    });

    const email = String(record.email ?? '').toLowerCase();
    const username = record.username || email.split('@')[0];
    return {
      rowNumber: index + 2,
      username,
      email,
      displayName: record.displayName || username || email,
      department: record.department,
      jobTitle: record.jobTitle,
      role: record.role,
      vehicleAdmin: record.vehicleAdmin,
      mealAdmin: record.mealAdmin,
      approverDoa: record.approverDoa,
      hasDepartment: headers.includes('department'),
      hasJobTitle: headers.includes('jobTitle'),
      hasRole: headers.includes('role') && Boolean(record.role),
      hasVehicleAdmin: headers.includes('vehicleAdmin') && Boolean(record.vehicleAdmin),
      hasMealAdmin: headers.includes('mealAdmin') && Boolean(record.mealAdmin),
      hasApproverDoa: headers.includes('approverDoa') && Boolean(record.approverDoa),
    };
  });

  if (users.length > 1000) throw new CsvImportError('CSV import is limited to 1000 users per file.');
  return users;
}
