'use client';

import React, { useRef, useEffect } from 'react';
import JsBarcode from 'jsbarcode';
import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';

interface BarcodeLabel {
  code: string;
  label?: string;
  sublabel?: string;
}

interface BarcodePrintProps {
  labels: BarcodeLabel[];
  width?: number;
  height?: number;
  labelWidth?: string;
  labelHeight?: string;
}

export function BarcodePrint({
  labels,
  width = 2,
  height = 60,
  labelWidth = '6cm',
  labelHeight = '2.5cm',
}: BarcodePrintProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      const canvases = containerRef.current.querySelectorAll('canvas');
      canvases.forEach((canvas, index) => {
        if (labels[index]?.code) {
          try {
            JsBarcode(canvas as HTMLCanvasElement, labels[index].code, {
              format: 'CODE128',
              width,
              height,
              displayValue: true,
              fontSize: 12,
              margin: 2,
            });
          } catch {
            // Invalid barcode
          }
        }
      });
    }
  }, [labels, width, height]);

  const handlePrint = () => {
    if (!containerRef.current) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const labelsHtml = labels.map((item, index) => `
      <div class="label" style="width: ${labelWidth}; height: ${labelHeight}; display: inline-flex; flex-direction: column; align-items: center; justify-content: center; border: 1px dotted #ccc; margin: 2mm; padding: 2mm; page-break-inside: avoid;">
        <canvas id="canvas-${index}" data-code="${item.code}"></canvas>
        ${item.label ? `<div style="font-size: 10px; font-weight: bold; margin-top: 2px;">${item.label}</div>` : ''}
        ${item.sublabel ? `<div style="font-size: 8px; color: #666;">${item.sublabel}</div>` : ''}
      </div>
    `).join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Imprimir Códigos de Barras</title>
        <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>
        <style>
          @page { size: A4; margin: 10mm; }
          body { font-family: Arial, sans-serif; margin: 0; padding: 0; }
          .sheet { display: flex; flex-wrap: wrap; align-items: flex-start; }
          .label { page-break-inside: avoid; }
          @media print {
            .label { border: none; }
          }
        </style>
      </head>
      <body>
        <div class="sheet">
          ${labelsHtml}
        </div>
        <script>
          document.querySelectorAll('canvas').forEach(canvas => {
            JsBarcode(canvas, canvas.dataset.code, {
              format: 'CODE128',
              width: ${width},
              height: ${height},
              displayValue: true,
              fontSize: 12,
              margin: 2
            });
          });
          setTimeout(() => {
            window.print();
            window.close();
          }, 500);
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div>
      <Button onClick={handlePrint} className="mb-4">
        <Printer className="h-4 w-4 mr-2" />
        Imprimir {labels.length} Etiquetas
      </Button>
      
      <div ref={containerRef} className="flex flex-wrap gap-2 p-4 bg-white border rounded-lg">
        {labels.map((item, index) => (
          <div
            key={index}
            className="flex flex-col items-center justify-center border border-dashed border-gray-300 p-2"
            style={{ width: labelWidth, minHeight: labelHeight }}
          >
            <canvas data-code={item.code}></canvas>
            {item.label && (
              <div className="text-xs font-bold mt-1">{item.label}</div>
            )}
            {item.sublabel && (
              <div className="text-[10px] text-gray-500">{item.sublabel}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
