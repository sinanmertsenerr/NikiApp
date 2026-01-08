// Export Utilities for Reports
import * as XLSX from 'xlsx-js-style';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { NIKI_LOGO_BASE64 } from './logoAssets';

export interface ExportColumn {
    key: string;
    header: string;
    width?: number;
}

export interface SummaryItem {
    label: string;
    value: string | number;
    isTotal?: boolean;
}

/**
 * Format currency for Turkish Lira
 */
export const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('tr-TR', {
        style: 'currency',
        currency: 'TRY',
        minimumFractionDigits: 2,
    }).format(value);
};

/**
 * Format date for Turkish locale
 */
export const formatDate = (date: string | Date): string => {
    return new Date(date).toLocaleDateString('tr-TR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

/**
 * Transliterate Turkish characters for PDF (jsPDF doesn't support Turkish well)
 */
const transliterateTurkish = (text: string): string => {
    if (!text) return text;

    // Character by character replacement for reliability
    let result = '';
    for (const char of text) {
        switch (char) {
            case 'ı': result += 'i'; break;
            case 'İ': result += 'I'; break;
            case 'ş': result += 's'; break;
            case 'Ş': result += 'S'; break;
            case 'ğ': result += 'g'; break;
            case 'Ğ': result += 'G'; break;
            case 'ü': result += 'u'; break;
            case 'Ü': result += 'U'; break;
            case 'ö': result += 'o'; break;
            case 'Ö': result += 'O'; break;
            case 'ç': result += 'c'; break;
            case 'Ç': result += 'C'; break;
            case '₺': result += 'TL '; break;
            default: result += char;
        }
    }
    return result;
};

/**
 * Export data to Excel file with professional styling
 */
export const exportToExcel = <T extends Record<string, any>>(
    data: T[],
    columns: ExportColumn[],
    filename: string,
    summary?: SummaryItem[],
    sheetName: string = 'Rapor'
): void => {
    // Create header row with styling
    const headers = columns.map(col => col.header);

    // Create data rows
    const rows = data.map(item =>
        columns.map(col => {
            const value = item[col.key];
            if (col.key.includes('.')) {
                return col.key.split('.').reduce((obj, key) => obj?.[key], item);
            }
            return value;
        })
    );

    // Build all rows
    const allRows: (string | number | null)[][] = [headers, ...rows];

    // Add summary section if provided
    if (summary && summary.length > 0) {
        allRows.push([]); // Empty row
        allRows.push([]); // Empty row
        summary.forEach(item => {
            allRows.push([item.label, String(item.value), '', '', '', '', '', '', '', '']);
        });
    }

    // Create worksheet
    const ws = XLSX.utils.aoa_to_sheet(allRows);

    // Style definitions
    const headerStyle = {
        font: { bold: true, color: { rgb: 'FFFFFF' }, sz: 11 },
        fill: { fgColor: { rgb: '424242' } },
        alignment: { horizontal: 'left', vertical: 'center' },
        border: {
            top: { style: 'thin', color: { rgb: '333333' } },
            bottom: { style: 'thin', color: { rgb: '333333' } },
            left: { style: 'thin', color: { rgb: '333333' } },
            right: { style: 'thin', color: { rgb: '333333' } },
        },
    };

    const cellStyle = {
        font: { sz: 10 },
        alignment: { horizontal: 'left', vertical: 'center' },
        border: {
            top: { style: 'thin', color: { rgb: 'E0E0E0' } },
            bottom: { style: 'thin', color: { rgb: 'E0E0E0' } },
            left: { style: 'thin', color: { rgb: 'E0E0E0' } },
            right: { style: 'thin', color: { rgb: 'E0E0E0' } },
        },
    };

    const alternateRowStyle = {
        ...cellStyle,
        fill: { fgColor: { rgb: 'F8F8F8' } },
    };

    const summaryLabelStyle = {
        font: { bold: true, sz: 10 },
        alignment: { horizontal: 'left' },
    };

    const summaryValueStyle = {
        font: { sz: 10 },
        alignment: { horizontal: 'left' },
    };

    const totalRowStyle = {
        font: { bold: true, color: { rgb: 'FFFFFF' }, sz: 11 },
        fill: { fgColor: { rgb: '424242' } },
        alignment: { horizontal: 'left' },
    };

    // Apply styles to cells
    const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');

    for (let row = range.s.r; row <= range.e.r; row++) {
        for (let col = range.s.c; col <= range.e.c; col++) {
            const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
            if (!ws[cellAddress]) continue;

            if (row === 0) {
                // Header row
                ws[cellAddress].s = headerStyle;
            } else if (row <= data.length) {
                // Data rows - alternate coloring
                ws[cellAddress].s = row % 2 === 0 ? alternateRowStyle : cellStyle;
            } else if (summary && row > data.length + 2) {
                // Summary section
                const summaryIndex = row - data.length - 3;
                if (summaryIndex >= 0 && summaryIndex < summary.length) {
                    if (col === 0) {
                        ws[cellAddress].s = summary[summaryIndex].isTotal ? totalRowStyle : summaryLabelStyle;
                    } else if (col === 1) {
                        ws[cellAddress].s = summary[summaryIndex].isTotal ? totalRowStyle : summaryValueStyle;
                    }
                }
            }
        }
    }

    // Set column widths
    ws['!cols'] = columns.map(col => ({ wch: col.width || 15 }));

    // Add auto filter
    ws['!autofilter'] = { ref: `A1:${XLSX.utils.encode_col(columns.length - 1)}1` };

    // Freeze first row (header)
    ws['!freeze'] = { xSplit: 0, ySplit: 1 };

    // Create workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);

    // Generate and save file
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `${filename}.xlsx`);
};

/**
 * Export data to PDF file with logo and professional styling
 */
export const exportToPDF = <T extends Record<string, any>>(
    data: T[],
    columns: ExportColumn[],
    filename: string,
    title: string,
    summary?: SummaryItem[],
    dateRange?: string
): void => {
    const doc = new jsPDF('landscape', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();

    // Transliterate title for PDF
    const safeTitle = transliterateTurkish(title);
    const safeDateRange = dateRange ? transliterateTurkish(dateRange) : undefined;

    // ===== HEADER SECTION =====
    // Add subtle header line
    doc.setDrawColor(64, 64, 64);
    doc.setLineWidth(0.3);
    doc.line(14, 35, pageWidth - 14, 35);

    // Add logo (top right)
    try {
        doc.addImage(NIKI_LOGO_BASE64, 'PNG', pageWidth - 40, 5, 25, 25);
    } catch (e) {
        // Fallback to text if image fails
        doc.setTextColor(51, 51, 51);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('NIKI THE CAT', pageWidth - 14, 15, { align: 'right' });
    }

    // Add title (bold, dark gray)
    doc.setTextColor(51, 51, 51);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text(safeTitle, 14, 15);

    // Add subtitle info
    doc.setTextColor(102, 102, 102);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    if (safeDateRange) {
        doc.text(`Tarih Araligi: ${safeDateRange}`, 14, 22);
    }
    doc.text(`Olusturulma: ${formatDate(new Date())}`, 14, 28);

    // Reset text color for table
    doc.setTextColor(0, 0, 0);

    // Prepare table data - transliterate all text
    const headers = columns.map(col => transliterateTurkish(col.header));
    const rows = data.map(item =>
        columns.map(col => {
            const value = item[col.key];
            if (col.key.includes('.')) {
                const nestedValue = col.key.split('.').reduce((obj, key) => obj?.[key], item) || '';
                return transliterateTurkish(String(nestedValue));
            }
            return value !== undefined && value !== null ? transliterateTurkish(String(value)) : '';
        })
    );

    // Add table with softer header color and pagination support
    autoTable(doc, {
        head: [headers],
        body: rows,
        startY: 40,
        styles: {
            fontSize: 8,
            cellPadding: 2.5,
            font: 'helvetica',
            textColor: [51, 51, 51],
        },
        headStyles: {
            fillColor: [66, 66, 66], // Softer dark gray instead of pure black
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            halign: 'left',
        },
        alternateRowStyles: {
            fillColor: [248, 248, 248],
        },
        columnStyles: {
            0: { fontStyle: 'normal' },
        },
        margin: { left: 14, right: 14, bottom: 25 }, // Extra bottom margin for page numbers
        showHead: 'everyPage', // Show header on every page
        didDrawPage: () => {
            // Add page numbers footer
            const pageCount = doc.getNumberOfPages();
            const currentPage = doc.getCurrentPageInfo().pageNumber;
            doc.setFontSize(8);
            doc.setTextColor(128, 128, 128);
            doc.text(
                `Sayfa ${currentPage} / ${pageCount}`,
                pageWidth / 2,
                doc.internal.pageSize.getHeight() - 10,
                { align: 'center' }
            );
        },
    });

    // Add summary if provided
    if (summary && summary.length > 0) {
        const finalY = (doc as any).lastAutoTable?.finalY || 150;

        // Summary header
        doc.setTextColor(51, 51, 51);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('OZET', 14, finalY + 15);

        // Draw line under header
        doc.setDrawColor(66, 66, 66);
        doc.setLineWidth(0.8);
        doc.line(14, finalY + 18, 120, finalY + 18);

        // Summary items
        doc.setFontSize(11);
        let yOffset = finalY + 28;

        summary.forEach((item) => {
            const safeLabel = transliterateTurkish(item.label);
            const safeValue = transliterateTurkish(String(item.value));

            if (item.isTotal) {
                // Draw box around total with softer colors
                doc.setFillColor(66, 66, 66);
                doc.rect(14, yOffset - 5, 106, 10, 'F');
                doc.setTextColor(255, 255, 255);
            } else {
                doc.setTextColor(51, 51, 51);
            }

            doc.setFont('helvetica', 'bold');
            doc.text(safeLabel, 16, yOffset);
            doc.setFont('helvetica', 'normal');
            doc.text(safeValue, 80, yOffset);

            yOffset += 10;
        });
    }

    // Save PDF
    doc.save(`${filename}.pdf`);
};

/**
 * Export data to CSV file
 */
export const exportToCSV = <T extends Record<string, any>>(
    data: T[],
    columns: ExportColumn[],
    filename: string
): void => {
    // Create header row
    const headers = columns.map(col => col.header).join(',');

    // Create data rows
    const rows = data.map(item =>
        columns.map(col => {
            let value = item[col.key];
            if (col.key.includes('.')) {
                value = col.key.split('.').reduce((obj, key) => obj?.[key], item);
            }
            // Escape commas and quotes
            if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
                value = `"${value.replace(/"/g, '""')}"`;
            }
            return value ?? '';
        }).join(',')
    ).join('\n');

    const csv = `${headers}\n${rows}`;
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' }); // BOM for UTF-8
    saveAs(blob, `${filename}.csv`);
};

// ==================== REPORT DATA GENERATORS ====================

/**
 * Wallet transaction columns
 */
export const walletTransactionColumns: ExportColumn[] = [
    { key: 'date', header: 'Tarih', width: 18 },
    { key: 'userName', header: 'Kullanici', width: 20 },
    { key: 'userEmail', header: 'E-posta', width: 25 },
    { key: 'type', header: 'Islem Tipi', width: 12 },
    { key: 'wallet', header: 'Cuzdan', width: 10 },
    { key: 'amount', header: 'Tutar', width: 15 },
    { key: 'admin', header: 'Islemi Yapan', width: 18 },
];

/**
 * User list columns
 */
export const userListColumns: ExportColumn[] = [
    { key: 'fullName', header: 'Ad Soyad', width: 20 },
    { key: 'email', header: 'E-posta', width: 25 },
    { key: 'phone', header: 'Telefon', width: 15 },
    { key: 'role', header: 'Rol', width: 12 },
    { key: 'status', header: 'Durum', width: 10 },
    { key: 'ieuBalance', header: 'IEU Bakiye', width: 12 },
    { key: 'nikiBalance', header: 'NIKI Bakiye', width: 12 },
    { key: 'totalBalance', header: 'Toplam Bakiye', width: 15 },
    { key: 'createdAt', header: 'Kayit Tarihi', width: 15 },
    { key: 'lastLoginAt', header: 'Son Giris', width: 15 },
];

/**
 * Campaign columns
 */
export const campaignColumns: ExportColumn[] = [
    { key: 'name', header: 'Kampanya Adi', width: 25 },
    { key: 'type', header: 'Tip', width: 12 },
    { key: 'discount', header: 'Indirim', width: 12 },
    { key: 'status', header: 'Durum', width: 10 },
    { key: 'totalAssigned', header: 'Atanan', width: 12 },
    { key: 'totalUsed', header: 'Kullanilan', width: 12 },
    { key: 'usageRate', header: 'Kullanim %', width: 12 },
    { key: 'totalSavings', header: 'Musteri Tasarrufu', width: 18 },
];

/**
 * Raffle columns
 */
export const raffleColumns: ExportColumn[] = [
    { key: 'title', header: 'Cekilis Adi', width: 25 },
    { key: 'startDate', header: 'Baslangic', width: 15 },
    { key: 'endDate', header: 'Bitis', width: 15 },
    { key: 'status', header: 'Durum', width: 12 },
    { key: 'participantCount', header: 'Katilimci', width: 12 },
    { key: 'winnerCount', header: 'Kazanan', width: 12 },
    { key: 'rewardType', header: 'Odul Tipi', width: 15 },
    { key: 'rewardValue', header: 'Odul Degeri', width: 15 },
];

// ==================== EXECUTIVE SUMMARY TYPES ====================

export interface ExecutiveSummaryData {
    // Ana finansal veriler
    totalTopUps: number;          // Toplam yükleme (GİRİŞ)
    totalPayments: number;        // Toplam harcama (ÇIKIŞ)
    totalRefunds: number;         // Toplam iade
    totalDiscounts: number;       // Verilen indirimler

    // İşlem adetleri
    transactionCounts: {
        topup: number;
        payment: number;
        refund: number;
        reward: number;
    };

    // Ek metrikler
    totalTransactions: number;
    activeWallets: number;

    // Kampanya verileri
    campaigns: {
        total: number;
        active: number;
        totalAssigned: number;
        totalUsed: number;
        usageRate: number;
        byType: {
            manual: { count: number; assigned: number; used: number };
            auto: { count: number; assigned: number; used: number };
        };
        topCampaigns: { name: string; usageRate: number; savings: number }[];
    };

    // Gizemli Kutu / Şans Çarkı verileri
    wheel: {
        totalSpins: number;
        winningSpins: number;
        winRate: number;
        rewardBreakdown: {
            points: number;
            discount: number;
            free_coffee: number;
            badge: number;
            nothing: number;
        };
    };

    // Dönem bilgisi
    dateRange: string;
    periodDays: number;

    // Karşılaştırma verileri
    previousPeriod: {
        totalTopUps: number;
        totalPayments: number;
        activeWallets: number;
    };

    // Grafik verileri
    dailyStats: {
        date: string;
        topup: number;
        payment: number;
    }[];
}

/**
 * Finansal öneriler üretici
 */
const generateFinancialRecommendations = (data: ExecutiveSummaryData): string[] => {
    const recommendations: string[] = [];
    const netBalance = data.totalTopUps - data.totalPayments;
    const utilizationRate = data.totalTopUps > 0 ? (data.totalPayments / data.totalTopUps) * 100 : 0;
    const avgDailyTransactions = data.periodDays > 0 ? data.transactionCounts.topup / data.periodDays : 0;

    if (utilizationRate < 30) {
        recommendations.push('Dusuk kullanim orani (%' + utilizationRate.toFixed(0) + '). Musteri harcamalarini tesvik edecek kampanyalar duzenlenmeli.');
    } else if (utilizationRate > 90) {
        recommendations.push('Yuksek kullanim orani (%' + utilizationRate.toFixed(0) + '). Musteriler bakiyelerini aktif kullaniyor - sadakat programlari ile odullendirin.');
    } else {
        recommendations.push('Kullanim orani dengeli (%' + utilizationRate.toFixed(0) + '). Mevcut strateji basarili gorunuyor.');
    }

    if (netBalance > 0) {
        recommendations.push('Pozitif nakit akisi. Yuklenen bakiyelerin bir kismi henuz harcanmadi - gelecek gelir potansiyeli.');
    } else if (netBalance < 0) {
        recommendations.push('Negatif bakiye durumu. Promosyon ve indirim politikasi gozden gecirilmeli.');
    }

    if (avgDailyTransactions < 5) {
        recommendations.push('Gunluk ortalama yukleme dusuk. Pazarlama aktiviteleri arttirilmali.');
    }

    return recommendations.slice(0, 3);
};

/**
 * Kampanya önerileri üretici
 */
const generateCampaignRecommendations = (data: ExecutiveSummaryData): string[] => {
    const recommendations: string[] = [];
    const { campaigns } = data;

    // Kullanım oranı analizi
    if (campaigns.usageRate < 40) {
        recommendations.push('Kampanya kullanim orani dusuk (%' + campaigns.usageRate.toFixed(0) + '). Kampanya duyurumlari ve hatirlatmalari arttirilmali.');
    } else if (campaigns.usageRate >= 80) {
        recommendations.push('Mukemmel kampanya performansi (%' + campaigns.usageRate.toFixed(0) + '). Basarili kampanyalari analiz edip benzerlerini olusturun.');
    } else if (campaigns.usageRate >= 60) {
        recommendations.push('Iyi kampanya performansi (%' + campaigns.usageRate.toFixed(0) + '). Kucuk iyilestirmelerle %80 uzerine cikmak mumkun.');
    } else {
        recommendations.push('Orta duzey kampanya kullanimi (%' + campaigns.usageRate.toFixed(0) + '). Hedef kitleye ozel kampanyalar deneyin.');
    }

    // Manuel vs Otomatik karşılaştırma
    const manualRate = campaigns.byType.manual.assigned > 0
        ? (campaigns.byType.manual.used / campaigns.byType.manual.assigned) * 100 : 0;
    const autoRate = campaigns.byType.auto.assigned > 0
        ? (campaigns.byType.auto.used / campaigns.byType.auto.assigned) * 100 : 0;

    if (manualRate > autoRate + 10) {
        recommendations.push('Manuel kampanyalar daha basarili (%' + manualRate.toFixed(0) + ' vs %' + autoRate.toFixed(0) + '). Kisisellesmis teklifler etkili.');
    } else if (autoRate > manualRate + 10) {
        recommendations.push('Otomatik kampanyalar daha basarili (%' + autoRate.toFixed(0) + ' vs %' + manualRate.toFixed(0) + '). Otomasyon stratejisini genisletin.');
    } else if (manualRate > 0 && autoRate > 0) {
        recommendations.push('Manuel ve otomatik kampanyalar benzer performansta. Her iki kanali da aktif kullanin.');
    }

    // Aktif kampanya kontrolü
    if (campaigns.total > 0 && campaigns.active === 0) {
        recommendations.push('Aktif kampanya yok. Yeni kampanyalar olusturarak musteri ilgisini canlandirin.');
    } else if (campaigns.active > 0) {
        recommendations.push(campaigns.active + ' aktif kampanya mevcut. Performansi duzenli takip edin.');
    }

    return recommendations.slice(0, 3);
};

/**
 * Şans Çarkı önerileri üretici
 */
const generateWheelRecommendations = (data: ExecutiveSummaryData): string[] => {
    const recommendations: string[] = [];
    const { wheel } = data;

    if (wheel.totalSpins === 0) {
        recommendations.push('Sans carki kullanimi yok. Musterileri cekmek icin odul cesitliligini artirin.');
        recommendations.push('Gizemli kutu ozelligi ile musteri bagliligini artirabilirsiniz.');
        return recommendations;
    }

    // Kazanma oranı analizi
    if (wheel.winRate < 30) {
        recommendations.push('Kazanma orani dusuk (%' + wheel.winRate.toFixed(0) + '). Musteri motivasyonu icin kazanma sansini artirin.');
    } else if (wheel.winRate >= 70) {
        recommendations.push('Kazanma orani yuksek (%' + wheel.winRate.toFixed(0) + '). Odul maliyetlerini optimize edin, kucuk odulleri artirin.');
    } else if (wheel.winRate >= 50) {
        recommendations.push('Dengeli kazanma orani (%' + wheel.winRate.toFixed(0) + '). Musteri memnuniyeti ve maliyet dengesi iyi.');
    } else {
        recommendations.push('Kazanma orani orta seviyede (%' + wheel.winRate.toFixed(0) + '). Kullanici deneyimini iyilestirmek icin artirmayi dusunun.');
    }

    // Ödül dağılımı analizi
    const nothingRate = wheel.totalSpins > 0 ? (wheel.rewardBreakdown.nothing / wheel.totalSpins) * 100 : 0;

    if (nothingRate > 40) {
        recommendations.push('Bos cevirme orani yuksek (%' + nothingRate.toFixed(0) + '). Kucuk odullerle musteri memnuniyetini artirin.');
    } else if (nothingRate > 20) {
        recommendations.push('Bos cevirme orani makul (%' + nothingRate.toFixed(0) + '). Maliyet kontrolu icin bu seviyeyi koruyun.');
    } else {
        recommendations.push('Dusuk bos cevirme orani (%' + nothingRate.toFixed(0) + '). Musteri memnuniyeti yuksek ancak maliyetleri izleyin.');
    }

    // Toplam aktivite
    recommendations.push('Toplam ' + wheel.totalSpins.toLocaleString('tr-TR') + ' cevirme ile aktif kullanim mevcut. Kampanyalarla entegre edin.');

    return recommendations.slice(0, 3);
};

/**
 * Helper: Draw page header
 */
const drawPageHeader = (doc: jsPDF, pageWidth: number, dateRange: string, pageTitle: string) => {
    // Logo
    try {
        doc.addImage(NIKI_LOGO_BASE64, 'PNG', pageWidth - 35, 8, 22, 22);
    } catch {
        doc.setTextColor(51, 51, 51);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('NIKI THE CAT', pageWidth - 14, 18, { align: 'right' });
    }

    // Title
    doc.setTextColor(51, 51, 51);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text(pageTitle, 14, 18);

    // Subtitle
    doc.setTextColor(102, 102, 102);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Donem: ${dateRange}  |  Olusturulma: ${formatDate(new Date())}`, 14, 26);

    // Header line
    doc.setDrawColor(66, 66, 66);
    doc.setLineWidth(0.5);
    doc.line(14, 32, pageWidth - 14, 32);
};

/**
 * Helper: Draw page footer
 */
const drawPageFooter = (doc: jsPDF, pageWidth: number, pageHeight: number, currentPage: number, totalPages: number) => {
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);
    doc.line(14, pageHeight - 15, pageWidth - 14, pageHeight - 15);

    doc.setTextColor(128, 128, 128);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('Bu rapor NIKI Dashboard tarafindan otomatik olusturulmustur.', 14, pageHeight - 8);
    doc.text(`Sayfa ${currentPage}/${totalPages}`, pageWidth - 14, pageHeight - 8, { align: 'right' });
};

/**
 * Helper: Draw recommendation box
 */
const drawRecommendationBox = (
    doc: jsPDF,
    title: string,
    recommendations: string[],
    startY: number,
    pageWidth: number,
    color: [number, number, number]
): number => {
    const boxHeight = 6 + recommendations.length * 9;

    doc.setFillColor(250, 250, 250);
    doc.roundedRect(14, startY, pageWidth - 28, boxHeight, 2, 2, 'F');

    doc.setTextColor(color[0], color[1], color[2]);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text(title, 18, startY + 5);

    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(66, 66, 66);

    let recY = startY + 11;
    recommendations.forEach((rec) => {
        doc.setFillColor(color[0], color[1], color[2]);
        doc.circle(20, recY - 1, 1, 'F');
        const lines = doc.splitTextToSize(rec, pageWidth - 50);
        doc.text(lines, 24, recY);
        recY += lines.length * 3.5 + 4;
    });

    return startY + boxHeight + 5;
};

/**
 * Executive Summary PDF - 2 sayfalık profesyonel özet rapor
 */
export const exportExecutiveSummaryPDF = (
    data: ExecutiveSummaryData,
    filename: string
): void => {
    const doc = new jsPDF('portrait', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // Hesaplamalar
    const netBalance = data.totalTopUps - data.totalPayments;
    const previousNetBalance = data.previousPeriod.totalTopUps - data.previousPeriod.totalPayments;

    const utilizationRate = data.totalTopUps > 0 ? (data.totalPayments / data.totalTopUps) * 100 : 0;
    const avgTransactionValue = data.transactionCounts.topup > 0 ? data.totalTopUps / data.transactionCounts.topup : 0;
    const dailyAvgTopup = data.periodDays > 0 ? data.totalTopUps / data.periodDays : 0;

    // Trend hesaplamaları
    const calculateTrend = (current: number, previous: number) => {
        if (previous === 0) return current > 0 ? 100 : 0;
        return ((current - previous) / previous) * 100;
    };

    const topupTrend = calculateTrend(data.totalTopUps, data.previousPeriod.totalTopUps);
    const paymentTrend = calculateTrend(data.totalPayments, data.previousPeriod.totalPayments);
    const balanceTrend = calculateTrend(Math.abs(netBalance), Math.abs(previousNetBalance));

    // ==================== SAYFA 1: FİNANSAL ÖZET ====================
    drawPageHeader(doc, pageWidth, data.dateRange, 'YONETICI OZET RAPORU');

    // ===== ANA ÖZET KUTULARI =====
    const boxY = 38;
    const boxWidth = (pageWidth - 42) / 4;
    const boxHeight = 28;
    const boxGap = 4;

    const summaryBoxes = [
        {
            label: 'TOPLAM YUKLEME',
            value: formatCurrency(data.totalTopUps),
            subtext: `${data.transactionCounts.topup} islem`,
            trend: topupTrend,
            trendLabel: topupTrend >= 0 ? `Artis` : `Azalis`,
            color: [76, 175, 80] as [number, number, number],
            bgColor: [232, 245, 233] as [number, number, number]
        },
        {
            label: 'TOPLAM HARCAMA',
            value: formatCurrency(data.totalPayments),
            subtext: `${data.transactionCounts.payment} islem`,
            trend: paymentTrend,
            trendLabel: paymentTrend >= 0 ? `Artis` : `Azalis`,
            color: [244, 67, 54] as [number, number, number],
            bgColor: [255, 235, 238] as [number, number, number]
        },
        {
            label: 'NET BAKIYE',
            value: formatCurrency(Math.abs(netBalance)),
            subtext: netBalance >= 0 ? 'Pozitif' : 'Negatif',
            trend: balanceTrend,
            trendLabel: balanceTrend >= 0 ? `Artis` : `Azalis`,
            color: netBalance >= 0 ? [33, 150, 243] as [number, number, number] : [255, 152, 0] as [number, number, number],
            bgColor: netBalance >= 0 ? [227, 242, 253] as [number, number, number] : [255, 243, 224] as [number, number, number]
        },
        {
            label: 'KULLANIM ORANI',
            value: `%${utilizationRate.toFixed(1)}`,
            subtext: 'Harcama/Yukleme',
            trend: null, // Oran olduğu için trend göstermiyoruz
            color: [156, 39, 176] as [number, number, number],
            bgColor: [243, 229, 245] as [number, number, number]
        }
    ];

    summaryBoxes.forEach((box, index) => {
        const x = 14 + (boxWidth + boxGap) * index;
        doc.setFillColor(box.bgColor[0], box.bgColor[1], box.bgColor[2]);
        doc.roundedRect(x, boxY, boxWidth, boxHeight, 3, 3, 'F');

        // Label
        doc.setTextColor(box.color[0], box.color[1], box.color[2]);
        doc.setFontSize(6);
        doc.setFont('helvetica', 'bold');
        doc.text(box.label, x + boxWidth / 2, boxY + 6, { align: 'center' });

        // Value
        doc.setTextColor(51, 51, 51);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text(transliterateTurkish(box.value), x + boxWidth / 2, boxY + 14, { align: 'center' });

        // Trend or Subtext
        if (box.trend !== undefined && box.trend !== null) {
            // Trend Icon and Percent
            const trendColor = box.trend >= 0 ? [76, 175, 80] : [244, 67, 54];
            const trendSymbol = box.trend >= 0 ? '+' : '';

            doc.setTextColor(trendColor[0], trendColor[1], trendColor[2]);
            doc.setFontSize(7);
            doc.setFont('helvetica', 'bold');
            doc.text(`${trendSymbol}%${Math.abs(box.trend).toFixed(0)}`, x + boxWidth / 2 - 2, boxY + 20, { align: 'right' });

            doc.setTextColor(128, 128, 128);
            doc.setFontSize(6);
            doc.setFont('helvetica', 'normal');
            doc.text(` gecen donem`, x + boxWidth / 2, boxY + 20, { align: 'left' });
        } else {
            doc.setTextColor(128, 128, 128);
            doc.setFontSize(7);
            doc.setFont('helvetica', 'normal');
            doc.text(box.subtext, x + boxWidth / 2, boxY + 20, { align: 'center' });
        }

        // Subtext (always show at bottom if trend is shown, otherwise it was the main subtext)
        if (box.trend !== undefined && box.trend !== null) {
            doc.setTextColor(150, 150, 150);
            doc.setFontSize(6);
            doc.text(box.subtext, x + boxWidth / 2, boxY + 25, { align: 'center' });
        }
    });

    // ===== İŞLEM DAĞILIMI =====
    const distributionY = boxY + boxHeight + 10;
    doc.setTextColor(51, 51, 51);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('ISLEM DAGILIMI', 14, distributionY);

    const barY = distributionY + 6;
    const barHeight = 14;
    const totalTxCount = data.transactionCounts.topup + data.transactionCounts.payment +
        data.transactionCounts.refund + data.transactionCounts.reward;

    const txTypes = [
        { label: 'Yukleme', count: data.transactionCounts.topup, color: [76, 175, 80] as [number, number, number] },
        { label: 'Harcama', count: data.transactionCounts.payment, color: [244, 67, 54] as [number, number, number] },
        { label: 'Iade', count: data.transactionCounts.refund, color: [255, 152, 0] as [number, number, number] },
        { label: 'Odul', count: data.transactionCounts.reward, color: [156, 39, 176] as [number, number, number] }
    ];

    let currentX = 14;
    const barTotalWidth = pageWidth - 28;

    txTypes.forEach((tx) => {
        if (tx.count > 0 && totalTxCount > 0) {
            const width = (tx.count / totalTxCount) * barTotalWidth;
            doc.setFillColor(tx.color[0], tx.color[1], tx.color[2]);
            doc.rect(currentX, barY, width, barHeight, 'F');
            if (width > 20) {
                doc.setTextColor(255, 255, 255);
                doc.setFontSize(7);
                doc.setFont('helvetica', 'bold');
                doc.text(`${tx.label}: ${tx.count}`, currentX + width / 2, barY + barHeight / 2 + 2, { align: 'center' });
            }
            currentX += width;
        }
    });

    // Legend
    const legendY = barY + barHeight + 6;
    let legendX = 14;
    txTypes.forEach((tx) => {
        doc.setFillColor(tx.color[0], tx.color[1], tx.color[2]);
        doc.rect(legendX, legendY - 2, 6, 6, 'F');
        doc.setTextColor(51, 51, 51);
        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        const percentage = totalTxCount > 0 ? ((tx.count / totalTxCount) * 100).toFixed(0) : '0';
        doc.text(`${tx.label}: ${tx.count} (%${percentage})`, legendX + 8, legendY + 2);
        legendX += 45;
    });

    // ===== PERFORMANS METRİKLERİ =====
    const metricsY = legendY + 12;
    doc.setTextColor(51, 51, 51);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('PERFORMANS METRIKLERI', 14, metricsY);

    const metrics = [
        ['Toplam Islem Sayisi', data.totalTransactions.toLocaleString('tr-TR')],
        ['Aktif Cuzdan Sayisi', data.activeWallets.toLocaleString('tr-TR')],
        ['Ortalama Yukleme Tutari', transliterateTurkish(formatCurrency(avgTransactionValue))],
        ['Gunluk Ortalama Yukleme', transliterateTurkish(formatCurrency(dailyAvgTopup))],
    ];

    autoTable(doc, {
        body: metrics,
        startY: metricsY + 4,
        theme: 'plain',
        styles: { fontSize: 8, cellPadding: 2 },
        columnStyles: {
            0: { fontStyle: 'bold', cellWidth: 55 },
            1: { halign: 'right', cellWidth: 35 }
        },
        tableWidth: 95,
        margin: { left: 14 }
    });

    // ===== GRAFİK: GÜNLÜK İŞLEM HACMİ =====
    if (data.dailyStats && data.dailyStats.length > 0) {
        const chartY = metricsY + 45;
        const chartHeight = 40;
        const chartWidth = pageWidth - 28;

        doc.setTextColor(51, 51, 51);
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text('GUNLUK ISLEM TRENDI', 14, chartY - 5);

        // Draw Chart Background
        doc.setDrawColor(240, 240, 240);
        doc.setFillColor(252, 252, 252);
        doc.roundedRect(14, chartY, chartWidth, chartHeight, 2, 2, 'FD');

        // Find max value for scaling
        const maxVal = Math.max(...data.dailyStats.map(d => Math.max(d.topup, d.payment)));
        const scale = maxVal > 0 ? (chartHeight - 10) / maxVal : 0;

        // Draw Grid Lines (3 lines)
        doc.setDrawColor(230, 230, 230);
        doc.setLineWidth(0.2);
        doc.line(14, chartY + 10, 14 + chartWidth, chartY + 10);
        doc.line(14, chartY + 20, 14 + chartWidth, chartY + 20);
        doc.line(14, chartY + 30, 14 + chartWidth, chartY + 30);

        // Draw Lines
        const pointWidth = chartWidth / (data.dailyStats.length - 1 || 1);

        // Helper to draw line path
        const drawLine = (key: 'topup' | 'payment', color: [number, number, number]) => {
            doc.setDrawColor(color[0], color[1], color[2]);
            doc.setLineWidth(0.8);

            let prevX = 14;
            let prevY = chartY + chartHeight - (data.dailyStats[0][key] * scale) - 5;

            for (let i = 1; i < data.dailyStats.length; i++) {
                const x = 14 + (i * pointWidth);
                const val = data.dailyStats[i][key];
                const y = chartY + chartHeight - (val * scale) - 5;

                doc.line(prevX, prevY, x, y);
                prevX = x;
                prevY = y;
            }
        };

        drawLine('topup', [76, 175, 80]); // Green for Topup
        drawLine('payment', [244, 67, 54]); // Red for Payment

        // Chart Legend
        doc.setFillColor(76, 175, 80);
        doc.rect(pageWidth - 60, chartY - 8, 3, 3, 'F');
        doc.setTextColor(100, 100, 100);
        doc.setFontSize(7);
        doc.text('Yukleme', pageWidth - 55, chartY - 6);

        doc.setFillColor(244, 67, 54);
        doc.rect(pageWidth - 30, chartY - 8, 3, 3, 'F');
        doc.text('Harcama', pageWidth - 25, chartY - 6);
    }

    // ===== FİNANSAL ÖNERİLER =====
    // Move recommendations lower if chart exists
    const recStartY = data.dailyStats && data.dailyStats.length > 0 ? metricsY + 100 : metricsY + 50;

    const financialRecs = generateFinancialRecommendations(data);
    drawRecommendationBox(doc, 'FINANSAL ONERILER', financialRecs, recStartY, pageWidth, [33, 150, 243]);

    drawPageFooter(doc, pageWidth, pageHeight, 1, 2);

    // ==================== SAYFA 2: KAMPANYA & SANS CARKI ====================
    doc.addPage();
    drawPageHeader(doc, pageWidth, data.dateRange, 'STRATEJI ANALIZI');

    // ===== KAMPANYA ANALİZİ =====
    let currentY = 38;
    doc.setTextColor(51, 51, 51);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('KAMPANYA PERFORMANSI', 14, currentY);

    // Kampanya özet kutuları
    const campBoxY = currentY + 5;
    const campBoxWidth = (pageWidth - 38) / 3;
    const campBoxHeight = 20;

    const campaignBoxes = [
        {
            label: 'TOPLAM KAMPANYA',
            value: data.campaigns.total.toString(),
            subtext: `${data.campaigns.active} aktif`,
            color: [236, 72, 153] as [number, number, number],
            bgColor: [252, 231, 243] as [number, number, number]
        },
        {
            label: 'KULLANIM ORANI',
            value: `%${data.campaigns.usageRate.toFixed(0)}`,
            subtext: `${data.campaigns.totalUsed}/${data.campaigns.totalAssigned}`,
            color: [139, 92, 246] as [number, number, number],
            bgColor: [243, 232, 255] as [number, number, number]
        },
        {
            label: 'EN BASARILI',
            value: transliterateTurkish(data.campaigns.topCampaigns[0]?.name?.substring(0, 14) || '-'),
            subtext: data.campaigns.topCampaigns[0] ? `%${data.campaigns.topCampaigns[0].usageRate.toFixed(0)} kullanim` : '',
            color: [16, 185, 129] as [number, number, number],
            bgColor: [209, 250, 229] as [number, number, number]
        }
    ];

    campaignBoxes.forEach((box, index) => {
        const x = 14 + (campBoxWidth + 5) * index;
        doc.setFillColor(box.bgColor[0], box.bgColor[1], box.bgColor[2]);
        doc.roundedRect(x, campBoxY, campBoxWidth, campBoxHeight, 2, 2, 'F');

        doc.setTextColor(box.color[0], box.color[1], box.color[2]);
        doc.setFontSize(5);
        doc.setFont('helvetica', 'bold');
        doc.text(box.label, x + campBoxWidth / 2, campBoxY + 4, { align: 'center' });

        doc.setTextColor(51, 51, 51);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.text(box.value, x + campBoxWidth / 2, campBoxY + 11, { align: 'center' });

        doc.setTextColor(128, 128, 128);
        doc.setFontSize(6);
        doc.setFont('helvetica', 'normal');
        doc.text(box.subtext, x + campBoxWidth / 2, campBoxY + 16, { align: 'center' });
    });

    // Kampanya tipi karşılaştırma
    const typeCompY = campBoxY + campBoxHeight + 5;
    doc.setTextColor(51, 51, 51);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Kampanya Tipi Karsilastirmasi', 14, typeCompY);

    const typeData = [
        ['Tip', 'Kampanya', 'Atanan', 'Kullanilan', 'Oran'],
        ['Manuel', data.campaigns.byType.manual.count.toString(), data.campaigns.byType.manual.assigned.toString(),
            data.campaigns.byType.manual.used.toString(),
            data.campaigns.byType.manual.assigned > 0 ? `%${((data.campaigns.byType.manual.used / data.campaigns.byType.manual.assigned) * 100).toFixed(0)}` : '-'],
        ['Otomatik', data.campaigns.byType.auto.count.toString(), data.campaigns.byType.auto.assigned.toString(),
            data.campaigns.byType.auto.used.toString(),
            data.campaigns.byType.auto.assigned > 0 ? `%${((data.campaigns.byType.auto.used / data.campaigns.byType.auto.assigned) * 100).toFixed(0)}` : '-'],
    ];

    autoTable(doc, {
        head: [typeData[0]],
        body: typeData.slice(1),
        startY: typeCompY + 3,
        theme: 'grid',
        styles: { fontSize: 7, cellPadding: 1.5 },
        headStyles: { fillColor: [66, 66, 66], textColor: [255, 255, 255], fontStyle: 'bold' },
        tableWidth: 110,
        margin: { left: 14 }
    });

    // Kampanya önerileri
    const campRecY = typeCompY + 28;
    const campaignRecs = generateCampaignRecommendations(data);
    const afterCampRecs = drawRecommendationBox(doc, 'KAMPANYA ONERILERI', campaignRecs, campRecY, pageWidth, [236, 72, 153]);

    // ===== ŞANS ÇARKI ANALİZİ =====
    const wheelY = afterCampRecs + 3;
    doc.setTextColor(51, 51, 51);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('GIZEMLI KUTU / SANS CARKI ANALIZI', 14, wheelY);

    // Şans çarkı özet kutuları
    const wheelBoxY = wheelY + 5;
    const wheelBoxWidth = (pageWidth - 38) / 3;
    const wheelBoxHeight = 20;

    const wheelBoxes = [
        {
            label: 'TOPLAM CEVIRME',
            value: data.wheel.totalSpins.toLocaleString('tr-TR'),
            subtext: `${data.wheel.winningSpins} kazanan`,
            color: [245, 158, 11] as [number, number, number],
            bgColor: [254, 243, 199] as [number, number, number]
        },
        {
            label: 'KAZANMA ORANI',
            value: `%${data.wheel.winRate.toFixed(0)}`,
            subtext: 'Basari orani',
            color: [34, 197, 94] as [number, number, number],
            bgColor: [220, 252, 231] as [number, number, number]
        },
        {
            label: 'EN COK ODUL',
            value: (() => {
                const rewards = data.wheel.rewardBreakdown;
                const max = Math.max(rewards.points, rewards.discount, rewards.free_coffee, rewards.badge);
                if (max === rewards.points) return 'Puan';
                if (max === rewards.discount) return 'Indirim';
                if (max === rewards.free_coffee) return 'B. Kahve';
                return 'Rozet';
            })(),
            subtext: 'En populer odul',
            color: [99, 102, 241] as [number, number, number],
            bgColor: [224, 231, 255] as [number, number, number]
        }
    ];

    wheelBoxes.forEach((box, index) => {
        const x = 14 + (wheelBoxWidth + 5) * index;
        doc.setFillColor(box.bgColor[0], box.bgColor[1], box.bgColor[2]);
        doc.roundedRect(x, wheelBoxY, wheelBoxWidth, wheelBoxHeight, 2, 2, 'F');

        doc.setTextColor(box.color[0], box.color[1], box.color[2]);
        doc.setFontSize(5);
        doc.setFont('helvetica', 'bold');
        doc.text(box.label, x + wheelBoxWidth / 2, wheelBoxY + 4, { align: 'center' });

        doc.setTextColor(51, 51, 51);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.text(box.value, x + wheelBoxWidth / 2, wheelBoxY + 11, { align: 'center' });

        doc.setTextColor(128, 128, 128);
        doc.setFontSize(6);
        doc.setFont('helvetica', 'normal');
        doc.text(box.subtext, x + wheelBoxWidth / 2, wheelBoxY + 16, { align: 'center' });
    });

    // Ödül dağılımı
    const rewardY = wheelBoxY + wheelBoxHeight + 5;
    doc.setTextColor(51, 51, 51);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Odul Dagilimi', 14, rewardY);

    const rewardData = [
        ['Odul Tipi', 'Adet', 'Oran'],
        ['Puan', data.wheel.rewardBreakdown.points.toString(), data.wheel.totalSpins > 0 ? `%${((data.wheel.rewardBreakdown.points / data.wheel.totalSpins) * 100).toFixed(0)}` : '-'],
        ['Indirim', data.wheel.rewardBreakdown.discount.toString(), data.wheel.totalSpins > 0 ? `%${((data.wheel.rewardBreakdown.discount / data.wheel.totalSpins) * 100).toFixed(0)}` : '-'],
        ['Bedava Kahve', data.wheel.rewardBreakdown.free_coffee.toString(), data.wheel.totalSpins > 0 ? `%${((data.wheel.rewardBreakdown.free_coffee / data.wheel.totalSpins) * 100).toFixed(0)}` : '-'],
        ['Rozet', data.wheel.rewardBreakdown.badge.toString(), data.wheel.totalSpins > 0 ? `%${((data.wheel.rewardBreakdown.badge / data.wheel.totalSpins) * 100).toFixed(0)}` : '-'],
        ['Bos', data.wheel.rewardBreakdown.nothing.toString(), data.wheel.totalSpins > 0 ? `%${((data.wheel.rewardBreakdown.nothing / data.wheel.totalSpins) * 100).toFixed(0)}` : '-'],
    ];

    autoTable(doc, {
        head: [rewardData[0]],
        body: rewardData.slice(1),
        startY: rewardY + 3,
        theme: 'grid',
        styles: { fontSize: 7, cellPadding: 1.5 },
        headStyles: { fillColor: [66, 66, 66], textColor: [255, 255, 255], fontStyle: 'bold' },
        tableWidth: 85,
        margin: { left: 14 }
    });

    // Şans çarkı önerileri
    const wheelRecY = rewardY + 42;
    const wheelRecs = generateWheelRecommendations(data);
    drawRecommendationBox(doc, 'SANS CARKI ONERILERI', wheelRecs, wheelRecY, pageWidth, [245, 158, 11]);

    drawPageFooter(doc, pageWidth, pageHeight, 2, 2);

    // Save
    doc.save(`${filename}.pdf`);
};
