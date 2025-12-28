"use client";

import { useState, useMemo } from "react";
import {
    Filter,
    Download,
    Printer,
    Calendar as CalendarIcon,
    Users,
    TrendingUp,
    Banknote,
    CreditCard,
    ArrowLeft,
    Search,
    ChevronDown,
    BarChart3,
    FileText,
    Package,
    ArrowUpCircle,
    ArrowDownCircle,
    AlertTriangle,
    Eye,
    PieChart
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatNaira } from "@/lib/utils/format";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { ReceiptPrinter } from "@/components/reports/receipt-printer";
import { ProfitByProductChart, PaymentMethodChart, StaffPerformanceChart } from "@/components/reports/charts";

interface ReportsClientProps {
    initialReports: any[];
    staff: any[];
    currentUser: any;
    profitAnalysis?: any;
    staffPerformance?: any;
    inventoryReport?: any;
}

export function ReportsClient({ initialReports, staff, currentUser, profitAnalysis, staffPerformance, inventoryReport }: ReportsClientProps) {
    const [activeTab, setActiveTab] = useState<"sales" | "stock" | "profit" | "staff" | "inventory">("sales");
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedStaff, setSelectedStaff] = useState("all");
    const [selectedPayment, setSelectedPayment] = useState("all");
    const [selectedReceipt, setSelectedReceipt] = useState<any>(null);
    const [showReceiptPrinter, setShowReceiptPrinter] = useState(false);

    // Filter logic for sales
    const filteredReports = useMemo(() => {
        return initialReports.filter(report => {
            const matchesSearch = report.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                report.customerName?.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesStaff = selectedStaff === "all" || report.userId === selectedStaff;
            const matchesPayment = selectedPayment === "all" || report.paymentType === selectedPayment;

            return matchesSearch && matchesStaff && matchesPayment;
        });
    }, [initialReports, searchQuery, selectedStaff, selectedPayment]);

    // Simple flat stock movements for demonstration (In real app, we'd fetch these from DB)
    const stockMovements = useMemo(() => {
        // Mocking movements since they are new, but in real app we'd fetch them
        return [];
    }, []);

    const analytics = useMemo(() => {
        let totalRevenue = 0;
        let totalProfit = 0;
        let cashSales = 0;
        let cardSales = 0;
        let transferSales = 0;

        filteredReports.forEach(r => {
            totalRevenue += Number(r.total);
            totalProfit += Number(r.profit);
            if (r.paymentType === "CASH") cashSales += Number(r.total);
            if (r.paymentType === "CARD") cardSales += Number(r.total);
            if (r.paymentType === "TRANSFER") transferSales += Number(r.total);
        });

        return { totalRevenue, totalProfit, cashSales, cardSales, transferSales, count: filteredReports.length };
    }, [filteredReports]);

    const handleOpenReceipt = (order: any) => {
        setSelectedReceipt(order);
        setShowReceiptPrinter(true);
    };

    const handlePrint = () => {
        window.print();
    };

    // Chart data
    const paymentData = {
        labels: ['Cash', 'Card', 'Transfer'],
        datasets: [
            {
                data: [analytics.cashSales, analytics.cardSales, analytics.transferSales],
                backgroundColor: ['#10b981', '#2563eb', '#7c3aed'],
            },
        ],
    };

    const revenueCostData = profitAnalysis ? {
        labels: ['Revenue', 'Cost', 'Profit'],
        datasets: [
            {
                label: 'Amount',
                data: [profitAnalysis.summary.totalRevenue, profitAnalysis.summary.totalCost, profitAnalysis.summary.totalProfit],
                backgroundColor: ['#2563eb', '#f97316', '#10b981'],
            },
        ],
    } : null;

    const topProductsData = profitAnalysis ? {
        labels: profitAnalysis.byProduct.slice(0, 5).map((p: any) => p.name),
        datasets: [{ data: profitAnalysis.byProduct.slice(0, 5).map((p: any) => p.profit), backgroundColor: ['#10b981', '#34d399', '#60a5fa', '#f59e0b', '#a78bfa'] }]
    } : null;

    return (
        <div className="flex-1 flex flex-col min-h-screen overflow-hidden print:bg-white p-4 md:p-8 space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
                <div className="flex items-center gap-4">
                    <Link href="/">
                        <Button variant="ghost" size="icon" className="rounded-full bg-white shadow-sm border border-gray-100 hover:bg-gray-50">
                            <ArrowLeft className="w-5 h-5 text-gray-600" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                            Reports & Analytics
                            <BarChart3 className="w-8 h-8 text-brand-500" />
                        </h1>
                        <p className="text-gray-500 font-medium mt-1 uppercase tracking-widest text-[10px]">Financial Audit & Stock Tracking</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <Button variant="outline" onClick={handlePrint} className="rounded-2xl h-12 px-6 font-bold border-gray-200 bg-white shadow-sm hover:shadow-md transition-all flex items-center gap-2">
                        <Printer className="w-4 h-4" />
                        Print Report
                    </Button>
                    <Button className="rounded-2xl h-12 px-6 font-black bg-brand-500 hover:bg-brand-600 shadow-lg shadow-brand-500/20 text-white flex items-center gap-2">
                        <Download className="w-4 h-4" />
                        Export Data
                    </Button>
                </div>
            </div>

            {/* Print Header */}
            <div className="hidden print:block text-center border-b-2 border-gray-900 pb-8 mb-8">
                <h1 className="text-4xl font-black uppercase tracking-widest text-gray-900">Official System Report</h1>
                <p className="text-gray-600 mt-2 font-bold">{new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                <p className="text-[10px] text-gray-400 mt-1 italic uppercase tracking-widest">Ktc stocks POS v2.0 Analytics Engine</p>
            </div>

            {/* Analytics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 print:grid-cols-4">
                <AnalyticCard
                    title="Gross Revenue"
                    value={formatNaira(analytics.totalRevenue)}
                    icon={Banknote}
                    color="bg-brand-500"
                    subtitle={`${analytics.count} Total Sales`}
                />
                <AnalyticCard
                    title="Net Profit"
                    value={formatNaira(analytics.totalProfit)}
                    icon={TrendingUp}
                    color="bg-emerald-500"
                    subtitle="Revenue - Cost Price"
                />
                <AnalyticCard
                    title="Cash Position"
                    value={formatNaira(analytics.cashSales)}
                    icon={Banknote}
                    color="bg-blue-500"
                    subtitle="Liquid cash on hand"
                />
                <AnalyticCard
                    title="Staff Efficiency"
                    value={analytics.count > 0 ? (analytics.totalRevenue / analytics.count).toFixed(0) : "0"}
                    icon={Users}
                    color="bg-purple-500"
                    subtitle="Avg Revenue / Sale"
                />
            </div>

            {/* Tabs */}
            <div className="flex items-center p-1 bg-gray-100 rounded-2xl w-fit overflow-x-auto print:hidden">
                <button
                    onClick={() => setActiveTab("sales")}
                    className={cn(
                        "px-4 md:px-6 py-2.5 rounded-xl text-xs md:text-sm font-black transition-all whitespace-nowrap",
                        activeTab === "sales" ? "bg-white text-brand-600 shadow-sm" : "text-gray-500 hover:text-gray-900"
                    )}
                >
                    Sales Activity
                </button>
                <button
                    onClick={() => setActiveTab("profit")}
                    className={cn(
                        "px-4 md:px-6 py-2.5 rounded-xl text-xs md:text-sm font-black transition-all whitespace-nowrap",
                        activeTab === "profit" ? "bg-white text-brand-600 shadow-sm" : "text-gray-500 hover:text-gray-900"
                    )}
                >
                    Profit Analysis
                </button>
                <button
                    onClick={() => setActiveTab("staff")}
                    className={cn(
                        "px-4 md:px-6 py-2.5 rounded-xl text-xs md:text-sm font-black transition-all whitespace-nowrap",
                        activeTab === "staff" ? "bg-white text-brand-600 shadow-sm" : "text-gray-500 hover:text-gray-900"
                    )}
                >
                    Staff Performance
                </button>
                <button
                    onClick={() => setActiveTab("inventory")}
                    className={cn(
                        "px-4 md:px-6 py-2.5 rounded-xl text-xs md:text-sm font-black transition-all whitespace-nowrap",
                        activeTab === "inventory" ? "bg-white text-brand-600 shadow-sm" : "text-gray-500 hover:text-gray-900"
                    )}
                >
                    Inventory
                </button>
                <button
                    onClick={() => setActiveTab("stock")}
                    className={cn(
                        "px-4 md:px-6 py-2.5 rounded-xl text-xs md:text-sm font-black transition-all whitespace-nowrap",
                        activeTab === "stock" ? "bg-white text-brand-600 shadow-sm" : "text-gray-500 hover:text-gray-900"
                    )}
                >
                    Stock Movements
                </button>
            </div>

            {/* Content Area */}
            <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm flex-1 flex flex-col overflow-hidden">
                {activeTab === "sales" ? (
                    <>
                        {/* Filters */}
                        <div className="p-6 border-b border-gray-50 flex flex-col lg:flex-row gap-4 print:hidden">
                            <div className="relative flex-1">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <Input
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search Sale ID, Customer..."
                                    className="h-12 pl-11 rounded-2xl border-gray-100 bg-gray-50/50 focus:bg-white transition-all font-medium"
                                />
                            </div>

                            <div className="flex flex-wrap items-center gap-3">
                                <select
                                    value={selectedStaff}
                                    onChange={(e) => setSelectedStaff(e.target.value)}
                                    className="h-12 px-4 rounded-2xl border border-gray-100 bg-gray-50/50 text-sm font-bold outline-none cursor-pointer"
                                >
                                    <option value="all">Every Staff</option>
                                    {staff.map(s => (
                                        <option key={s.id} value={s.id}>{s.name}</option>
                                    ))}
                                </select>

                                <select
                                    value={selectedPayment}
                                    onChange={(e) => setSelectedPayment(e.target.value)}
                                    className="h-12 px-4 rounded-2xl border border-gray-100 bg-gray-50/50 text-sm font-bold outline-none cursor-pointer"
                                >
                                    <option value="all">All Payments</option>
                                    <option value="CASH">Cash</option>
                                    <option value="CARD">Card</option>
                                    <option value="TRANSFER">Transfer</option>
                                </select>

                                <div className="flex items-center gap-2 bg-gray-50/50 p-1.5 rounded-2xl border border-gray-100">
                                    <Input type="date" className="h-9 border-none bg-transparent font-bold text-xs w-32" />
                                    <span className="text-gray-400 font-bold px-1">to</span>
                                    <Input type="date" className="h-9 border-none bg-transparent font-bold text-xs w-32" />
                                </div>
                            </div>
                        </div>

                        {/* Table */}
                        {/* Sales Overview Charts */}
                        <div className="p-6 border-b border-gray-50 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 print:hidden">
                            {/* Payment Methods Breakdown */}
                            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200">
                                <h4 className="text-sm font-black text-gray-900 mb-3">Payment Breakdown</h4>
                                <div className="space-y-2 text-xs">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                            <span>Cash</span>
                                        </div>
                                        <span className="font-bold">{formatNaira(analytics.cashSales)}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                            <span>Card</span>
                                        </div>
                                        <span className="font-bold">{formatNaira(analytics.cardSales)}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                                            <span>Transfer</span>
                                        </div>
                                        <span className="font-bold">{formatNaira(analytics.transferSales)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Interactive Payment Chart */}
                            <div className="bg-white p-6 rounded-xl border border-gray-200 print:hidden">
                                <h4 className="text-sm font-black text-gray-900 mb-4">Payment Method Distribution</h4>
                                <PaymentMethodChart
                                    cashSales={analytics.cashSales}
                                    cardSales={analytics.cardSales}
                                    transferSales={analytics.transferSales}
                                />
                            </div>
                            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 p-4 rounded-xl border border-emerald-200">
                                <h4 className="text-sm font-black text-gray-900 mb-3">Profit Snapshot</h4>
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs font-bold">Revenue</span>
                                        <span className="font-black text-sm text-brand-600">{formatNaira(analytics.totalRevenue)}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs font-bold">Profit</span>
                                        <span className="font-black text-sm text-emerald-600">{formatNaira(analytics.totalProfit)}</span>
                                    </div>
                                    <div className="w-full bg-white rounded-full h-3 overflow-hidden mt-2">
                                        <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${analytics.totalRevenue > 0 ? (analytics.totalProfit / analytics.totalRevenue) * 100 : 0}%` }}></div>
                                    </div>
                                    <span className="text-xs text-gray-600 block mt-1">
                                        Margin: {analytics.totalRevenue > 0 ? ((analytics.totalProfit / analytics.totalRevenue) * 100).toFixed(1) : 0}%
                                    </span>
                                </div>
                            </div>

                            {/* Sales Count */}
                            <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl border border-purple-200">
                                <h4 className="text-sm font-black text-gray-900 mb-3">Performance</h4>
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <span className="text-xs font-bold">Total Sales</span>
                                        <span className="font-black text-lg text-purple-600">{analytics.count}</span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                        <span>Avg per Sale</span>
                                        <span className="font-bold">{formatNaira(analytics.totalRevenue / Math.max(analytics.count, 1))}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Table */}
                        <div className="flex-1 overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-gray-50/50">
                                        <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Sale ID</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Product Info</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Revenue</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Profit</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Entity</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Method</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right print:hidden">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {filteredReports.map((report) => (
                                        <tr key={report.id} className="hover:bg-gray-50/20 transition-colors group">
                                            <td className="px-8 py-5 font-black text-gray-900 text-sm">{report.orderNumber}</td>
                                            <td className="px-8 py-5">
                                                <div className="flex flex-col gap-1 max-w-[250px]">
                                                    <span className="text-sm font-bold text-gray-900 truncate">
                                                        {report.items[0]?.name} {report.items.length > 1 ? `+ ${report.items.length - 1} more` : ""}
                                                    </span>
                                                    <span className="text-[10px] text-gray-400 font-medium">
                                                        {new Date(report.createdAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5 text-sm font-black text-brand-600">{formatNaira(report.total)}</td>
                                            <td className="px-8 py-5 text-sm font-black text-emerald-600">{formatNaira(report.profit)}</td>
                                            <td className="px-8 py-5">
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-bold text-gray-700">{report.user?.name || "System"}</span>
                                                    <span className="text-[10px] font-medium text-gray-400">{report.customerName || "Walk-in Customer"}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5 text-right">
                                                <span className="inline-block px-3 py-1.5 rounded-full text-[10px] font-black bg-gray-100 text-gray-500 uppercase tracking-widest">
                                                    {report.paymentType}
                                                </span>
                                            </td>
                                            <td className="px-8 py-5 text-right print:hidden">
                                                <button
                                                    onClick={() => handleOpenReceipt(report)}
                                                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold bg-brand-50 text-brand-600 hover:bg-brand-100 transition-all"
                                                >
                                                    <Eye className="w-3 h-3" />
                                                    Receipt
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredReports.length === 0 && (
                                        <tr>
                                            <td colSpan={6} className="py-24 text-center">
                                                <h3 className="text-lg font-bold text-gray-900">No Sales Captured</h3>
                                                <p className="text-gray-400 text-sm">Refine your filters to see results</p>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </>
                ) : activeTab === "profit" ? (
                    <div className="flex-1 flex flex-col">
                        <div className="p-6 border-b border-gray-50">
                            <h3 className="text-lg font-black text-gray-900">Profit Analysis Report</h3>
                            <p className="text-sm text-gray-400 mt-1">Selling Price - Cost Price breakdown by product</p>
                        </div>
                        {profitAnalysis ? (
                            <div className="flex-1 overflow-x-auto">
                                <div className="p-6 space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                        <AnalyticCard
                                            title="Total Revenue"
                                            value={formatNaira(profitAnalysis.summary.totalRevenue)}
                                            icon={Banknote}
                                            color="bg-blue-500"
                                            subtitle={`${profitAnalysis.summary.orderCount} orders`}
                                        />
                                        <AnalyticCard
                                            title="Total Cost"
                                            value={formatNaira(profitAnalysis.summary.totalCost)}
                                            icon={Package}
                                            color="bg-orange-500"
                                            subtitle="COGS"
                                        />
                                        <AnalyticCard
                                            title="Net Profit"
                                            value={formatNaira(profitAnalysis.summary.totalProfit)}
                                            icon={TrendingUp}
                                            color="bg-emerald-500"
                                            subtitle={`${profitAnalysis.summary.profitMargin}% margin`}
                                        />
                                        <AnalyticCard
                                            title="Profit Margin"
                                            value={`${profitAnalysis.summary.profitMargin}%`}
                                            icon={BarChart3}
                                            color="bg-brand-500"
                                            subtitle="Overall profitability"
                                        />
                                    </div>

                                    {/* Charts Section */}
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                        {/* Profit by Product Chart */}
                                        <div className="bg-white p-6 rounded-2xl border border-gray-200">
                                            <h4 className="font-black text-gray-900 mb-4">Top Products by Profit</h4>
                                            <ProfitByProductChart data={profitAnalysis.byProduct} />
                                        </div>

                                        {/* Revenue vs Cost Chart */}
                                        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-2xl border border-blue-200">
                                            <h4 className="font-black text-gray-900 mb-4">Revenue vs Cost Analysis</h4>
                                            <div className="space-y-3">
                                                <div>
                                                    <div className="flex justify-between mb-1 text-sm">
                                                        <span className="font-bold">Revenue</span>
                                                        <span className="font-black text-blue-600">{formatNaira(profitAnalysis.summary.totalRevenue)}</span>
                                                    </div>
                                                    <div className="w-full bg-white rounded-full h-4 overflow-hidden">
                                                        <div className="bg-blue-500 h-full rounded-full" style={{ width: '100%' }}></div>
                                                    </div>
                                                </div>
                                                <div>
                                                    <div className="flex justify-between mb-1 text-sm">
                                                        <span className="font-bold">Cost</span>
                                                        <span className="font-black text-orange-600">{formatNaira(profitAnalysis.summary.totalCost)}</span>
                                                    </div>
                                                    <div className="w-full bg-white rounded-full h-4 overflow-hidden">
                                                        <div className="bg-orange-500 h-full rounded-full" style={{ width: `${(profitAnalysis.summary.totalCost / profitAnalysis.summary.totalRevenue) * 100}%` }}></div>
                                                    </div>
                                                </div>
                                                <div>
                                                    <div className="flex justify-between mb-1 text-sm">
                                                        <span className="font-bold">Profit</span>
                                                        <span className="font-black text-emerald-600">{formatNaira(profitAnalysis.summary.totalProfit)}</span>
                                                    </div>
                                                    <div className="w-full bg-white rounded-full h-4 overflow-hidden">
                                                        <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${(profitAnalysis.summary.totalProfit / profitAnalysis.summary.totalRevenue) * 100}%` }}></div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Top Products by Profit */}
                                        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 p-6 rounded-2xl border border-emerald-200">
                                            <h4 className="font-black text-gray-900 mb-4">Top Products by Profit</h4>
                                            <div className="space-y-2">
                                                {profitAnalysis.byProduct.slice(0, 5).map((product: any) => (
                                                    <div key={product.name} className="flex items-center gap-3">
                                                        <div className="flex-1">
                                                            <div className="flex justify-between mb-1 text-xs">
                                                                <span className="font-bold truncate">{product.name}</span>
                                                                <span className="font-black text-emerald-600">{formatNaira(product.profit)}</span>
                                                            </div>
                                                            <div className="w-full bg-white rounded-full h-3 overflow-hidden">
                                                                <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${Math.min((product.profit / profitAnalysis.byProduct[0].profit) * 100, 100)}%` }}></div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Profit Margin by Product Table */}
                                    <div className="overflow-x-auto">
                                        <h4 className="font-black text-gray-900 mb-4">Detailed Profit by Product</h4>
                                        <table className="w-full text-left">
                                            <thead>
                                                <tr className="bg-gray-50/50">
                                                    <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Product</th>
                                                    <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Qty Sold</th>
                                                    <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Revenue</th>
                                                    <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Cost</th>
                                                    <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Net Profit</th>
                                                    <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Margin</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-50">
                                                {profitAnalysis.byProduct.map((product: any) => (
                                                    <tr key={product.name} className="hover:bg-gray-50/20">
                                                        <td className="px-6 py-4 font-bold text-gray-900">{product.name}</td>
                                                        <td className="px-6 py-4 text-sm font-bold text-gray-600">{product.quantity}</td>
                                                        <td className="px-6 py-4 text-sm font-black text-blue-600">{formatNaira(product.revenue)}</td>
                                                        <td className="px-6 py-4 text-sm font-black text-orange-600">{formatNaira(product.cost)}</td>
                                                        <td className="px-6 py-4 text-sm font-black text-emerald-600">{formatNaira(product.profit)}</td>
                                                        <td className="px-6 py-4 text-sm font-black">{product.profitMargin}%</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex-1 flex items-center justify-center text-gray-400">No profit data available</div>
                        )}
                    </div>
                ) : activeTab === "staff" ? (
                    <div className="flex-1 flex flex-col">
                        <div className="p-6 border-b border-gray-50">
                            <h3 className="text-lg font-black text-gray-900">Staff Performance Report</h3>
                            <p className="text-sm text-gray-400 mt-1">Individual staff member sales and profit metrics</p>
                        </div>
                        {staffPerformance ? (
                            <div className="flex-1 overflow-x-auto">
                                <div className="p-6 space-y-6">
                                    {/* Staff Performance Chart */}
                                    <div className="bg-white p-6 rounded-2xl border border-gray-200 print:hidden">
                                        <h4 className="text-lg font-black text-gray-900 mb-4">Staff Performance Comparison</h4>
                                        <StaffPerformanceChart data={staffPerformance.staffPerformance} />
                                    </div>

                                    {/* Staff Table */}
                                    <table className="w-full">
                                        <thead>
                                            <tr className="bg-gray-50/50">
                                                <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Staff Member</th>
                                                <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Orders</th>
                                                <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Total Revenue</th>
                                                <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Total Profit</th>
                                                <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Avg Order Value</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {staffPerformance.staffPerformance.map((staff: any) => (
                                                <tr key={staff.name} className="hover:bg-gray-50/20">
                                                    <td className="px-6 py-4 font-bold text-gray-900">{staff.name}</td>
                                                    <td className="px-6 py-4 text-sm font-bold text-gray-600">{staff.orderCount}</td>
                                                    <td className="px-6 py-4 text-sm font-black text-brand-600">{formatNaira(staff.revenue)}</td>
                                                    <td className="px-6 py-4 text-sm font-black text-emerald-600">{formatNaira(staff.profit)}</td>
                                                    <td className="px-6 py-4 text-sm font-bold text-gray-600">₦{staff.avgOrderValue}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ) : (
                            <div className="flex-1 flex items-center justify-center text-gray-400">No staff data available</div>
                        )}
                    </div>
                ) : activeTab === "inventory" ? (
                    <div className="flex-1 flex flex-col">
                        <div className="p-6 border-b border-gray-50">
                            <h3 className="text-lg font-black text-gray-900">Inventory Report</h3>
                            <p className="text-sm text-gray-400 mt-1">Current stock levels and inventory valuation</p>
                        </div>
                        {inventoryReport ? (
                            <div className="flex-1 overflow-x-auto">
                                <div className="p-6">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                                        <AnalyticCard
                                            title="Total Items"
                                            value={inventoryReport.summary.totalItems}
                                            icon={Package}
                                            color="bg-blue-500"
                                            subtitle="SKU count"
                                        />
                                        <AnalyticCard
                                            title="Inventory Value"
                                            value={formatNaira(inventoryReport.summary.totalValue)}
                                            icon={Banknote}
                                            color="bg-brand-500"
                                            subtitle="Total cost value"
                                        />
                                        <AnalyticCard
                                            title="Low Stock Items"
                                            value={inventoryReport.summary.lowStockCount}
                                            icon={AlertTriangle}
                                            color="bg-orange-500"
                                            subtitle="Need replenishment"
                                        />
                                    </div>
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="bg-gray-50/50">
                                                <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Product</th>
                                                <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">SKU</th>
                                                <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Category</th>
                                                <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Current Stock</th>
                                                <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Value</th>
                                                <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {inventoryReport.items.map((item: any) => (
                                                <tr key={item.id} className="hover:bg-gray-50/20">
                                                    <td className="px-6 py-4 font-bold text-gray-900">{item.name}</td>
                                                    <td className="px-6 py-4 text-sm font-bold text-gray-600">{item.sku || "N/A"}</td>
                                                    <td className="px-6 py-4 text-sm font-bold text-gray-600">{item.category}</td>
                                                    <td className="px-6 py-4 text-sm font-bold text-gray-600">{item.currentStock} {item.stockUnit || 'units'}</td>
                                                    <td className="px-6 py-4 text-sm font-black text-brand-600">{formatNaira(item.value)}</td>
                                                    <td className="px-6 py-4">
                                                        <span className={cn("inline-block px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest", item.status === "Low" ? "text-orange-600 bg-orange-50" : "text-green-600 bg-green-50")}>
                                                            {item.status}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ) : (
                            <div className="flex-1 flex items-center justify-center text-gray-400">No inventory data available</div>
                        )}
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center p-12 text-center h-[500px]">
                        <div className="w-20 h-20 bg-brand-50 rounded-full flex items-center justify-center mb-6">
                            <Package className="w-10 h-10 text-brand-500" />
                        </div>
                        <h2 className="text-2xl font-black text-gray-900 mb-2">Inventory Audit Trail</h2>
                        <p className="text-gray-500 max-w-sm font-medium">
                            Starting from now, all stock updates, additions, and sales removals will be logged here with timestamps and staff ID.
                        </p>
                        <Button className="mt-8 rounded-2xl h-12 px-8 font-black bg-gray-900 text-white shadow-xl hover:bg-gray-800">
                            Configure Audit Logs
                        </Button>
                    </div>
                )}
            </div>

            {/* Receipt Printer Modal */}
            <ReceiptPrinter
                isOpen={showReceiptPrinter}
                onClose={() => setShowReceiptPrinter(false)}
                order={selectedReceipt}
            />
        </div>
    );
}

function AnalyticCard({title, value, icon: Icon, color, subtitle }: any) {
    return (
        <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm relative overflow-hidden group hover:shadow-xl transition-all duration-300">
            <div className={cn("absolute top-0 right-0 w-32 h-32 opacity-[0.03] -mr-8 -mt-8 rounded-full", color)} />
            <div className="relative z-10 flex flex-col h-full">
                <div className={cn("inline-flex p-3 rounded-2xl mb-6 w-fit", color)}>
                    <Icon className="w-6 h-6 text-white" />
                </div>
                <p className="text-gray-500 text-[10px] font-black mb-1 uppercase tracking-widest">{title}</p>
                <h3 className="text-3xl font-black text-gray-900 tracking-tight leading-tight mb-2 truncate">{value}</h3>
                <p className="text-[10px] text-gray-400 font-bold flex items-center gap-1.5 uppercase tracking-tight">
                    {subtitle}
                </p>
            </div>
        </div>
    );
}