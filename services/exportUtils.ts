/**
 * Utilitários para exportação de dados
 */

/**
 * Exporta dados para CSV
 */
export function exportToCSV(data: any[], filename: string = 'relatorio') {
  if (!data || data.length === 0) {
    console.error('Nenhum dado para exportar');
    return;
  }

  // Obter cabeçalhos do primeiro objeto
  const headers = Object.keys(data[0]);
  
  // Criar linhas CSV
  const csvRows: string[] = [];
  
  // Adicionar cabeçalhos
  csvRows.push(headers.map(h => `"${h}"`).join(','));
  
  // Adicionar dados
  data.forEach(row => {
    const values = headers.map(header => {
      const value = row[header];
      // Escapar aspas e quebras de linha
      if (value === null || value === undefined) return '""';
      const stringValue = String(value).replace(/"/g, '""');
      return `"${stringValue}"`;
    });
    csvRows.push(values.join(','));
  });
  
  // Criar blob e fazer download
  const csvContent = csvRows.join('\n');
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' }); // BOM para Excel
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Exporta dados para PDF usando impressão do navegador
 */
export function exportToPDF(title: string, content: string, filename: string = 'relatorio') {
  // Criar uma nova janela para impressão
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    console.error('Não foi possível abrir janela de impressão. Verifique bloqueadores de popup.');
    return;
  }

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
      <style>
        @media print {
          @page {
            margin: 1cm;
          }
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          font-size: 12px;
          line-height: 1.6;
          color: #333;
          max-width: 210mm;
          margin: 0 auto;
          padding: 20px;
        }
        h1 {
          color: #ea580c;
          border-bottom: 3px solid #ea580c;
          padding-bottom: 10px;
          margin-bottom: 30px;
        }
        h2 {
          color: #f97316;
          margin-top: 30px;
          margin-bottom: 15px;
          border-bottom: 2px solid #f97316;
          padding-bottom: 5px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 20px 0;
        }
        th, td {
          border: 1px solid #ddd;
          padding: 8px;
          text-align: left;
        }
        th {
          background-color: #ea580c;
          color: white;
          font-weight: 600;
        }
        tr:nth-child(even) {
          background-color: #f9fafb;
        }
        .summary {
          background-color: #fef3f2;
          border-left: 4px solid #ea580c;
          padding: 15px;
          margin: 20px 0;
        }
        .summary-item {
          display: flex;
          justify-content: space-between;
          padding: 5px 0;
        }
        .footer {
          margin-top: 50px;
          padding-top: 20px;
          border-top: 1px solid #ddd;
          text-align: center;
          color: #666;
          font-size: 10px;
        }
      </style>
    </head>
    <body>
      <h1>${title}</h1>
      ${content}
      <div class="footer">
        <p>Gerado em ${new Date().toLocaleString('pt-BR')} - RestoFlow</p>
      </div>
      <script>
        window.onload = function() {
          window.print();
          // Fechar após impressão (alguns navegadores podem não fechar automaticamente)
          setTimeout(() => window.close(), 1000);
        };
      </script>
    </body>
    </html>
  `;

  printWindow.document.write(htmlContent);
  printWindow.document.close();
}

/**
 * Converte dados para HTML de tabela
 */
export function dataToHTMLTable(data: any[], title?: string): string {
  if (!data || data.length === 0) {
    return '<p>Nenhum dado disponível</p>';
  }

  const headers = Object.keys(data[0]);
  let html = title ? `<h2>${title}</h2>` : '';
  html += '<table><thead><tr>';
  
  headers.forEach(header => {
    html += `<th>${header}</th>`;
  });
  html += '</tr></thead><tbody>';
  
  data.forEach(row => {
    html += '<tr>';
    headers.forEach(header => {
      const value = row[header];
      html += `<td>${value !== null && value !== undefined ? String(value) : ''}</td>`;
    });
    html += '</tr>';
  });
  
  html += '</tbody></table>';
  return html;
}

/**
 * Cria conteúdo HTML formatado para relatório
 */
export function createReportHTML(
  title: string,
  sections: Array<{ title: string; content: string; type?: 'table' | 'text' | 'summary' }>
): string {
  let html = '';
  
  sections.forEach(section => {
    if (section.type === 'summary') {
      html += `<div class="summary">${section.content}</div>`;
    } else if (section.type === 'text') {
      html += `<div>${section.content}</div>`;
    } else {
      html += `<h2>${section.title}</h2>${section.content}`;
    }
  });
  
  return html;
}

