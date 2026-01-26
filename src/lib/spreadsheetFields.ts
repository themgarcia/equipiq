// Mappable fields for structured spreadsheet import
export const SPREADSHEET_MAPPABLE_FIELDS = [
  { key: 'name', label: 'Name', required: true, type: 'string' as const },
  { key: 'category', label: 'Category', required: false, type: 'string' as const },
  { key: 'make', label: 'Make', required: true, type: 'string' as const },
  { key: 'model', label: 'Model', required: true, type: 'string' as const },
  { key: 'year', label: 'Year', required: false, type: 'number' as const },
  { key: 'serialVin', label: 'Serial / VIN', required: false, type: 'string' as const },
  { key: 'purchasePrice', label: 'Purchase Price', required: false, type: 'currency' as const },
  { key: 'purchaseDate', label: 'Purchase Date', required: false, type: 'date' as const },
  { key: 'salesTax', label: 'Sales Tax', required: false, type: 'currency' as const },
  { key: 'freightSetup', label: 'Freight / Setup', required: false, type: 'currency' as const },
  { key: 'financingType', label: 'Financing Type', required: false, type: 'string' as const },
  { key: 'depositAmount', label: 'Deposit Amount', required: false, type: 'currency' as const },
  { key: 'financedAmount', label: 'Financed Amount', required: false, type: 'currency' as const },
  { key: 'monthlyPayment', label: 'Monthly Payment', required: false, type: 'currency' as const },
  { key: 'termMonths', label: 'Term (Months)', required: false, type: 'number' as const },
  { key: 'buyoutAmount', label: 'Buyout Amount', required: false, type: 'currency' as const },
] as const;

export type MappableFieldKey = typeof SPREADSHEET_MAPPABLE_FIELDS[number]['key'];

export interface ColumnMapping {
  [fieldKey: string]: number | null;
}

export interface ValidationError {
  row: number;
  field: string;
  message: string;
  value: any;
}

// Parse a value based on field type
export function parseValue(value: any, fieldType: 'string' | 'number' | 'currency' | 'date'): any {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const strValue = String(value).trim();

  switch (fieldType) {
    case 'string':
      return strValue;

    case 'number':
      // Handle year or other numeric values
      const numMatch = strValue.replace(/[^\d.-]/g, '');
      const num = parseFloat(numMatch);
      return isNaN(num) ? null : num;

    case 'currency':
      // Remove currency symbols, commas, handle parentheses as negative
      let currencyStr = strValue;
      const isNegative = currencyStr.includes('(') && currencyStr.includes(')');
      currencyStr = currencyStr.replace(/[$,()]/g, '').trim();
      const amount = parseFloat(currencyStr);
      if (isNaN(amount)) return null;
      return isNegative ? -amount : amount;

    case 'date':
      // Try to parse various date formats
      const datePatterns = [
        // ISO format
        /^(\d{4})-(\d{1,2})-(\d{1,2})$/,
        // US format MM/DD/YYYY
        /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/,
        // US format MM-DD-YYYY
        /^(\d{1,2})-(\d{1,2})-(\d{4})$/,
      ];

      for (const pattern of datePatterns) {
        const match = strValue.match(pattern);
        if (match) {
          let year: number, month: number, day: number;
          
          if (pattern === datePatterns[0]) {
            // ISO: YYYY-MM-DD
            [, year, month, day] = match.map(Number) as [any, number, number, number];
          } else {
            // US: MM/DD/YYYY or MM-DD-YYYY
            [, month, day, year] = match.map(Number) as [any, number, number, number];
          }
          
          // Validate date components
          if (year >= 1900 && year <= 2100 && month >= 1 && month <= 12 && day >= 1 && day <= 31) {
            return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          }
        }
      }
      
      // Try native Date parsing as fallback
      const parsed = new Date(strValue);
      if (!isNaN(parsed.getTime())) {
        return parsed.toISOString().split('T')[0];
      }
      
      return null;

    default:
      return strValue;
  }
}

// Validate a row against mappings
export function validateRow(
  row: any[],
  mappings: ColumnMapping,
  rowIndex: number
): ValidationError[] {
  const errors: ValidationError[] = [];

  for (const field of SPREADSHEET_MAPPABLE_FIELDS) {
    const colIndex = mappings[field.key];
    if (colIndex === null || colIndex === undefined) {
      if (field.required) {
        errors.push({
          row: rowIndex,
          field: field.key,
          message: `Required field "${field.label}" is not mapped`,
          value: null,
        });
      }
      continue;
    }

    const value = row[colIndex];
    const parsedValue = parseValue(value, field.type);

    if (field.required && (parsedValue === null || parsedValue === '')) {
      errors.push({
        row: rowIndex,
        field: field.key,
        message: `Required field "${field.label}" is empty`,
        value,
      });
    }
  }

  return errors;
}
