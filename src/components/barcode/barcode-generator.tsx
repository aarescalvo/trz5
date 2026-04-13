'use client';

import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Barcode, Download, Printer, AlertCircle } from 'lucide-react';
import JsBarcode from 'jsbarcode';

export function BarcodeGenerator() {
  const [code, setCode] = useState('');
  const [format, setFormat] = useState<'CODE128' | 'EAN13' | 'EAN8' | 'UPC'>('CODE128');
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [generated, setGenerated] = useState(false);

  const handleGenerate = () => {
    setError(null);
    setGenerated(false);

    if (!code.trim()) {
      setError('Ingrese un código');
      return;
    }

    try {
      if (canvasRef.current) {
        JsBarcode(canvasRef.current, code, {
          format: format,
          width: 2,
          height: 100,
          displayValue: true,
          fontSize: 16,
          margin: 10,
        });
        setGenerated(true);
      }
    } catch (err) {
      setError('Código inválido para el formato seleccionado');
    }
  };

  const handleDownload = () => {
    if (canvasRef.current) {
      const link = document.createElement('a');
      link.download = `barcode-${code}.png`;
      link.href = canvasRef.current.toDataURL('image/png');
      link.click();
    }
  };

  const handlePrint = () => {
    if (canvasRef.current) {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>Código de Barras - ${code}</title>
            <style>
              body { margin: 0; display: flex; justify-content: center; align-items: center; min-height: 100vh; }
              img { max-width: 100%; }
            </style>
          </head>
          <body>
            <img src="${canvasRef.current.toDataURL('image/png')}" />
            <script>window.print(); window.close();</script>
          </body>
          </html>
        `);
        printWindow.document.close();
      }
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Barcode className="h-5 w-5" />
          Generador de Código de Barras
        </CardTitle>
        <CardDescription>
          Genere códigos de barras Code 128 y otros formatos
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="code">Código</Label>
            <Input
              id="code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Ej: B20260001-001-I"
              onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="format">Formato</Label>
            <Select value={format} onValueChange={(v: any) => setFormat(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CODE128">Code 128</SelectItem>
                <SelectItem value="EAN13">EAN-13</SelectItem>
                <SelectItem value="EAN8">EAN-8</SelectItem>
                <SelectItem value="UPC">UPC</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button onClick={handleGenerate} className="w-full">
          <Barcode className="h-4 w-4 mr-2" />
          Generar Código
        </Button>

        {error && (
          <div className="flex items-center gap-2 text-destructive text-sm">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}

        <div className="flex justify-center p-4 bg-white border rounded-lg">
          <canvas ref={canvasRef} style={{ display: generated ? 'block' : 'none' }}></canvas>
          {!generated && (
            <div className="text-muted-foreground text-sm">
              El código de barras aparecerá aquí
            </div>
          )}
        </div>

        {generated && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleDownload} className="flex-1">
              <Download className="h-4 w-4 mr-2" />
              Descargar PNG
            </Button>
            <Button variant="outline" onClick={handlePrint} className="flex-1">
              <Printer className="h-4 w-4 mr-2" />
              Imprimir
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
