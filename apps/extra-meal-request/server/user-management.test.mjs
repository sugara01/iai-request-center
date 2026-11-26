import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_USER_PASSWORD, CsvImportError, hashPassword, parseUserCsv, verifyPassword } from './user-management.mjs';

test('hashPassword stores a salted scrypt hash instead of the password', async () => {
  const firstHash = await hashPassword(DEFAULT_USER_PASSWORD);
  const secondHash = await hashPassword(DEFAULT_USER_PASSWORD);

  assert.match(firstHash, /^scrypt\$32768\$[0-9a-f]{32}\$[0-9a-f]{128}$/);
  assert.notEqual(firstHash, secondHash);
  assert.ok(!firstHash.includes(DEFAULT_USER_PASSWORD));
});

test('verifyPassword accepts matching scrypt hashes and rejects wrong or malformed values', async () => {
  const passwordHash = await hashPassword('correct horse');

  assert.equal(await verifyPassword('correct horse', passwordHash), true);
  assert.equal(await verifyPassword('wrong password', passwordHash), false);
  assert.equal(await verifyPassword('correct horse', 'not-a-hash'), false);
});

test('parseUserCsv accepts Active Directory headers, quoted commas, and optional permissions', () => {
  const users = parseUserCsv(
    'sAMAccountName,mail,displayName,department,title,role,vehicle_admin,meal_admin,approver_doa\r\n' +
    'bimo,bimo@example.com,"Bimo, Nusantoro",IT,Engineer,ITAdmin,false,false,false\r\n',
  );

  assert.equal(users.length, 1);
  assert.equal(users[0].username, 'bimo');
  assert.equal(users[0].email, 'bimo@example.com');
  assert.equal(users[0].displayName, 'Bimo, Nusantoro');
  assert.equal(users[0].jobTitle, 'Engineer');
  assert.equal(users[0].role, 'ITAdmin');
  assert.equal(users[0].hasMealAdmin, true);
});

test('parseUserCsv rejects missing email columns and malformed quoted fields', () => {
  assert.throws(() => parseUserCsv('username,display_name\nbimo,Bimo\n'), CsvImportError);
  assert.throws(() => parseUserCsv('email,display_name\nbimo@example.com,"Bimo\n'), CsvImportError);
});
