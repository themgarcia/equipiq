import { describe, expect, test } from 'bun:test';
import { parseRequiredNumber, bigLifeChangeWarning } from '../../src/lib/numericInput';

describe('numeric input', () => {
  test('empty value never becomes 0', () => {
    expect(parseRequiredNumber('', 1, 30, 'Useful life').ok).toBe(false);
    expect(parseRequiredNumber('   ', 0, 100, 'Resale %').ok).toBe(false);
  });
  test('"11" parses as 11', () => {
    expect(parseRequiredNumber('11', 1, 30, 'Useful life')).toEqual({ ok: true, value: 11 });
  });
  test('useful life out of 1–30 is rejected', () => {
    expect(parseRequiredNumber('0', 1, 30, 'Useful life').ok).toBe(false);
    expect(parseRequiredNumber('31', 1, 30, 'Useful life').ok).toBe(false);
  });
  test('10 typed as 1 against a 10-year default warns', () => {
    expect(bigLifeChangeWarning(1, 10)).not.toBeNull();
    expect(bigLifeChangeWarning(11, 10)).toBeNull();
    expect(bigLifeChangeWarning(21, 10)).not.toBeNull();
  });
});
