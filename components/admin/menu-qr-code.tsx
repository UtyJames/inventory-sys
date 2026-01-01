"use client";

import { useEffect, useRef } from "react";
import QRCode from "qrcode";
import { Button } from "@/components/ui/button";
import { Download, Printer, Copy, Check } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export function MenuQRCode() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [copied, setCopied] = useState(false);

    // Use a stable full URL
    const [menuUrl, setMenuUrl] = useState("");

    useEffect(() => {
        const origin = typeof window !== 'undefined' ? window.location.origin : '';
        const url = `${origin}/menu`;
        setMenuUrl(url);

        if (canvasRef.current && url) {
            QRCode.toCanvas(canvasRef.current, url, {
                width: 320,
                margin: 2,
                color: {
                    dark: "#000000",
                    light: "#FFFFFF",
                },
                errorCorrectionLevel: 'H'
            });
        }
    }, []);

    const downloadQR = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const link = document.createElement("a");
        link.download = "ktcstock-menu-qr.png";
        link.href = canvas.toDataURL("image/png");
        link.click();
        toast.success("QR Code downloaded");
    };

    const copyUrl = () => {
        navigator.clipboard.writeText(menuUrl);
        setCopied(true);
        toast.success("Link copied to clipboard");
        setTimeout(() => setCopied(false), 2000);
    };

    const printQR = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const printWindow = window.open("", "", "width=500,height=700");
        if (!printWindow) return;

        printWindow.document.write(`
      <html>
      <head>
        <title>Menu QR Code - Eres Place</title>
        <style>
          body { font-family: sans-serif; text-align: center; padding: 50px; }
          .container { border: 4px solid #000; padding: 40px; border-radius: 40px; display: inline-block; }
          h1 { font-size: 32px; font-weight: 900; margin-bottom: 5px; text-transform: uppercase; letter-spacing: -1px; }
          p { color: #666; font-weight: bold; margin-bottom: 30px; letter-spacing: 1px; }
          img { width: 350px; height: 350px; }
          .footer { margin-top: 30px; font-weight: 900; color: #3b82f6; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Scan to Order</h1>
          <p>ERES PLACE DIGITAL MENU</p>
          <img src="${canvas.toDataURL()}" />
          <div class="footer">POWERED BY KTCSTOCKS</div>
        </div>
        <script>window.onload = () => { window.print(); window.close(); }</script>
      </body>
      </html>
    `);
        printWindow.document.close();
    };

    return (
        <div className="flex flex-col items-center">
            <div className="p-4 bg-white rounded-[40px] shadow-2xl shadow-gray-200 border border-gray-100 mb-6">
                <canvas ref={canvasRef} className="rounded-[24px]" />
            </div>

            <div className="w-full space-y-3">
                <div
                    onClick={copyUrl}
                    className="bg-gray-50 p-4 rounded-2xl flex items-center justify-between cursor-pointer hover:bg-gray-100 transition-colors border border-dashed border-gray-200"
                >
                    <span className="text-xs font-bold text-gray-500 truncate mr-4">{menuUrl}</span>
                    {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-gray-400" />}
                </div>

                <div className="flex gap-2">
                    <Button onClick={downloadQR} variant="outline" className="flex-1 rounded-2xl h-12 font-bold border-gray-200">
                        <Download className="w-4 h-4 mr-2" />
                        Download
                    </Button>
                    <Button onClick={printQR} className="flex-1 rounded-2xl h-12 bg-gray-900 text-white font-black hover:bg-black">
                        <Printer className="w-4 h-4 mr-2" />
                        Print
                    </Button>
                </div>
            </div>
        </div>
    );
}
