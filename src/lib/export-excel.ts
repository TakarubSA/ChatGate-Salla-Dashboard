import * as XLSX from "xlsx";

export function exportToExcel(
  rows: Record<string, any>[],
  filename: string,
  sheetName = "Sheet1",
) {
  if (!rows.length) {
    return;
  }

  const worksheet =
    XLSX.utils.json_to_sheet(rows);

  const workbook =
    XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(
    workbook,
    worksheet,
    sheetName,
  );

  const finalFilename =
    filename.endsWith(".xlsx")
      ? filename
      : `${filename}.xlsx`;

  XLSX.writeFile(
    workbook,
    finalFilename,
  );
}