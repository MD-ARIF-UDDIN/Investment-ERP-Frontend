import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';
import html2canvas from 'html2canvas';

/**
 * Export data to PDF using html2canvas for Bengali support
 * This renders a temporary hidden table to capture it as an image
 */
export const exportToPDF = async (data, columns, fileName = 'report', title = 'Report') => {
    // Create a temporary container
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.top = '0';
    container.style.width = '800px';
    container.style.backgroundColor = 'white';
    container.style.padding = '20px';
    container.style.fontFamily = 'serif'; // Use a generic serif font which usually handles Bengali better in browsers

    // Add Title
    const titleEl = document.createElement('h1');
    titleEl.innerText = title;
    titleEl.style.fontSize = '24px';
    titleEl.style.marginBottom = '10px';
    titleEl.style.color = '#111827';
    titleEl.style.textAlign = 'center';
    container.appendChild(titleEl);

    // Add Date
    const dateEl = document.createElement('p');
    dateEl.innerText = `Generated on: ${new Date().toLocaleString('bn-BD')}`;
    dateEl.style.fontSize = '14px';
    dateEl.style.marginBottom = '20px';
    dateEl.style.color = '#4B5563';
    dateEl.style.textAlign = 'center';
    container.appendChild(dateEl);

    // Create Table
    const table = document.createElement('table');
    table.style.width = '100%';
    table.style.borderCollapse = 'collapse';

    // Table Header
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    headerRow.style.backgroundColor = '#4F46E5';
    headerRow.style.color = 'white';

    columns.forEach(col => {
        const th = document.createElement('th');
        th.innerText = col.header;
        th.style.padding = '12px 8px';
        th.style.border = '1px solid #E5E7EB';
        th.style.textAlign = 'left';
        th.style.fontSize = '14px';
        headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);

    // Table Body
    const tbody = document.createElement('tbody');
    data.forEach((item, index) => {
        const tr = document.createElement('tr');
        tr.style.backgroundColor = index % 2 === 0 ? 'white' : '#F9FAFB';
        columns.forEach(col => {
            const td = document.createElement('td');
            td.innerText = item[col.dataKey] || '';
            td.style.padding = '10px 8px';
            td.style.border = '1px solid #E5E7EB';
            td.style.fontSize = '13px';
            td.style.color = '#111827';
            tr.appendChild(td);
        });
        tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    container.appendChild(table);

    document.body.appendChild(container);

    try {
        const canvas = await html2canvas(container, {
            scale: 2,
            logging: false,
            useCORS: true,
            allowTaint: true,
            backgroundColor: '#ffffff'
        });

        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const imgProps = pdf.getImageProperties(imgData);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

        // Handle multi-page if necessary (basic implementation)
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(`${fileName}_${new Date().getTime()}.pdf`);
    } catch (error) {
        console.error('PDF Export Error:', error);
        throw error;
    } finally {
        document.body.removeChild(container);
    }
};

/**
 * Export data to Excel using xlsx
 * @param {Array} data - Array of objects to export
 * @param {Array} columns - Column definitions { header: string, dataKey: string }
 * @param {string} fileName - Name of the output file (without extension)
 */
export const exportToExcel = (data, columns, fileName = 'report') => {
    // Map data to handle headers
    const excelData = data.map(item => {
        const row = {};
        columns.forEach(col => {
            row[col.header] = item[col.dataKey];
        });
        return row;
    });

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');

    XLSX.writeFile(workbook, `${fileName}_${new Date().getTime()}.xlsx`);
};
