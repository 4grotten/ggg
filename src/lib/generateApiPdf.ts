import { jsPDF } from 'jspdf';
import { apiCategories, API_BASE_URL, type ApiEndpoint, type ApiParameter } from '@/data/apiDocumentation';

// Colors
const COLORS = {
  primary: [59, 130, 246] as [number, number, number],      // Blue
  success: [34, 197, 94] as [number, number, number],       // Green
  warning: [249, 115, 22] as [number, number, number],      // Orange  
  danger: [239, 68, 68] as [number, number, number],        // Red
  info: [168, 85, 247] as [number, number, number],         // Purple
  dark: [30, 41, 59] as [number, number, number],           // Dark slate
  gray: [100, 116, 139] as [number, number, number],        // Gray
  lightGray: [241, 245, 249] as [number, number, number],   // Light gray bg
  white: [255, 255, 255] as [number, number, number],
};

const METHOD_COLORS: Record<string, [number, number, number]> = {
  GET: COLORS.success,
  POST: COLORS.primary,
  PUT: COLORS.warning,
  DELETE: COLORS.danger,
  PATCH: COLORS.info,
};

export const generateApiPdf = () => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  const addNewPageIfNeeded = (requiredSpace: number) => {
    if (y + requiredSpace > pageHeight - margin) {
      doc.addPage();
      y = margin;
      return true;
    }
    return false;
  };

  const drawMethodBadge = (method: string, x: number, yPos: number) => {
    const color = METHOD_COLORS[method] || COLORS.gray;
    doc.setFillColor(...color);
    doc.roundedRect(x, yPos - 4, 18, 6, 1, 1, 'F');
    doc.setTextColor(...COLORS.white);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.text(method, x + 9, yPos - 0.5, { align: 'center' });
  };

  // ===== COVER PAGE =====
  // Background gradient effect
  doc.setFillColor(...COLORS.dark);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');
  
  // Decorative circles
  doc.setFillColor(59, 130, 246);
  doc.circle(pageWidth - 30, 50, 60, 'F');
  doc.circle(30, pageHeight - 50, 40, 'F');

  // Logo / Title
  doc.setTextColor(...COLORS.white);
  doc.setFontSize(36);
  doc.setFont('helvetica', 'bold');
  doc.text('Easy Card', pageWidth / 2, 80, { align: 'center' });
  
  doc.setFontSize(16);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184);
  doc.text('API Documentation', pageWidth / 2, 95, { align: 'center' });

  // API Base URL
  doc.setFontSize(10);
  doc.setTextColor(...COLORS.primary);
  doc.text(API_BASE_URL, pageWidth / 2, 115, { align: 'center' });

  // Version info
  doc.setFontSize(9);
  doc.setTextColor(148, 163, 184);
  doc.text(`Version 1.0 • Generated ${new Date().toLocaleDateString('ru-RU')}`, pageWidth / 2, 130, { align: 'center' });

  // Categories overview
  doc.setTextColor(...COLORS.white);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Содержание', pageWidth / 2, 160, { align: 'center' });

  let tocY = 175;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  apiCategories.forEach((category, idx) => {
    doc.setTextColor(148, 163, 184);
    doc.text(`${category.icon} ${category.title}`, margin + 20, tocY);
    doc.setTextColor(100, 116, 139);
    doc.text(`${category.endpoints.length} endpoints`, pageWidth - margin - 20, tocY, { align: 'right' });
    tocY += 8;
  });

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('Powered by Apofiz', pageWidth / 2, pageHeight - 20, { align: 'center' });

  // ===== CONTENT PAGES =====
  doc.addPage();
  y = margin;

  // Set white background for content pages
  const addPageBackground = () => {
    doc.setFillColor(...COLORS.white);
    doc.rect(0, 0, pageWidth, pageHeight, 'F');
  };
  addPageBackground();

  // Introduction
  doc.setTextColor(...COLORS.dark);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('API Reference', margin, y + 5);
  y += 15;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.gray);
  const introText = `Base URL: ${API_BASE_URL}\n\nВсе запросы к API должны включать заголовок Content-Type: application/json.\nДля авторизованных запросов используйте заголовок: Authorization: Token <your_token>`;
  const introLines = doc.splitTextToSize(introText, contentWidth);
  doc.text(introLines, margin, y);
  y += introLines.length * 5 + 10;

  // Draw separator
  doc.setDrawColor(...COLORS.lightGray);
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);
  y += 10;

  // Iterate through categories
  apiCategories.forEach((category, catIndex) => {
    addNewPageIfNeeded(30);
    addPageBackground();

    // Category header
    doc.setFillColor(...COLORS.lightGray);
    doc.roundedRect(margin, y - 5, contentWidth, 12, 2, 2, 'F');
    
    doc.setTextColor(...COLORS.dark);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(`${category.icon} ${category.title}`, margin + 5, y + 3);
    y += 15;

    // Iterate through endpoints
    category.endpoints.forEach((endpoint, endpointIndex) => {
      addNewPageIfNeeded(60);
      addPageBackground();

      // Endpoint header
      drawMethodBadge(endpoint.method, margin, y);
      
      doc.setTextColor(...COLORS.dark);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text(endpoint.title, margin + 22, y);
      y += 3;

      // Path
      doc.setFontSize(9);
      doc.setFont('courier', 'normal');
      doc.setTextColor(...COLORS.primary);
      doc.text(endpoint.path, margin + 22, y + 4);
      y += 10;

      // Description
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...COLORS.gray);
      doc.setFontSize(9);
      const descLines = doc.splitTextToSize(endpoint.description, contentWidth - 5);
      doc.text(descLines, margin, y);
      y += descLines.length * 4 + 5;

      // Parameters section
      const renderParams = (params: ApiParameter[] | undefined, title: string) => {
        if (!params || params.length === 0) return;
        
        addNewPageIfNeeded(20 + params.length * 8);
        
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...COLORS.dark);
        doc.text(title, margin, y);
        y += 5;

        params.forEach((param) => {
          doc.setFont('courier', 'normal');
          doc.setFontSize(8);
          doc.setTextColor(...COLORS.primary);
          doc.text(param.name, margin + 3, y);
          
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(...COLORS.gray);
          const typeText = `${param.type}${param.required ? ' *' : ''}`;
          doc.text(typeText, margin + 40, y);
          
          const paramDesc = doc.splitTextToSize(param.description, contentWidth - 80);
          doc.text(paramDesc[0] || '', margin + 60, y);
          y += 5;
          
          if (paramDesc.length > 1) {
            for (let i = 1; i < paramDesc.length; i++) {
              doc.text(paramDesc[i], margin + 60, y);
              y += 4;
            }
          }
        });
        y += 3;
      };

      if (endpoint.authorization) {
        doc.setFontSize(8);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(...COLORS.warning);
        doc.text(`🔒 ${endpoint.authorization.type}: ${endpoint.authorization.description}`, margin, y);
        y += 6;
      }

      renderParams(endpoint.bodyParams, 'Body Parameters:');
      renderParams(endpoint.queryParams, 'Query Parameters:');
      renderParams(endpoint.pathParams, 'Path Parameters:');

      // Request example
      if (endpoint.requestExample?.json) {
        addNewPageIfNeeded(25);
        
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...COLORS.dark);
        doc.text('Request Body:', margin, y);
        y += 5;

        doc.setFillColor(248, 250, 252);
        const jsonLines = endpoint.requestExample.json.split('\n');
        const boxHeight = Math.min(jsonLines.length * 4 + 4, 40);
        doc.roundedRect(margin, y - 2, contentWidth, boxHeight, 1, 1, 'F');
        
        doc.setFont('courier', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(...COLORS.dark);
        jsonLines.slice(0, 8).forEach((line, i) => {
          doc.text(line, margin + 3, y + 2 + i * 4);
        });
        y += boxHeight + 3;
      }

      // Response example
      if (endpoint.responseExample) {
        addNewPageIfNeeded(25);
        
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...COLORS.dark);
        doc.text(`Response (${endpoint.responseExample.status}):`, margin, y);
        y += 5;

        doc.setFillColor(240, 253, 244);
        const respLines = endpoint.responseExample.json.split('\n');
        const respBoxHeight = Math.min(respLines.length * 4 + 4, 40);
        doc.roundedRect(margin, y - 2, contentWidth, respBoxHeight, 1, 1, 'F');
        
        doc.setFont('courier', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(22, 101, 52);
        respLines.slice(0, 8).forEach((line, i) => {
          doc.text(line, margin + 3, y + 2 + i * 4);
        });
        y += respBoxHeight + 3;
      }

      // Notes
      if (endpoint.notes && endpoint.notes.length > 0) {
        addNewPageIfNeeded(15);
        
        doc.setFontSize(8);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(...COLORS.info);
        endpoint.notes.slice(0, 2).forEach((note) => {
          doc.text(`ℹ️ ${note}`, margin, y);
          y += 4;
        });
      }

      // Separator between endpoints
      y += 5;
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.3);
      doc.line(margin, y, pageWidth - margin, y);
      y += 8;
    });

    y += 5;
  });

  // Add page numbers
  const totalPages = doc.getNumberOfPages();
  for (let i = 2; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(...COLORS.gray);
    doc.text(`${i - 1} / ${totalPages - 1}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
    doc.text('Easy Card API Documentation', margin, pageHeight - 10);
  }

  // Save
  doc.save('EasyCard_API_Documentation.pdf');
};
