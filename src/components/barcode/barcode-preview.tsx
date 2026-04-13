'use client';

import React, { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';

interface BarcodePreviewProps {
  code: string;
  format?: 'CODE128' | 'CODE128A' | 'CODE128B' | 'CODE128C' | 'EAN13' | 'EAN8' | 'UPC';
  width?: number;
  height?: number;
  displayValue?: boolean;
  fontSize?: number;
  className?: string;
  onError?: (error: string) => void;
}

export function BarcodePreview({
  code,
  format = 'CODE128',
  width = 2,
  height = 80,
  displayValue = true,
  fontSize = 14,
  className = '',
  onError,
}: BarcodePreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current && code) {
      try {
        JsBarcode(canvasRef.current, code, {
          format,
          width,
          height,
          displayValue,
          fontSize,
          margin: 5,
        });
      } catch (error) {
        onError?.(String(error));
      }
    }
  }, [code, format, width, height, displayValue, fontSize, onError]);

  return (
    <div className={`flex justify-center ${className}`}>
      <canvas ref={canvasRef} />
    </div>
  );
}
