import * as XLSX from 'xlsx';

/**
 * Clean Excel exporter:
 * Meets requirement: "โดยไม่ต้องมีหัวข้อแสดงแค่หัวข้อของข้อมูลและข้อมูลเลย"
 * Row 1 has strictly the column names, followed immediately by data rows.
 */
export function exportToExcel(filename: string, sheetName: string, headers: string[], rows: (string | number)[][]) {
  // Construct sheet data with headers on row 0, data on rows 1..N
  const data = [headers, ...rows];
  
  const ws = XLSX.utils.aoa_to_sheet(data);

  // Set nice column widths based on contents
  const colWidths = headers.map((h, i) => {
    let maxLen = h.length;
    for (const row of rows) {
      const val = row[i] !== undefined && row[i] !== null ? String(row[i]) : '';
      if (val.length > maxLen) {
        maxLen = val.length;
      }
    }
    return { wch: Math.max(maxLen + 4, 12) };
  });
  ws['!cols'] = colWidths;

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName.substring(0, 31));

  XLSX.writeFile(wb, `${filename}.xlsx`);
}
