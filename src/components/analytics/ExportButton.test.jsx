/**
 * ExportButton Component Tests
 * Tests for analytics export functionality (CSV and PDF)
 * Requirements: 3.4
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ExportButton } from './ExportButton';

// Store original functions
let originalCreateElement;
let originalAppendChild;
let originalRemoveChild;
let originalBlob;

// Mock URL.createObjectURL and URL.revokeObjectURL
global.URL.createObjectURL = vi.fn(() => 'mock-url');
global.URL.revokeObjectURL = vi.fn();

// Mock window.open
global.window.open = vi.fn(() => ({
  document: {
    write: vi.fn(),
    close: vi.fn()
  },
  onload: null,
  print: vi.fn()
}));

// Mock alert
global.alert = vi.fn();

describe('ExportButton Component', () => {
  const mockData = {
    views: 15432,
    watchTimeMinutes: 45678,
    subscribersGained: 234,
    subscribersLost: 12,
    averageViewDuration: 178,
    impressions: 89432,
    impressionsCTR: 4.8
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Store originals
    originalCreateElement = document.createElement.bind(document);
    originalAppendChild = document.body.appendChild.bind(document.body);
    originalRemoveChild = document.body.removeChild.bind(document.body);
    originalBlob = global.Blob;
  });
  
  afterEach(() => {
    // Restore originals
    document.createElement = originalCreateElement;
    document.body.appendChild = originalAppendChild;
    document.body.removeChild = originalRemoveChild;
    global.Blob = originalBlob;
  });

  it('should render export button', () => {
    render(<ExportButton data={mockData} period="30d" />);
    
    const button = screen.getByText('Exportar Relatório');
    expect(button).toBeInTheDocument();
  });

  it('should be disabled when disabled prop is true', () => {
    render(<ExportButton data={mockData} period="30d" disabled={true} />);
    
    const button = screen.getByText('Exportar Relatório');
    expect(button).toBeDisabled();
  });

  it('should show export menu when clicked', async () => {
    render(<ExportButton data={mockData} period="30d" />);
    
    const button = screen.getByText('Exportar Relatório');
    fireEvent.click(button);
    
    await waitFor(() => {
      expect(screen.getByText('Exportar CSV')).toBeInTheDocument();
      expect(screen.getByText('Exportar PDF')).toBeInTheDocument();
    });
  });

  it('should hide menu when backdrop is clicked', async () => {
    render(<ExportButton data={mockData} period="30d" />);
    
    const button = screen.getByText('Exportar Relatório');
    fireEvent.click(button);
    
    await waitFor(() => {
      expect(screen.getByText('Exportar CSV')).toBeInTheDocument();
    });
    
    // Click backdrop
    const backdrop = document.querySelector('.fixed.inset-0');
    fireEvent.click(backdrop);
    
    await waitFor(() => {
      expect(screen.queryByText('Exportar CSV')).not.toBeInTheDocument();
    });
  });

  it('should export to CSV when CSV option is clicked', async () => {
    render(<ExportButton data={mockData} period="30d" />);
    
    // Mock document.createElement and appendChild AFTER render
    const mockLink = {
      setAttribute: vi.fn(),
      click: vi.fn(),
      style: {}
    };
    const originalCreateElement = document.createElement.bind(document);
    document.createElement = vi.fn((tag) => {
      if (tag === 'a') return mockLink;
      return originalCreateElement(tag);
    });
    
    const mockAppendChild = vi.fn();
    const mockRemoveChild = vi.fn();
    document.body.appendChild = mockAppendChild;
    document.body.removeChild = mockRemoveChild;
    
    // Open menu
    const button = screen.getByText('Exportar Relatório');
    fireEvent.click(button);
    
    // Click CSV export
    await waitFor(() => {
      const csvButton = screen.getByText('Exportar CSV');
      fireEvent.click(csvButton);
    });
    
    // Verify CSV export was triggered
    await waitFor(() => {
      expect(mockLink.setAttribute).toHaveBeenCalledWith('href', 'mock-url');
      expect(mockLink.setAttribute).toHaveBeenCalledWith('download', expect.stringContaining('.csv'));
      expect(mockLink.click).toHaveBeenCalled();
    });
    
    // Restore original createElement
    document.createElement = originalCreateElement;
  });

  it('should export to PDF when PDF option is clicked', async () => {
    render(<ExportButton data={mockData} period="30d" />);
    
    // Open menu
    const button = screen.getByText('Exportar Relatório');
    fireEvent.click(button);
    
    // Click PDF export
    await waitFor(() => {
      const pdfButton = screen.getByText('Exportar PDF');
      fireEvent.click(pdfButton);
    });
    
    // Verify PDF export was triggered (window.open)
    await waitFor(() => {
      expect(window.open).toHaveBeenCalledWith('', '_blank');
    });
  });

  it('should include all metrics in CSV export', async () => {
    render(<ExportButton data={mockData} period="30d" />);
    
    let csvContent = '';
    
    // Mock Blob to capture CSV content AFTER render
    const originalBlob = global.Blob;
    global.Blob = vi.fn((content) => {
      csvContent = content[0];
      return { type: 'text/csv;charset=utf-8;' };
    });
    
    const mockLink = {
      setAttribute: vi.fn(),
      click: vi.fn(),
      style: {}
    };
    const originalCreateElement = document.createElement.bind(document);
    document.createElement = vi.fn((tag) => {
      if (tag === 'a') return mockLink;
      return originalCreateElement(tag);
    });
    
    document.body.appendChild = vi.fn();
    document.body.removeChild = vi.fn();
    
    // Open menu and click CSV
    const button = screen.getByText('Exportar Relatório');
    fireEvent.click(button);
    
    await waitFor(() => {
      const csvButton = screen.getByText('Exportar CSV');
      fireEvent.click(csvButton);
    });
    
    // Verify CSV content includes all metrics
    await waitFor(() => {
      expect(csvContent).toContain('Métrica,Valor');
      expect(csvContent).toContain('Visualizações,15432');
      expect(csvContent).toContain('Tempo de Exibição (min),45678');
      expect(csvContent).toContain('Inscritos Ganhos,234');
      expect(csvContent).toContain('Inscritos Perdidos,12');
      expect(csvContent).toContain('CTR (%),4.8');
    });
    
    // Restore
    document.createElement = originalCreateElement;
    global.Blob = originalBlob;
  });

  it('should include period information in export', async () => {
    render(<ExportButton data={mockData} period="90d" />);
    
    let csvContent = '';
    global.Blob = vi.fn((content) => {
      csvContent = content[0];
      return { type: 'text/csv;charset=utf-8;' };
    });
    
    const mockLink = {
      setAttribute: vi.fn(),
      click: vi.fn(),
      style: {}
    };
    document.createElement = vi.fn((tag) => {
      if (tag === 'a') return mockLink;
      return originalCreateElement(tag);
    });
    
    document.body.appendChild = vi.fn();
    document.body.removeChild = vi.fn();
    
    const button = screen.getByText('Exportar Relatório');
    fireEvent.click(button);
    
    await waitFor(() => {
      const csvButton = screen.getByText('Exportar CSV');
      fireEvent.click(csvButton);
    });
    
    await waitFor(() => {
      expect(csvContent).toContain('Período,90d');
    });
  });

  it('should show loading state during export', async () => {
    render(<ExportButton data={mockData} period="30d" />);
    
    const button = screen.getByText('Exportar Relatório');
    fireEvent.click(button);
    
    await waitFor(() => {
      const csvButton = screen.getByText('Exportar CSV');
      fireEvent.click(csvButton);
    });
    
    // Button should show loading state
    await waitFor(() => {
      expect(screen.getByText('Exportando...')).toBeInTheDocument();
    });
  });

  it('should handle export errors gracefully', async () => {
    render(<ExportButton data={mockData} period="30d" />);
    
    // Mock Blob to throw error
    global.Blob = vi.fn(() => {
      throw new Error('Export failed');
    });
    
    const button = screen.getByText('Exportar Relatório');
    fireEvent.click(button);
    
    await waitFor(() => {
      const csvButton = screen.getByText('Exportar CSV');
      fireEvent.click(csvButton);
    });
    
    // Should show error alert
    await waitFor(() => {
      expect(global.alert).toHaveBeenCalledWith(expect.stringContaining('Erro'));
    });
  });

  it('should generate filename with current date', async () => {
    render(<ExportButton data={mockData} period="30d" />);
    
    const mockLink = {
      setAttribute: vi.fn(),
      click: vi.fn(),
      style: {}
    };
    document.createElement = vi.fn((tag) => {
      if (tag === 'a') return mockLink;
      return originalCreateElement(tag);
    });
    
    document.body.appendChild = vi.fn();
    document.body.removeChild = vi.fn();
    
    const button = screen.getByText('Exportar Relatório');
    fireEvent.click(button);
    
    await waitFor(() => {
      const csvButton = screen.getByText('Exportar CSV');
      fireEvent.click(csvButton);
    });
    
    await waitFor(() => {
      const downloadCall = mockLink.setAttribute.mock.calls.find(
        call => call[0] === 'download'
      );
      expect(downloadCall[1]).toMatch(/analytics-report-\d{4}-\d{2}-\d{2}\.csv/);
    });
  });

  it('should handle missing data gracefully', async () => {
    const incompleteData = {
      views: 1000
      // Missing other fields
    };
    
    render(<ExportButton data={incompleteData} period="30d" />);
    
    let csvContent = '';
    global.Blob = vi.fn((content) => {
      csvContent = content[0];
      return { type: 'text/csv;charset=utf-8;' };
    });
    
    const mockLink = {
      setAttribute: vi.fn(),
      click: vi.fn(),
      style: {}
    };
    document.createElement = vi.fn((tag) => {
      if (tag === 'a') return mockLink;
      return originalCreateElement(tag);
    });
    
    document.body.appendChild = vi.fn();
    document.body.removeChild = vi.fn();
    
    const button = screen.getByText('Exportar Relatório');
    fireEvent.click(button);
    
    await waitFor(() => {
      const csvButton = screen.getByText('Exportar CSV');
      fireEvent.click(csvButton);
    });
    
    // Should use 0 for missing values
    await waitFor(() => {
      expect(csvContent).toContain('Visualizações,1000');
      expect(csvContent).toContain('Inscritos Ganhos,0');
      expect(csvContent).toContain('CTR (%),0');
    });
  });
});
