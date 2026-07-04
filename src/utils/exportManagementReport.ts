import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import html2canvas from "html2canvas";

export interface ManagementReportSection {
  title: string;
  headers: string[];
  rows: string[][];
}

interface ExportManagementReportOptions {
  title: string;
  sections: ManagementReportSection[];
  dashboardElement?: HTMLElement | null;
}

const border: Partial<ExcelJS.Borders> = {
  top: { style: "thin", color: { argb: "FFE2E8F0" } },
  bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
  left: { style: "thin", color: { argb: "FFE2E8F0" } },
  right: { style: "thin", color: { argb: "FFE2E8F0" } },
};

const setTypedValue = (cell: ExcelJS.Cell, header: string, value: string) => {
  const normalizedHeader = header.toLowerCase();
  const numericValue = Number(value);

  if (/^(id|cantidad)$/.test(normalizedHeader) && value !== "" && Number.isFinite(numericValue)) {
    cell.value = numericValue;
    cell.numFmt = "#,##0";
    cell.alignment = { horizontal: "right", vertical: "middle" };
    return;
  }

  if (normalizedHeader.includes("valor") && value !== "" && Number.isFinite(numericValue)) {
    cell.value = numericValue;
    cell.numFmt = 'S/ #,##0.00';
    cell.alignment = { horizontal: "right", vertical: "middle" };
    return;
  }

  if (normalizedHeader.includes("fecha") && /^\d{4}-\d{2}-\d{2}/.test(value)) {
    cell.value = new Date(`${value.substring(0, 10)}T00:00:00`);
    cell.numFmt = "dd/mm/yyyy";
    cell.alignment = { horizontal: "center", vertical: "middle" };
    return;
  }

  cell.value = value;
  cell.alignment = { horizontal: "left", vertical: "middle", wrapText: true };
};

export const exportManagementReport = async ({
  title,
  sections,
  dashboardElement,
}: ExportManagementReportOptions) => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Fluxus";
  workbook.created = new Date();

  const maxColumns = Math.max(1, ...sections.map((section) => section.headers.length));
  const worksheet = workbook.addWorksheet("Reporte de gestión", {
    views: [{ showGridLines: false }],
    pageSetup: {
      orientation: "landscape",
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      margins: { left: 0.3, right: 0.3, top: 0.5, bottom: 0.5, header: 0.2, footer: 0.2 },
    },
  });

  worksheet.mergeCells(1, 1, 1, maxColumns);
  const titleCell = worksheet.getCell(1, 1);
  titleCell.value = title;
  titleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E3A8A" } };
  titleCell.font = { name: "Calibri", size: 18, bold: true, color: { argb: "FFFFFFFF" } };
  titleCell.alignment = { horizontal: "center", vertical: "middle" };
  worksheet.getRow(1).height = 36;

  worksheet.mergeCells(2, 1, 2, maxColumns);
  const generatedAtCell = worksheet.getCell(2, 1);
  generatedAtCell.value = `Generado el ${new Date().toLocaleString("es-PE")}`;
  generatedAtCell.font = { italic: true, color: { argb: "FF64748B" } };
  generatedAtCell.alignment = { horizontal: "right", vertical: "middle" };

  let currentRow = 4;

  sections.forEach((section) => {
    const sectionColumns = Math.max(1, section.headers.length);
    worksheet.mergeCells(currentRow, 1, currentRow, sectionColumns);
    const sectionTitle = worksheet.getCell(currentRow, 1);
    sectionTitle.value = section.title;
    sectionTitle.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFDBEAFE" } };
    sectionTitle.font = { bold: true, size: 13, color: { argb: "FF1E3A8A" } };
    sectionTitle.alignment = { vertical: "middle" };
    worksheet.getRow(currentRow).height = 25;
    currentRow += 1;

    const headerRow = worksheet.getRow(currentRow);
    section.headers.forEach((header, index) => {
      const cell = headerRow.getCell(index + 1);
      cell.value = header;
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E293B" } };
      cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
      cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
      cell.border = border;
    });
    headerRow.height = 28;
    currentRow += 1;

    if (section.rows.length === 0) {
      worksheet.mergeCells(currentRow, 1, currentRow, sectionColumns);
      const emptyCell = worksheet.getCell(currentRow, 1);
      emptyCell.value = "No hay registros disponibles.";
      emptyCell.font = { italic: true, color: { argb: "FF64748B" } };
      emptyCell.alignment = { horizontal: "center", vertical: "middle" };
      currentRow += 1;
    } else {
      section.rows.forEach((values, rowIndex) => {
        const row = worksheet.getRow(currentRow);
        section.headers.forEach((header, columnIndex) => {
          const cell = row.getCell(columnIndex + 1);
          setTypedValue(cell, header, values[columnIndex] ?? "");
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: rowIndex % 2 === 0 ? "FFF8FAFC" : "FFFFFFFF" },
          };
          cell.border = border;
        });
        row.height = 23;
        currentRow += 1;
      });
    }

    currentRow += 2;
  });

  for (let columnIndex = 1; columnIndex <= maxColumns; columnIndex += 1) {
    let maxLength = 10;
    worksheet.getColumn(columnIndex).eachCell({ includeEmpty: false }, (cell) => {
      maxLength = Math.max(maxLength, String(cell.value ?? "").length);
    });
    worksheet.getColumn(columnIndex).width = Math.min(maxLength + 3, 35);
  }

  if (dashboardElement) {
    const canvas = await html2canvas(dashboardElement, { scale: 2, useCORS: true });
    const imageId = workbook.addImage({ base64: canvas.toDataURL("image/png"), extension: "png" });
    const dashboardSheet = workbook.addWorksheet("Vista del dashboard");
    dashboardSheet.views = [{ showGridLines: false }];
    dashboardSheet.addImage(imageId, {
      tl: { col: 0.5, row: 0.5 },
      ext: { width: canvas.width / 2, height: canvas.height / 2 },
    });
  }

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const date = new Date().toLocaleDateString("es-PE").replace(/\//g, "-");
  saveAs(blob, `reporte_gestion_${date}.xlsx`);
};
