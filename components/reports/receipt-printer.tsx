"use client";

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
        const printContent = document.getElementById("receipt-content");
        if (!printContent) return;

        const printWindow = window.open("", "", "width=800,height=600");
        if (!printWindow) return;

        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <title>Receipt ${order.orderNumber}</title>
                <style>
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    body { font-family: 'Courier New', monospace; width: 80mm; margin: 0 auto; padding: 10px; }
                    .receipt { width: 100%; }
                    .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 10px; }
                    .header h1 { font-size: 18px; font-weight: bold; margin-bottom: 5px; }
                    .header p { font-size: 12px; color: #666; }
                    .order-info { font-size: 11px; margin-bottom: 10px; padding-bottom: 10px; border-bottom: 1px dashed #000; }
                    .order-info div { display: flex; justify-content: space-between; margin-bottom: 3px; }
                    .items { margin-bottom: 10px; padding-bottom: 10px; border-bottom: 1px dashed #000; font-size: 11px; }
                    .item-row { display: flex; justify-content: space-between; margin-bottom: 5px; }
                    .item-desc { flex: 1; }
                    .item-price { text-align: right; min-width: 60px; }
                    .totals { margin-bottom: 10px; padding-bottom: 10px; border-bottom: 2px solid #000; font-size: 12px; }
                    .total-row { display: flex; justify-content: space-between; margin-bottom: 5px; font-weight: bold; }
                    .total-row.grand { font-size: 14px; margin-top: 5px; }
                    .payment-method { text-align: center; font-size: 11px; padding: 10px 0; border-bottom: 1px dashed #000; margin-bottom: 10px; }
                    .footer { text-align: center; font-size: 11px; margin-top: 10px; }
                    .footer p { margin-bottom: 5px; }
                </style>
            </head>
            <body>
                <div class="receipt">
                    <div class="header">
                        <h1>RECEIPT</h1>
                        <p>Transaction Receipt</p>
                    </div>
                    
                    <div class="order-info">
                        <div>
                            <span>Order ID:</span>
                            <span>${order.orderNumber}</span>
                        </div>
                        <div>
                            <span>Date:</span>
                            <span>${new Date(order.createdAt).toLocaleString()}</span>
                        </div>
                        <div>
                            <span>Cashier:</span>
                            <span>${order.user?.name || "System"}</span>
                        </div>
                        ${order.customerName ? `
                        <div>
                            <span>Customer:</span>
                            <span>${order.customerName}</span>
                        </div>
                        ` : ""}
                    </div>
                    
                    <div class="items">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 5px; font-weight: bold; border-bottom: 1px solid #000; padding-bottom: 5px;">
                            <span style="flex: 1;">Item</span>
                            <span style="text-align: center; min-width: 40px;">Qty</span>
                            <span style="text-align: right; min-width: 60px;">Amount</span>
                        </div>
                        ${order.items.map((item: any) => `
                        <div class="item-row">
                            <div class="item-desc">${item.name}</div>
                            <div style="text-align: center; min-width: 40px;">${item.quantity}</div>
                            <div class="item-price">${formatNaira(item.subtotal)}</div>
                        </div>
                        `).join("")}
                    </div>
                    
                    <div class="totals">
                        <div class="total-row">
                            <span>Subtotal:</span>
                            <span>${formatNaira(order.subtotal)}</span>
                        </div>
                        <div class="total-row">
                            <span>Tax:</span>
                            <span>${formatNaira(order.tax)}</span>
                        </div>
                        <div class="total-row grand">
                            <span>TOTAL:</span>
                            <span>${formatNaira(order.total)}</span>
                        </div>
                        ${order.amountTendered ? `
                        <div class="total-row">
                            <span>Amount Paid:</span>
                            <span>${formatNaira(order.amountTendered)}</span>
                        </div>
                        ` : ""}
                        ${order.changeAmount !== undefined && order.changeAmount > 0 ? `
                        <div class="total-row">
                            <span>Change:</span>
                            <span>${formatNaira(order.changeAmount)}</span>
                        </div>
                        ` : ""}
                    </div>
                    
                    <div class="payment-method">
                        Payment Method: <strong>${order.paymentType}</strong>
                    </div>
                    
                    <div class="footer">
                        <p>Thank you for your purchase!</p>
                        <p style="font-size: 10px; margin-top: 10px;">Date: ${new Date().toLocaleString()}</p>
                        <p style="font-size: 10px;">Reprint Receipt</p>
                    </div>
                </div>
            </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.print();
        printWindow.close();
    };

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

                <div id="receipt-content" className="receipt-preview bg-white p-8 border border-gray-200 rounded-lg print:border-none print:p-0">
                    {/* Receipt Header */}
                    <div className="text-center border-b-2 border-black pb-4 mb-4">
                        <h1 className="text-2xl font-black">RECEIPT</h1>
                        <p className="text-gray-600 text-sm">Transaction Receipt</p>
                    </div>

                    {/* Order Info */}
                    <div className="text-sm mb-4 pb-4 border-b border-dashed">
                        <div className="flex justify-between mb-2">
                            <span>Order ID:</span>
                            <span className="font-bold">{order.orderNumber}</span>
                        </div>
                        <div className="flex justify-between mb-2">
                            <span>Date:</span>
                            <span>{new Date(order.createdAt).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between mb-2">
                            <span>Cashier:</span>
                            <span>{order.user?.name || "System"}</span>
                        </div>
                        {order.customerName && (
                            <div className="flex justify-between">
                                <span>Customer:</span>
                                <span>{order.customerName}</span>
                            </div>
                        )}
                    </div>

                    {/* Items */}
                    <div className="mb-4 pb-4 border-b border-dashed">
                        <div className="flex justify-between font-bold mb-2 pb-2 border-b">
                            <span className="flex-1">Item</span>
                            <span className="w-16 text-center">Qty</span>
                            <span className="w-24 text-right">Amount</span>
                        </div>
                        {order.items.map((item: any) => (
                            <div key={item.id} className="flex justify-between text-sm mb-2">
                                <span className="flex-1">{item.name}</span>
                                <span className="w-16 text-center">{item.quantity}</span>
                                <span className="w-24 text-right">{formatNaira(item.subtotal)}</span>
                            </div>
                        ))}
                    </div>

                    {/* Totals */}
                    <div className="mb-4 pb-4 border-b-2 border-black space-y-1">
                        <div className="flex justify-between text-sm">
                            <span>Subtotal:</span>
                            <span>{formatNaira(order.subtotal)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span>Tax:</span>
                            <span>{formatNaira(order.tax)}</span>
                        </div>
                        <div className="flex justify-between text-lg font-black mt-2 pt-2">
                            <span>TOTAL:</span>
                            <span>{formatNaira(order.total)}</span>
                        </div>
                        {order.amountTendered && (
                            <div className="flex justify-between text-sm mt-2 pt-2 border-t">
                                <span>Amount Paid:</span>
                                <span>{formatNaira(order.amountTendered)}</span>
                            </div>
                        )}
                        {order.changeAmount !== undefined && order.changeAmount > 0 && (
                            <div className="flex justify-between text-sm font-bold">
                                <span>Change:</span>
                                <span>{formatNaira(order.changeAmount)}</span>
                            </div>
                        )}
                    </div>

                    {/* Payment Method */}
                    <div className="text-center mb-4 pb-4 border-b border-dashed">
                        <span className="text-sm">Payment Method: </span>
                        <span className="font-bold">{order.paymentType}</span>
                    </div>

                    {/* Footer */}
                    <div className="text-center text-sm">
                        <p className="font-bold mb-2">Thank you for your purchase!</p>
                        <p className="text-xs text-gray-600">Reprint on: {new Date().toLocaleString()}</p>
                    </div>
                </div>

                <div className="flex gap-3 mt-6">
                    <Button
                        onClick={handlePrint}
                        className="flex-1 rounded-lg h-11 bg-brand-500 hover:bg-brand-600 text-white font-bold"
                    >
                        <Printer className="w-4 h-4 mr-2" />
                        Print Receipt
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
