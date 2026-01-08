// Export utilities
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

// Extend jsPDF type for autotable
declare module 'jspdf' {
    interface jsPDF {
        autoTable: (options: any) => jsPDF;
    }
}

export interface ExportColumn {
    header: string;
    accessor: string;
    format?: (value: any) => string;
}

// Export to CSV
export const exportToCsv = (
    data: Record<string, any>[],
    columns: ExportColumn[],
    filename: string
): void => {
    const headers = columns.map((col) => col.header).join(',');
    const rows = data.map((row) =>
        columns
            .map((col) => {
                const value = row[col.accessor];
                const formatted = col.format ? col.format(value) : value;
                // Escape quotes and wrap in quotes if contains comma
                const escaped = String(formatted ?? '').replace(/"/g, '""');
                return escaped.includes(',') ? `"${escaped}"` : escaped;
            })
            .join(',')
    );

    const csv = [headers, ...rows].join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
    downloadBlob(blob, `${filename}.csv`);
};

// Export to Excel
export const exportToExcel = (
    data: Record<string, any>[],
    columns: ExportColumn[],
    filename: string,
    sheetName = 'Rapor'
): void => {
    const headers = columns.map((col) => col.header);
    const rows = data.map((row) =>
        columns.map((col) => {
            const value = row[col.accessor];
            return col.format ? col.format(value) : value;
        })
    );

    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);

    // Column widths
    ws['!cols'] = columns.map(() => ({ wch: 15 }));

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    XLSX.writeFile(wb, `${filename}.xlsx`);
};

// Export to PDF
export const exportToPdf = (
    data: Record<string, any>[],
    columns: ExportColumn[],
    filename: string,
    title?: string
): void => {
    const doc = new jsPDF();

    // Title
    if (title) {
        doc.setFontSize(16);
        doc.text(title, 14, 22);
    }

    // Date
    doc.setFontSize(10);
    doc.text(`Oluşturulma: ${new Date().toLocaleDateString('tr-TR')}`, 14, title ? 32 : 22);

    const headers = columns.map((col) => col.header);
    const rows = data.map((row) =>
        columns.map((col) => {
            const value = row[col.accessor];
            return col.format ? col.format(value) : String(value ?? '');
        })
    );

    doc.autoTable({
        head: [headers],
        body: rows,
        startY: title ? 40 : 30,
        styles: {
            fontSize: 8,
            cellPadding: 2,
        },
        headStyles: {
            fillColor: [99, 102, 241], // brand.500
            textColor: 255,
        },
        alternateRowStyles: {
            fillColor: [248, 250, 252],
        },
    });

    doc.save(`${filename}.pdf`);
};

// Helper to download blob
const downloadBlob = (blob: Blob, filename: string): void => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};
