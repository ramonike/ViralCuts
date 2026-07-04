/**
 * ExportButton Component
 * Handles exporting analytics data to PDF and CSV formats
 * Requirements: 3.4
 */

import React, { useState } from 'react';
import { Download, FileText, Table } from 'lucide-react';

/**
 * Export analytics data to CSV format
 */
function exportToCSV(data, filename = 'analytics-report.csv') {
    // Prepare CSV content
    const headers = ['Métrica', 'Valor'];
    const rows = [
        ['Visualizações', data.views || 0],
        ['Tempo de Exibição (min)', data.watchTimeMinutes || 0],
        ['Inscritos Ganhos', data.subscribersGained || 0],
        ['Inscritos Perdidos', data.subscribersLost || 0],
        ['Duração Média de Visualização (s)', data.averageViewDuration || 0],
        ['Impressões', data.impressions || 0],
        ['CTR (%)', data.impressionsCTR || 0],
        ['Período', data.period || 'N/A']
    ];

    // Convert to CSV string
    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
    ].join('\n');

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

/**
 * Export analytics data to PDF format (simplified version)
 * In production, you would use a library like jsPDF or pdfmake
 */
function exportToPDF(data, filename = 'analytics-report.pdf') {
    // For now, we'll create a simple HTML report and print it
    // In production, use a proper PDF library
    
    const reportHTML = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Relatório de Analytics</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    padding: 40px;
                    color: #333;
                }
                h1 {
                    color: #1e293b;
                    border-bottom: 3px solid #3b82f6;
                    padding-bottom: 10px;
                }
                .metric {
                    display: flex;
                    justify-content: space-between;
                    padding: 12px;
                    margin: 8px 0;
                    background: #f8fafc;
                    border-left: 4px solid #3b82f6;
                }
                .metric-label {
                    font-weight: bold;
                    color: #475569;
                }
                .metric-value {
                    color: #1e293b;
                    font-size: 18px;
                }
                .footer {
                    margin-top: 40px;
                    padding-top: 20px;
                    border-top: 1px solid #e2e8f0;
                    color: #64748b;
                    font-size: 12px;
                }
            </style>
        </head>
        <body>
            <h1>📊 Relatório de Analytics</h1>
            <p><strong>Período:</strong> ${data.period || 'N/A'}</p>
            <p><strong>Data de Geração:</strong> ${new Date().toLocaleString('pt-BR')}</p>
            
            <h2>Métricas Principais</h2>
            <div class="metric">
                <span class="metric-label">Visualizações</span>
                <span class="metric-value">${(data.views || 0).toLocaleString()}</span>
            </div>
            <div class="metric">
                <span class="metric-label">Tempo de Exibição</span>
                <span class="metric-value">${(data.watchTimeMinutes || 0).toLocaleString()} minutos</span>
            </div>
            <div class="metric">
                <span class="metric-label">Inscritos Ganhos</span>
                <span class="metric-value">${(data.subscribersGained || 0).toLocaleString()}</span>
            </div>
            <div class="metric">
                <span class="metric-label">Inscritos Perdidos</span>
                <span class="metric-value">${(data.subscribersLost || 0).toLocaleString()}</span>
            </div>
            <div class="metric">
                <span class="metric-label">Crescimento Líquido</span>
                <span class="metric-value">${((data.subscribersGained || 0) - (data.subscribersLost || 0)).toLocaleString()}</span>
            </div>
            <div class="metric">
                <span class="metric-label">Duração Média de Visualização</span>
                <span class="metric-value">${(data.averageViewDuration || 0).toFixed(0)} segundos</span>
            </div>
            <div class="metric">
                <span class="metric-label">Impressões</span>
                <span class="metric-value">${(data.impressions || 0).toLocaleString()}</span>
            </div>
            <div class="metric">
                <span class="metric-label">CTR (Click-Through Rate)</span>
                <span class="metric-value">${(data.impressionsCTR || 0).toFixed(2)}%</span>
            </div>
            
            <div class="footer">
                <p>Relatório gerado automaticamente pelo Viral Cuts Dashboard</p>
            </div>
        </body>
        </html>
    `;

    // Open in new window and trigger print
    const printWindow = window.open('', '_blank');
    printWindow.document.write(reportHTML);
    printWindow.document.close();
    
    // Wait for content to load, then print
    printWindow.onload = () => {
        printWindow.print();
    };
}

export function ExportButton({ data, period, disabled = false }) {
    const [isExporting, setIsExporting] = useState(false);
    const [showMenu, setShowMenu] = useState(false);

    const handleExport = async (format) => {
        setIsExporting(true);
        setShowMenu(false);

        try {
            // Prepare data with period info
            const exportData = {
                ...data,
                period: period || '30d'
            };

            // Generate filename with timestamp
            const timestamp = new Date().toISOString().split('T')[0];
            const filename = `analytics-report-${timestamp}`;

            if (format === 'csv') {
                exportToCSV(exportData, `${filename}.csv`);
            } else if (format === 'pdf') {
                exportToPDF(exportData, `${filename}.pdf`);
            }

            // Show success message (you could use a toast notification here)
            setTimeout(() => {
                alert(`Relatório exportado com sucesso em formato ${format.toUpperCase()}!`);
            }, 100);
        } catch (error) {
            console.error('Export error:', error);
            alert('Erro ao exportar relatório. Tente novamente.');
        } finally {
            setTimeout(() => setIsExporting(false), 100);
        }
    };

    return (
        <div className="relative">
            <button
                onClick={() => setShowMenu(!showMenu)}
                disabled={disabled || isExporting}
                className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
            >
                <Download className="w-4 h-4" />
                {isExporting ? 'Exportando...' : 'Exportar Relatório'}
            </button>

            {/* Export menu */}
            {showMenu && (
                <>
                    {/* Backdrop */}
                    <div 
                        className="fixed inset-0 z-10" 
                        onClick={() => setShowMenu(false)}
                    />
                    
                    {/* Menu */}
                    <div className="absolute right-0 mt-2 w-48 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-20 overflow-hidden">
                        <button
                            onClick={() => handleExport('csv')}
                            className="w-full flex items-center gap-3 px-4 py-3 text-left text-white hover:bg-slate-700 transition-colors"
                        >
                            <Table className="w-4 h-4 text-green-400" />
                            <div>
                                <div className="font-medium">Exportar CSV</div>
                                <div className="text-xs text-slate-400">Planilha de dados</div>
                            </div>
                        </button>
                        
                        <button
                            onClick={() => handleExport('pdf')}
                            className="w-full flex items-center gap-3 px-4 py-3 text-left text-white hover:bg-slate-700 transition-colors border-t border-slate-700"
                        >
                            <FileText className="w-4 h-4 text-red-400" />
                            <div>
                                <div className="font-medium">Exportar PDF</div>
                                <div className="text-xs text-slate-400">Relatório formatado</div>
                            </div>
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}

export default ExportButton;
