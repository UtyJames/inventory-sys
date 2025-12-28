"use client";

import { useState } from "react";
import {
    Package,
    AlertTriangle,
    Printer,
    History,
    ArrowUpRight,
    CheckCircle2,
    Clock
} from "lucide-react";
import { formatNaira, formatNumber } from "@/lib/utils/format";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface StockDataCenterProps {
    products: any[];
    onUpdateStock: (product: any) => void;
}

export function StockDataCenter({ products, onUpdateStock }: StockDataCenterProps) {
    const [subView, setSubView] = useState<"low-stock" | "recent">("low-stock");

    // Filter products
    const lowStockProducts = products.filter(p => p.stock <= (p.lowStockAlert || 0));
    const recentAdditions = [...products].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 10);

    const handlePrintLowStock = () => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        printWindow.document.write(`
            <html>
                <head>
                    <title>Low Stock Report - ${new Date().toLocaleDateString()}</title>
                    <style>
                        body { font-family: sans-serif; padding: 40px; }
                        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                        th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
                        th { background-color: #f3f4f6; }
                        .warning { color: #dc2626; font-weight: bold; }
                        h1 { color: #111827; }
                    </style>
                </head>
                <body>
                    <h1>Low Stock Inventory Report</h1>
                    <p>Generated on: ${new Date().toLocaleString()}</p>
                    <table>
                        <thead>
                            <tr>
                                <th>Product Name</th>
                                <th>Category</th>
                                <th>Current Stock</th>
                                <th>Alert Level</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${lowStockProducts.map(p => `
                                <tr>
                                    <td>${p.name}</td>
                                    <td>${p.category?.name || 'Uncategorized'}</td>
                                    <td class="warning">${p.stock} ${p.stockUnit || 'pcs'}</td>
                                    <td>${p.lowStockAlert || 0} ${p.stockUnit || 'pcs'}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                    <script>window.print();window.close();</script>
                </body>
            </html>
        `);
        printWindow.document.close();
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Low Stock Items</p>
                        <h3 className="text-3xl font-black text-red-600">{lowStockProducts.length}</h3>
                    </div>
                    <div className="w-14 h-14 rounded-3xl bg-red-50 flex items-center justify-center text-red-500">
                        <AlertTriangle className="w-8 h-8" />
                    </div>
                </div>

                <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Total Inventory Value</p>
                        <h3 className="text-3xl font-black text-brand-600">
                            {formatNaira(products.reduce((acc, p) => acc + (p.stock * p.price), 0))}
                        </h3>
                    </div>
                    <div className="w-14 h-14 rounded-3xl bg-brand-50 flex items-center justify-center text-brand-500">
                        <ArrowUpRight className="w-8 h-8" />
                    </div>
                </div>

                <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Recent Updates</p>
                        <h3 className="text-3xl font-black text-gray-900">Today</h3>
                    </div>
                    <div className="w-14 h-14 rounded-3xl bg-gray-50 flex items-center justify-center text-gray-500">
                        <History className="w-8 h-8" />
                    </div>
                </div>
            </div>

            {/* Navigation & Actions */}
            <div className="bg-white p-4 rounded-[32px] border border-gray-100 shadow-sm flex items-center justify-between">
                <div className="flex gap-2">
                    <button
                        onClick={() => setSubView("low-stock")}
                        className={cn(
                            "px-6 py-3 rounded-2xl font-black text-sm transition-all",
                            subView === "low-stock" ? "bg-red-50 text-red-600" : "text-gray-400 hover:text-gray-600"
                        )}
                    >
                        Low Stock Alerts
                    </button>
                    <button
                        onClick={() => setSubView("recent")}
                        className={cn(
                            "px-6 py-3 rounded-2xl font-black text-sm transition-all",
                            subView === "recent" ? "bg-brand-50 text-brand-600" : "text-gray-400 hover:text-gray-600"
                        )}
                    >
                        Recently Added
                    </button>
                </div>
                {subView === "low-stock" && lowStockProducts.length > 0 && (
                    <Button
                        onClick={handlePrintLowStock}
                        variant="outline"
                        className="rounded-2xl h-12 px-6 font-bold border-gray-200 gap-2"
                    >
                        <Printer className="w-4 h-4" />
                        Print Report
                    </Button>
                )}
            </div>

            {/* Content Table */}
            <div className="bg-white rounded-[40px] border border-gray-100 shadow-sm overflow-hidden">
                {subView === "low-stock" ? (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-gray-50/50 border-b border-gray-100">
                                    <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Product</th>
                                    <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Stock Level</th>
                                    <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Alert Threshold</th>
                                    <th className="px-8 py-5 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {lowStockProducts.map(product => (
                                    <tr key={product.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div
                                                    className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-white"
                                                    style={{ backgroundColor: product.displayColor || "#3b82f6" }}
                                                >
                                                    {product.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-extrabold text-gray-900">{product.name}</p>
                                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{product.category?.name}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex flex-col">
                                                <span className={cn(
                                                    "font-black text-lg",
                                                    product.stock <= 0 ? "text-red-600" : "text-orange-600"
                                                )}>
                                                    {formatNumber(product.stock)} {product.stockUnit || 'pcs'}
                                                </span>
                                                <span className="text-[10px] font-bold text-gray-300 uppercase tracking-wider">Remaining</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className="font-bold text-gray-500 bg-gray-100 px-3 py-1 rounded-full text-xs">
                                                Alert at {product.lowStockAlert} {product.stockUnit || 'pcs'}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <Button
                                                onClick={() => onUpdateStock(product)}
                                                className="bg-brand-50 text-brand-600 hover:bg-brand-600 hover:text-white rounded-xl font-bold text-xs h-10 border-none transition-all shadow-none"
                                            >
                                                Replenish Stock
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                                {lowStockProducts.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="px-8 py-20 text-center">
                                            <div className="flex flex-col items-center gap-3">
                                                <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center text-green-500">
                                                    <CheckCircle2 className="w-8 h-8" />
                                                </div>
                                                <p className="font-black text-gray-900 text-xl">Inventory Levels Healthy</p>
                                                <p className="text-gray-400 font-medium max-w-xs mx-auto">All of your products have stock levels above their alert thresholds.</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-gray-50/50 border-b border-gray-100">
                                    <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Newly Added Product</th>
                                    <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Added Date</th>
                                    <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Starting Price</th>
                                    <th className="px-8 py-5 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Initial Stock</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {recentAdditions.map(product => (
                                    <tr key={product.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div
                                                    className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-white"
                                                    style={{ backgroundColor: product.displayColor || "#3b82f6" }}
                                                >
                                                    {product.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-extrabold text-gray-900">{product.name}</p>
                                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{product.category?.name}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-2 text-gray-500 font-bold">
                                                <Clock className="w-4 h-4 text-gray-300" />
                                                {new Date(product.createdAt).toLocaleDateString()}
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className="font-black text-brand-600 text-lg">
                                                {formatNaira(product.price)}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6 text-right font-black text-gray-900">
                                            {formatNumber(product.initialStock)} {product.stockUnit || 'units'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
