import { ChevronRight, Flame, Package, AlertCircle } from "lucide-react";
import { formatNaira } from "@/lib/utils/format";

interface StockAlert {
    id: string;
    name: string;
    stock: number;
    lowStockAlert: number | null;
    stockUnit: string | null;
}

interface PopularItem {
    id: string;
    name: string;
    orders: string;
    price: any;
}

interface RightSidebarProps {
    stockAlerts?: StockAlert[];
    popularItems?: PopularItem[];
}

export function RightSidebarDashboard({ stockAlerts = [], popularItems = [] }: RightSidebarProps) {
    // Fallback demo data if no real data provided
    const demoPopularItems = [
        { name: "Classic Cheeseburger", orders: "42 orders today", price: 12.50, id: "1" },
        { name: "Caesar Salad", orders: "28 orders today", price: 9.00, id: "2" },
        { name: "Pasta Carbonara", orders: "19 orders today", price: 14.00, id: "3" },
    ];

    const demoStockAlerts = [
        { item: "Tomato Sauce", level: "2 units left", status: "Critical", color: "text-red-600 bg-red-50 border-red-100" },
        { item: "Milk", level: "5 units left", status: "Warning", color: "text-orange-600 bg-orange-50 border-orange-100" },
    ];

    const displayPopular = popularItems.length > 0 ? popularItems : demoPopularItems;

    const displayAlerts = stockAlerts.length > 0
        ? stockAlerts.map(alert => {
            const percentageLeft = alert.lowStockAlert ? (alert.stock / alert.lowStockAlert) * 100 : 0;
            let status = "Normal";
            let color = "text-green-600 bg-green-50 border-green-100";

            if (percentageLeft <= 25) {
                status = "Critical";
                color = "text-red-600 bg-red-50 border-red-100";
            } else if (percentageLeft <= 50) {
                status = "Warning";
                color = "text-orange-600 bg-orange-50 border-orange-100";
            }

            return {
                item: alert.name,
                level: `${alert.stock} ${alert.stockUnit || 'units'} left`,
                status,
                color
            };
        })
        : demoStockAlerts;
    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                        <Flame className="w-5 h-5 text-orange-500 fill-orange-500" />
                        <h3 className="text-lg font-black text-gray-900">Popular Items</h3>
                    </div>
                    <button className="text-brand-600 p-1 hover:bg-brand-50 rounded-lg transition-colors">
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>

                <div className="space-y-4">
                    {displayPopular.map((item) => (
                        <div key={item.id} className="flex items-center gap-4 group cursor-pointer p-2 -m-2 rounded-2xl hover:bg-gray-50 transition-all">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-100 to-brand-50 flex items-center justify-center shadow-sm">
                                <Flame className="w-5 h-5 text-brand-500" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-bold text-gray-900 truncate">{item.name}</h4>
                                <p className="text-xs text-gray-400">{item.orders}</p>
                            </div>
                            <span className="text-sm font-black text-gray-900">{typeof item.price === 'number' ? formatNaira(item.price) : item.price}</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                        <Package className="w-5 h-5 text-brand-600" />
                        <h3 className="text-lg font-black text-gray-900">Stock Alerts</h3>
                    </div>
                    <button className="text-sm font-bold text-brand-600 hover:underline transition-all">Manage</button>
                </div>

                <div className="space-y-3">
                    {displayAlerts.map((alert) => (
                        <div key={alert.item} className={`p-4 rounded-2xl border ${alert.color} flex flex-col gap-1`}>
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-black">{alert.item}</span>
                                <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">{alert.status}</span>
                            </div>
                            <span className="text-xs font-medium opacity-90">{alert.level}</span>
                        </div>
                    ))}
                    {displayAlerts.length === 0 && (
                        <div className="p-4 rounded-2xl border text-green-600 bg-green-50 border-green-100 flex items-center gap-2">
                            <AlertCircle className="w-4 h-4" />
                            <span className="text-xs font-medium">All items are well stocked</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
