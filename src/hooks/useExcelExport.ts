import { useState } from 'react';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import html2canvas from 'html2canvas';

export type ColumnType = 'text' | 'number' | 'currency' | 'date';

export interface ExcelColumn<T> {
  header: string;
  key: keyof T;
  type?: ColumnType;
  width?: number; // Opcional si deseas forzar un ancho específico
}

export interface ExportExcelProps<T> {
  data: T[];
  columns: ExcelColumn<T>[];
  fileName?: string;
  sheetName?: string;
  dashboardRef?: React.RefObject<HTMLElement | null>;
}

export const useExcelExport = () => {
  const [isExporting, setIsExporting] = useState(false);

  const exportToExcel = async <T extends Record<string, any>>({
    data,
    columns,
    fileName = 'Reporte',
    sheetName = 'Datos',
    dashboardRef,
  }: ExportExcelProps<T>) => {
    try {
      setIsExporting(true);

      // 1. Crear el Workbook y la Hoja de Datos
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'Tu App React';
      workbook.created = new Date();
      
      const worksheet = workbook.addWorksheet(sheetName, {
        views: [{ state: 'frozen', ySplit: 1 }] // Congelar la fila de encabezados
      });

      // 2. Definir Columnas
      worksheet.columns = columns.map((col) => ({
        header: col.header,
        key: col.key as string,
      }));

      // 3. Estilos del Encabezado (Profesional, azul marino desaturado)
      const headerRow = worksheet.getRow(1);
      headerRow.height = 25; // Altura un poco mayor para dar aire al diseño
      
      headerRow.eachCell((cell) => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF1E293B' }, // Color slate-800 de Tailwind
        };
        cell.font = {
          color: { argb: 'FFFFFFFF' },
          bold: true,
          size: 11,
          name: 'Calibri'
        };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFCBD5E1' } }, // slate-300
          bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } },
          left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
          right: { style: 'thin', color: { argb: 'FFCBD5E1' } },
        };
      });

      // 4. Agregar Datos y Formatear Celdas
      data.forEach((item, index) => {
        const row = worksheet.addRow(item);
        const isEven = index % 2 === 0;

        row.eachCell((cell, colNumber) => {
          const columnConfig = columns[colNumber - 1];

          // Zebra Striping (Filas alternas)
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: isEven ? 'FFF8FAFC' : 'FFFFFFFF' }, // slate-50 (gris ultra claro) alternado con blanco
          };

          // Bordes limpios en toda la tabla
          cell.border = {
            top: { style: 'thin', color: { argb: 'FFE2E8F0' } }, // slate-200
            bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
            left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
            right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          };

          // Formato por tipo de dato y alineación
          switch (columnConfig.type) {
            case 'currency':
              cell.numFmt = '"$"#,##0.00'; // Formato de moneda
              cell.alignment = { horizontal: 'right', vertical: 'middle' };
              // Intentar parsear el string a número si es necesario
              if (typeof cell.value === 'string') {
                 const num = parseFloat(cell.value.replace(/[^0-9.-]+/g, ""));
                 if (!isNaN(num)) cell.value = num;
              }
              break;
            case 'number':
              cell.numFmt = '#,##0.00'; // Formato de millares
              cell.alignment = { horizontal: 'right', vertical: 'middle' };
              if (typeof cell.value === 'string') {
                 const num = parseFloat(cell.value.replace(/[^0-9.-]+/g, ""));
                 if (!isNaN(num)) cell.value = num;
              }
              break;
            case 'date':
              cell.numFmt = 'dd/mm/yyyy';
              cell.alignment = { horizontal: 'center', vertical: 'middle' };
              // Asegurarnos de que Excel lo trate como fecha nativa
              if (cell.value) {
                const dateVal = new Date(cell.value as string | number);
                if (!isNaN(dateVal.getTime())) {
                  cell.value = dateVal;
                }
              }
              break;
            default: // Textos
              cell.alignment = { horizontal: 'left', vertical: 'middle' };
          }
        });
      });

      // 5. Auto-ajuste Inteligente de Ancho de Columnas
      columns.forEach((col, index) => {
        if (col.width) {
          worksheet.getColumn(index + 1).width = col.width; // Respetar ancho manual si existe
          return;
        }
        
        let maxLength = col.header.length;
        const column = worksheet.getColumn(index + 1);

        column.eachCell({ includeEmpty: true }, (cell) => {
          let cellLength = 0;
          if (cell.value) {
            if (col.type === 'date') {
              cellLength = 10; // dd/mm/yyyy siempre ocupa aprox 10 caracteres
            } else if (col.type === 'currency' || col.type === 'number') {
               // Estimación con símbolos y decimales para números
               cellLength = cell.value.toString().length + 5; 
            } else {
               cellLength = cell.value.toString().length;
            }
          }
          if (cellLength > maxLength) maxLength = cellLength;
        });

        // Evitar anchos absurdos (máximo 100 caracteres) y añadir pequeño padding (+2)
        column.width = Math.min(Math.max(maxLength, 10), 100) + 2; 
      });

      // 6. Capturar Screenshot del Dashboard (Si se provee la referencia)
      if (dashboardRef?.current) {
        // Generar canvas del HTML (scale: 2 mejora la calidad para retinas)
        const canvas = await html2canvas(dashboardRef.current, { 
           scale: 2, 
           useCORS: true // Necesario si tienes imágenes externas en el dashboard
        });
        const imgData = canvas.toDataURL('image/png');

        // Insertar imagen en el workbook
        const imageId = workbook.addImage({
          base64: imgData,
          extension: 'png',
        });

        // Crear una hoja independiente y más limpia para la previsualización
        const dashboardSheet = workbook.addWorksheet('Captura Dashboard');
        
        // Colocar la imagen en la nueva hoja
        dashboardSheet.addImage(imageId, {
          tl: { col: 1, row: 1 }, // Empezar un poco desplazado para margen
          ext: { width: canvas.width / 2, height: canvas.height / 2 } // Ajustar escala
        });
        
        // Ocultar lineas de cuadrícula para que parezca una página en blanco de reporte
        dashboardSheet.views = [{ showGridLines: false }];
      }

      // 7. Escribir y gatillar descarga (Asíncrono)
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      
      // Nombre de archivo con fecha
      const dateStr = new Date().toLocaleDateString('es-ES').replace(/\//g, '-');
      saveAs(blob, `${fileName}_${dateStr}.xlsx`);

    } catch (error) {
      console.error('Error generando archivo Excel:', error);
      throw error;
    } finally {
      setIsExporting(false);
    }
  };

  return { exportToExcel, isExporting };
};
