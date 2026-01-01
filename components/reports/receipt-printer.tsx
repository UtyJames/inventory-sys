"use client";

import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer, X } from "lucide-react";
import { formatNaira } from "@/lib/utils/format";

interface ReceiptPrinterProps {
    isOpen: boolean;
    onClose: () => void;
    order: any;
}

export function ReceiptPrinter({ isOpen, onClose, order }: ReceiptPrinterProps) {
    if (!order) return null;

    const handlePrint = () => {
        const printWindow = window.open("", "", "width=400,height=600");
        if (!printWindow) return;

        printWindow.document.write('<!DOCTYPE html><html><head>');
        printWindow.document.write('<meta charset="utf-8">');
        printWindow.document.write(`<title>Receipt ${order.orderNumber}</title>`);
        printWindow.document.write('<style>');
        printWindow.document.write(`
            @media print {
                body { margin: 0; padding: 10px; width: 80mm; font-family: 'Courier New', Courier, monospace; font-size: 12px; }
                .header { text-align: center; margin-bottom: 15px; }
                .dashed { border-top: 1px dashed #000; margin: 10px 0; }
                .row { display: flex; justify-content: space-between; margin-bottom: 3px; }
                .item-row { display: flex; justify-content: space-between; margin-bottom: 5px; font-style: italic; }
                .total-row { display: flex; justify-content: space-between; font-weight: bold; }
                .footer { text-align: center; font-weight: bold; margin-top: 20px; }
            }
        `);
        printWindow.document.write('</style></head><body>');

        // Header
        printWindow.document.write('<div class="header">');
        printWindow.document.write('<h3 style="font-size: 18px; font-weight: bold; margin: 0 0 5px 0;">Eres Place</h3>');
        printWindow.document.write('<p style="margin: 2px 0; font-size: 11px;">111, Irhirhi Road By Ashland Hotel Junction</p>');
        printWindow.document.write('<p style="margin: 2px 0; font-size: 11px;">Off Airport road, Benin city</p>');
        printWindow.document.write('<p style="margin: 2px 0; font-size: 11px;">Tel: 09060958968</p>');
        printWindow.document.write('</div>');

        printWindow.document.write('<div class="dashed"></div>');

        // Order Info
        printWindow.document.write('<div style="margin-bottom: 10px;">');
        printWindow.document.write(`<div class="row"><span>DATE:</span><span>${new Date(order.createdAt).toLocaleString()}</span></div>`);
        printWindow.document.write(`<div class="row"><span>ORDER:</span><span style="text-transform: uppercase;">${order.orderNumber}</span></div>`);
        printWindow.document.write(`<div class="row"><span>CASHIER:</span><span style="text-transform: uppercase;">${order.user?.name || "System"}</span></div>`);
        if (order.customerName) {
            printWindow.document.write(`<div class="row"><span>CUSTOMER:</span><span style="text-transform: uppercase;">${order.customerName}</span></div>`);
        }
        if (order.tableNumber) {
            printWindow.document.write(`<div class="row"><span>TABLE:</span><span style="text-transform: uppercase;">${order.tableNumber}</span></div>`);
        }
        printWindow.document.write('</div>');

        printWindow.document.write('<div class="dashed"></div>');

        // Items
        printWindow.document.write('<div style="margin-bottom: 10px;">');
        order.items.forEach((item: any) => {
            printWindow.document.write('<div class="item-row">');
            printWindow.document.write('<div style="flex: 1;">');
            printWindow.document.write(`<div>${item.name}</div>`);
            printWindow.document.write(`<div style="font-size: 10px;">${item.quantity} x ${formatNaira(item.price)}</div>`);
            printWindow.document.write('</div>');
            printWindow.document.write(`<span style="font-weight: bold;">${formatNaira(item.subtotal)}</span>`);
            printWindow.document.write('</div>');
        });
        printWindow.document.write('</div>');

        printWindow.document.write('<div class="dashed"></div>');

        // Totals
        printWindow.document.write('<div style="margin-bottom: 10px;">');
        printWindow.document.write(`<div class="row"><span>SUBTOTAL:</span><span>${formatNaira(order.subtotal)}</span></div>`);
        printWindow.document.write(`<div class="row"><span>TAX:</span><span>${formatNaira(order.tax)}</span></div>`);
        printWindow.document.write(`<div class="total-row" style="font-size: 14px; margin-top: 5px;"><span>TOTAL:</span><span>${formatNaira(order.total)}</span></div>`);
        printWindow.document.write('</div>');

        printWindow.document.write('<div class="dashed"></div>');

        // Payment
        printWindow.document.write('<div style="margin-bottom: 10px; text-transform: uppercase; font-weight: bold; font-size: 11px;">');
        printWindow.document.write(`<div class="row"><span>PAYMENT TYPE:</span><span>${order.paymentType}</span></div>`);
        if (order.amountTendered) {
            printWindow.document.write(`<div class="row"><span>TENDERED:</span><span>${formatNaira(order.amountTendered)}</span></div>`);
        }
        if (order.changeAmount !== undefined && order.changeAmount > 0) {
            printWindow.document.write(`<div class="row"><span>CHANGE:</span><span>${formatNaira(order.changeAmount)}</span></div>`);
        }
        printWindow.document.write('</div>');

        printWindow.document.write('<div class="dashed"></div>');
        printWindow.document.write('<div class="dashed"></div>');

        // Footer
        printWindow.document.write('<div class="footer">');
        printWindow.document.write('<p style="margin: 5px 0;">THANK YOU FOR YOUR PATRONAGE!</p>');
        printWindow.document.write('<p style="font-size: 10px; opacity: 0.5; margin-top: 10px;">Powered by Ktcstocks POS + Inventory</p>');
        printWindow.document.write('</div>');

        printWindow.document.write('</body></html>');
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 250);
    };

    // Auto-print when dialog opens
    React.useEffect(() => {
        if (isOpen && order) {
            const timer = setTimeout(() => {
                handlePrint();
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [isOpen, order]);

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader className="flex flex-row items-center justify-between">
                    <DialogTitle>Receipt - {order.orderNumber}</DialogTitle>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onClose}
                        className="h-8 w-8"
                    >
                        <X className="w-4 h-4" />
                    </Button>
                </DialogHeader>

                <div id="receipt-content" className="receipt-preview bg-white p-8 border border-gray-200 rounded-lg">
                    {/* Receipt Header */}
                    <div className="text-center border-b-2 border-gray-300 pb-4 mb-4">
                        <h1 className="text-2xl font-black">Eres Place</h1>
                        <p className="text-sm text-gray-600">111, Irhirhi Road By Ashland Hotel Junction</p>
                        <p className="text-sm text-gray-600">Off Airport road, Benin city</p>
                        <p className="text-sm text-gray-600">Tel: 09060958968</p>
                    </div>

                    {/* Order Info */}
                    <div className="text-sm mb-4 pb-4 border-b border-dashed font-mono">
                        <div className="flex justify-between mb-2">
                            <span className="font-bold">DATE:</span>
                            <span>{new Date(order.createdAt).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between mb-2">
                            <span className="font-bold">ORDER:</span>
                            <span className="font-bold uppercase">{order.orderNumber}</span>
                        </div>
                        <div className="flex justify-between mb-2">
                            <span className="font-bold">CASHIER:</span>
                            <span className="uppercase">{order.user?.name || "System"}</span>
                        </div>
                        {order.customerName && (
                            <div className="flex justify-between mb-2">
                                <span className="font-bold">CUSTOMER:</span>
                                <span className="uppercase">{order.customerName}</span>
                            </div>
                        )}
                        {order.tableNumber && (
                            <div className="flex justify-between">
                                <span className="font-bold">TABLE:</span>
                                <span className="uppercase">{order.tableNumber}</span>
                            </div>
                        )}
                    </div>

                    {/* Items */}
                    <div className="mb-4 pb-4 border-b border-dashed font-mono text-sm">
                        {order.items.map((item: any) => (
                            <div key={item.id} className="flex justify-between mb-3 italic">
                                <div className="flex-1">
                                    <div className="font-semibold">{item.name}</div>
                                    <div className="text-xs text-gray-600">{item.quantity} x {formatNaira(item.price)}</div>
                                </div>
                                <span className="font-bold">{formatNaira(item.subtotal)}</span>
                            </div>
                        ))}
                    </div>

                    {/* Totals */}
                    <div className="mb-4 pb-4 border-b-2 border-black font-mono space-y-1">
                        <div className="flex justify-between text-sm">
                            <span>SUBTOTAL:</span>
                            <span>{formatNaira(order.subtotal)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span>TAX:</span>
                            <span>{formatNaira(order.tax)}</span>
                        </div>
                        <div className="flex justify-between text-lg font-black mt-2 pt-2">
                            <span>TOTAL:</span>
                            <span>{formatNaira(order.total)}</span>
                        </div>
                    </div>

                    {/* Payment */}
                    <div className="mb-4 pb-4 border-b border-dashed font-mono text-sm font-bold uppercase">
                        <div className="flex justify-between mb-1">
                            <span>PAYMENT TYPE:</span>
                            <span>{order.paymentType}</span>
                        </div>
                        {order.amountTendered && (
                            <div className="flex justify-between mb-1">
                                <span>TENDERED:</span>
                                <span>{formatNaira(order.amountTendered)}</span>
                            </div>
                        )}
                        {order.changeAmount !== undefined && order.changeAmount > 0 && (
                            <div className="flex justify-between">
                                <span>CHANGE:</span>
                                <span>{formatNaira(order.changeAmount)}</span>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="text-center font-black font-mono">
                        <p className="text-sm">THANK YOU FOR YOUR PATRONAGE!</p>
                        <p className="text-xs text-gray-400 mt-2">Powered by Ktcstocks POS + Inventory</p>
                    </div>
                </div>

                <div className="flex gap-3 mt-6">
                    <Button
                        onClick={handlePrint}
                        className="flex-1 rounded-lg h-11 bg-brand-500 hover:bg-brand-600 text-white font-bold"
                    >
                        <Printer className="w-4 h-4 mr-2" />
                        Print Again
                    </Button>
                    <Button
                        onClick={onClose}
                        variant="outline"
                        className="flex-1 rounded-lg h-11"
                    >
                        Close
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
