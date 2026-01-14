/**
 * Downloads data as a CSV file
 */
export function downloadCSV(rows: string[][], filename: string) {
  const escapeCsvValue = (value: string): string => {
    // Escape quotes by doubling them, wrap in quotes if contains comma, quote, or newline
    if (value.includes('"') || value.includes(',') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  };

  const csv = rows
    .map(row => row.map(escapeCsvValue).join(','))
    .join('\n');
  
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
