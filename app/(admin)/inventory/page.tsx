import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function DashboardPage() {
    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        Restaurant Overview
                        <span className="h-2.5 w-2.5 rounded-full bg-brand-500 animate-pulse"></span>
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">Tuesday, Oct 24 • 12:45 PM</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" className="bg-white">
                        Reservations
                    </Button>
                    <Button className="bg-brand-500 hover:bg-brand-600 gap-2">
                        <Plus className="h-4 w-4" />
                        New Order
                    </Button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: "Today's Revenue", value: "$1,240.50", sub: "+12% vs yesterday", trend: "up" },
                    { label: "Active Orders", value: "8", sub: "2 ready for pickup", trend: "neutral" },
                    { label: "Table Occupancy", value: "12 / 20", sub: "60% capacity", trend: "up", progress: 60 },
                    { label: "Low Stock Alerts", value: "3", sub: "Needs attention", trend: "down", alert: true },
                ].map((card, i) => (
                    <div key={i} className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
                        <div className="flex justify-between items-start mb-4">
                            <p className="text-gray-500 text-sm font-medium">{card.label}</p>
                            {card.alert && <div className="text-amber-500 bg-amber-50 p-1.5 rounded-md"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg></div>}
                        </div>
                        <div className="flex items-end justify-between">
                            <div>
                                <h3 className="text-2xl font-bold text-gray-900 mb-1">{card.value}</h3>
                                <p className={`text-xs font-medium ${card.alert ? 'text-amber-600' : card.trend === 'up' ? 'text-brand-600' : 'text-gray-500'}`}>
                                    {card.sub}
                                </p>
                            </div>
                        </div>
                        {card.progress && (
                            <div className="mt-4 h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                                <div className="h-full bg-brand-500 rounded-full" style={{ width: `${card.progress}%` }}></div>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Chart Section (Placeholder for now) */}
                <div className="lg:col-span-2 bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-lg font-bold text-gray-900">Hourly Sales Performance</h3>
                            <p className="text-sm text-gray-500">Visualizing demand peaks today</p>
                        </div>
                        <select className="bg-gray-50 border-0 rounded-lg text-sm font-medium text-gray-900 focus:ring-0">
                            <option>Today</option>
                        </select>
                    </div>
                    <div className="h-64 flex items-end justify-center space-x-2 pb-4">
                        {/* Visual Placeholder for the chart */}
                        <div className="w-full h-full bg-gradient-to-b from-brand-50/50 to-transparent rounded-lg border-b border-brand-100 relative overflow-hidden">
                            <svg viewBox="0 0 400 100" className="w-full h-full text-brand-500 drop-shadow-sm" preserveAspectRatio="none">
                                <path stroke="currentColor" strokeWidth="2" fill="none" d="M0 80 C 40 70, 80 80, 120 40 S 160 50, 200 20 S 240 60, 280 50 S 320 30, 360 40 L 400 30" />
                                <circle cx="200" cy="20" r="4" fill="currentColor" />
                            </svg>
                        </div>
                    </div>
                </div>

                {/* Popular Items */}
                <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
                    <h3 className="text-lg font-bold text-gray-900 mb-6">Popular Items</h3>
                    <div className="space-y-6">
                        {[
                            { name: "Classic Cheeseburger", sales: "42 orders", price: "$12.50", bg: "bg-orange-100" },
                            { name: "Caesar Salad", sales: "28 orders", price: "$9.00", bg: "bg-green-100" },
                            { name: "Pasta Carbonara", sales: "19 orders", price: "$14.00", bg: "bg-yellow-100" },
                            { name: "Fried Chicken", sales: "15 orders", price: "$11.50", bg: "bg-red-100" },
                        ].map((item) => (
                            <div key={item.name} className="flex items-center gap-4">
                                <div className={`h-12 w-12 rounded-lg ${item.bg} flex-shrink-0`}></div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-sm font-bold text-gray-900 truncate">{item.name}</h4>
                                    <p className="text-xs text-gray-500">{item.sales} today</p>
                                </div>
                                <span className="text-sm font-bold text-gray-900">{item.price}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Active Orders Table */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="text-lg font-bold text-gray-900">Active Orders</h3>
                    <button className="text-sm font-semibold text-brand-600 hover:text-brand-700">View All</button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-500 uppercase text-xs font-semibold">
                            <tr>
                                <th className="px-6 py-3">Order ID</th>
                                <th className="px-6 py-3">Table</th>
                                <th className="px-6 py-3">Items</th>
                                <th className="px-6 py-3">Status</th>
                                <th className="px-6 py-3">Time</th>
                                <th className="px-6 py-3">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {[
                                { id: "#4201", table: "T-04", items: "2x Burger, 1x Fries", status: "Ready", statusColor: "bg-emerald-100 text-emerald-700", time: "12 min" },
                                { id: "#4202", table: "T-08", items: "1x Pasta, 1x Coke", status: "Cooking", statusColor: "bg-amber-100 text-amber-700", time: "8 min" },
                                { id: "#4203", table: "T-02", items: "1x Salad, 1x Water", status: "New", statusColor: "bg-blue-100 text-blue-700", time: "2 min" },
                            ].map((order) => (
                                <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 font-bold text-gray-900">{order.id}</td>
                                    <td className="px-6 py-4 text-gray-600">{order.table}</td>
                                    <td className="px-6 py-4 text-gray-900">{order.items}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${order.statusColor}`}>
                                            ● {order.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-gray-500">{order.time}</td>
                                    <td className="px-6 py-4">
                                        <button className="text-gray-400 hover:text-brand-600">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
