/**
 * Type definitions for html2pdf.js
 *
 * html2pdf.js converts HTML elements to PDF documents
 * with support for RTL and Hebrew text
 */

declare module 'html2pdf.js' {
  interface Html2PdfOptions {
    margin?: number | number[];
    filename?: string;
    image?: {
      type?: string;
      quality?: number;
    };
    html2canvas?: {
      scale?: number;
      useCORS?: boolean;
      letterRendering?: boolean;
      scrollY?: number;
      scrollX?: number;
    };
    jsPDF?: {
      unit?: string;
      format?: string;
      orientation?: 'portrait' | 'landscape';
      compress?: boolean;
    };
    pagebreak?: {
      mode?: string | string[];
      before?: string;
      after?: string;
      avoid?: string;
    };
  }

  interface Html2Pdf {
    set(options: Html2PdfOptions): Html2Pdf;
    from(element: HTMLElement): Html2Pdf;
    save(): Promise<void>;
    output(type?: string, options?: any): any;
    toPdf(): Html2Pdf;
    get(type: string): any;
  }

  function html2pdf(): Html2Pdf;

  export = html2pdf;
}
