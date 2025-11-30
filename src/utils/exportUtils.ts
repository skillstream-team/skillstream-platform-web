/**
 * Utility functions for exporting data to CSV/Excel formats
 */

export interface ExportRow {
  [key: string]: string | number | null | undefined;
}

/**
 * Convert data to CSV format
 */
export function convertToCSV(data: ExportRow[], headers: string[]): string {
  // Create header row
  const headerRow = headers.join(',');
  
  // Create data rows
  const dataRows = data.map(row => {
    return headers.map(header => {
      const value = row[header];
      // Handle values that might contain commas or quotes
      if (value === null || value === undefined) {
        return '';
      }
      const stringValue = String(value);
      // Escape quotes and wrap in quotes if contains comma or quote
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    }).join(',');
  });
  
  return [headerRow, ...dataRows].join('\n');
}

/**
 * Download CSV file
 */
export function downloadCSV(csvContent: string, filename: string): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}

/**
 * Convert data to Excel-compatible CSV (UTF-8 with BOM for Excel compatibility)
 */
export function convertToExcelCSV(data: ExportRow[], headers: string[]): string {
  const csv = convertToCSV(data, headers);
  // Add UTF-8 BOM for Excel compatibility
  return '\ufeff' + csv;
}

/**
 * Export data to CSV file
 */
export function exportToCSV(
  data: ExportRow[],
  headers: string[],
  filename: string,
  excelCompatible: boolean = false
): void {
  const csvContent = excelCompatible 
    ? convertToExcelCSV(data, headers)
    : convertToCSV(data, headers);
  
  downloadCSV(csvContent, filename);
}

/**
 * Format date for export
 */
export function formatDateForExport(date: string | Date | null | undefined): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
}

/**
 * Format datetime for export
 */
export function formatDateTimeForExport(date: string | Date | null | undefined): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '';
  return d.toLocaleString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

