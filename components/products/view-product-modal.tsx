"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { formatNaira } from "@/lib/utils/format";
import {
    Package,
    Tag,
    Layers,
    Info,
    Calendar,
    AlertTriangle,
    CheckCircle2,
    XCircle,
    Printer,
    TrendingUp
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";

interface ViewProductModalProps {
    isOpen: boolean;
    onClose: () => void;
    onUpdateStock: (product: any) => void;
    product: any;
}

export function ViewProductModal({ isOpen, onClose, onUpdateStock, product }: ViewProductModalProps) {
    if (!product) return null;

    const handlePrint = () => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        printWindow.document.write(`
            <html>
                <head>
                    <title>Product Details - ${product.name}</title>
                    <style>
                        body { font-family: sans-serif; padding: 40px; }
                        h1 { color: #111827; margin-bottom: 24px; }
                        .detail { margin-bottom: 12px; display: flex; border-bottom: 1px solid #f3f4f6; padding-bottom: 8px; }
                        .label { width: 200px; color: #6b7280; font-weight: bold; text-transform: uppercase; font-size: 12px; }
                        .value { color: #111827; font-weight: bold; }
                    </style>
                </head>
                <body>
                    <h1>${product.name}</h1>
                    <div class="detail"><span class="label">SKU</span><span class="value">${product.sku || 'N/A'}</span></div>
                    <div class="detail"><span class="label">Category</span><span class="value">${product.category?.name || 'Uncategorized'}</span></div>
                    <div class="detail"><span class="label">Price</span><span class="value">${formatNaira(product.price)}</span></div>
                    <div class="detail"><span class="label">Stock</span><span class="value">${product.stock} ${product.stockUnit || 'pcs'}</span></div>
                    <div class="detail"><span class="label">Status</span><span class="value">${product.status ? 'Active' : 'Inactive'}</span></div>
                    <script>window.print();window.close();</script>
                </body>
            </html>
        `);
        printWindow.document.close();
    };

    const details = [
        { label: "SKU / Barcode", value: product.sku || "N/A", icon: Tag },
        { label: "Category", value: product.category?.name || "Uncategorized", icon: Layers },
        { label: "Selling Price", value: formatNaira(product.price), icon: Info, highlight: true },
        { label: "Cost Price", value: formatNaira(product.costPrice || 0), icon: Info },
        {
            label: "Current Stock", value: `${product.stock} ${product.stockUnit || 'pcs'}`, icon: Package,
            status: product.stock <= (product.lowStockAlert || 0) ? "warning" : "success"
        },
        { label: "Low Stock Alert", value: `${product.lowStockAlert || 0} ${product.stockUnit || 'pcs'}`, icon: AlertTriangle },
        { label: "Tax Rate", value: `${product.taxRate}% (${product.taxInclusive ? 'Inclusive' : 'Exclusive'})`, icon: Info },
        { label: "Discountable", value: product.discountable ? "Yes" : "No", icon: CheckCircle2 },
        { label: "Perishable", value: product.expiryTracking ? "Yes" : "No", icon: Calendar },
        { label: "Seasonal", value: product.isSeasonal ? "Yes" : "No", icon: Calendar },
    ];

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl p-0 overflow-hidden bg-white rounded-[40px] border-none shadow-2xl">
                <div className="relative h-48 bg-gradient-to-br from-brand-600 to-brand-400 flex items-end p-8">
                    <div className="absolute top-6 right-6 flex gap-2">
                        <button
                            onClick={handlePrint}
                            className="bg-white/20 hover:bg-white/30 p-2 rounded-2xl text-white transition-colors"
                            title="Print Details"
                        >
                            <Printer className="w-6 h-6" />
                        </button>
                        <button
                            onClick={onClose}
                            className="bg-white/20 hover:bg-white/30 p-2 rounded-2xl text-white transition-colors"
                        >
                            <XCircle className="w-6 h-6" />
                        </button>
                    </div>
                    <div className="flex items-center gap-6">
                        <div
                            className="w-24 h-24 rounded-[32px] bg-white shadow-xl flex items-center justify-center text-4xl font-black"
                            style={{ color: product.displayColor || "#3b82f6" }}
                        >
                            {product.name.charAt(0)}
                        </div>
                        <div className="text-white">
                            <DialogHeader>
                                <DialogTitle className="text-3xl font-black tracking-tight text-white">{product.name}</DialogTitle>
                            </DialogHeader>
                            <p className="text-white/80 font-bold uppercase tracking-widest text-xs mt-1">Product Details</p>
                        </div>
                    </div>
                </div>

                <div className="p-8 space-y-8">
                    <div className="flex gap-4">
                        <Button
                            onClick={() => {
                                onClose();
                                setTimeout(() => onUpdateStock(product), 100);
                            }}
                            className="flex-1 h-14 rounded-2xl font-black bg-brand-500 hover:bg-brand-600 shadow-xl shadow-brand-200 gap-2"
                        >
                            <TrendingUp className="w-5 h-5" />
                            Update Inventory Stock
                        </Button>
                        <Button
                            variant="outline"
                            onClick={handlePrint}
                            className="h-14 px-8 rounded-2xl font-bold border-2 border-gray-100 hover:border-brand-500 hover:text-brand-600 transition-all gap-2"
                        >
                            <Printer className="w-5 h-5" />
                            Print Label
                        </Button>
                    </div>

                    {product.description && (
                        <div className="bg-gray-50 rounded-3xl p-6 border border-gray-100">
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Description</h4>
                            <p className="text-gray-600 font-medium leading-relaxed">{product.description}</p>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        {details.map((item, idx) => (
                            <div key={idx} className={cn(
                                "p-5 rounded-3xl border transition-all duration-300",
                                item.highlight ? "bg-brand-50 border-brand-100" :
                                    item.status === "warning" ? "bg-red-50 border-red-100" :
                                        "bg-white border-gray-100 hover:border-brand-200"
                            )}>
                                <div className="flex items-center gap-3 mb-2">
                                    <div className={cn(
                                        "w-8 h-8 rounded-xl flex items-center justify-center",
                                        item.highlight ? "bg-brand-500 text-white" :
                                            item.status === "warning" ? "bg-red-500 text-white" :
                                                "bg-gray-100 text-gray-500"
                                    )}>
                                        <item.icon className="w-4 h-4" />
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">{item.label}</span>
                                </div>
                                <p className={cn(
                                    "font-black text-lg",
                                    item.highlight ? "text-brand-600" :
                                        item.status === "warning" ? "text-red-600" :
                                            "text-gray-900"
                                )}>
                                    {item.value}
                                </p>
                            </div>
                        ))}
                    </div>

                    <div className="pt-4 border-t border-gray-50 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className={cn(
                                "w-3 h-3 rounded-full",
                                product.status ? "bg-green-500" : "bg-gray-300"
                            )} />
                            <span className="text-sm font-bold text-gray-500">
                                Status: {product.status ? "Active" : "Inactive"}
                            </span>
                        </div>
                        <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">
                            ID: {product.id}
                        </p>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
