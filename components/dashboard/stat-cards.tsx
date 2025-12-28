import {
    Banknote,
    ShoppingBag,
    Users2,
    AlertTriangle,
    TrendingUp,
    TrendingDown
} from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
    title: string;
    value: string;
    description?: string;
    icon: any;
    trend?: {
        value: string;
        isUp: boolean;
    };
    color: string;
    progress?: number;
}

function StatCard({ title, value, description, icon: Icon, trend, color, progress }: StatCardProps) {
    return (
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow group">
            <div className="flex justify-between items-start mb-4">
                <div className={cn("p-3 rounded-2xl", color)}>
                    <Icon className="w-6 h-6 text-white" />
                </div>
                {trend && (
                    <div className={cn(
                        "flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full",
                        trend.isUp ? "text-green-600 bg-green-50" : "text-red-600 bg-red-50"
                    )}>
                        {trend.isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {trend.value}
                    </div>
                )}
            </div>

            <div>
                <p className="text-gray-500 text-sm font-medium mb-1">{title}</p>
                <h3 className="text-2xl font-black text-gray-900 tracking-tight">{value}</h3>
                {description && <p className="text-xs text-gray-400 mt-1">{description}</p>}

                {progress !== undefined && (
                    <div className="mt-4">
                        <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                            <div
                                className="bg-brand-500 h-full transition-all duration-500"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

import { formatNaira } from "@/lib/utils/format";

interface DashboardStatsProps {
    stats?: {
        revenue: number;
        profit: number;
        salesCount: number;
        lowStockCount: number;
        trends: {
            revenue: number;
            sales: number;
        }
    } | null;
}

export function DashboardStats({ stats }: DashboardStatsProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
                title="Today's Revenue"
                value={formatNaira(stats?.revenue || 0)}
                icon={Banknote}
                trend={{
                    value: `${stats?.trends.revenue.toFixed(1)}% vs yesterday`,
                    isUp: (stats?.trends.revenue || 0) >= 0
                }}
                color="bg-green-500"
            />
            <StatCard
                title="Net Profit"
                value={formatNaira(stats?.profit || 0)}
                description="Selling Price - Cost Price"
                icon={TrendingUp}
                color="bg-emerald-500"
            />
            <StatCard
                title="Total Sales"
                value={stats?.salesCount.toString() || "0"}
                description="Completed orders today"
                icon={ShoppingBag}
                trend={{
                    value: `${stats?.trends.sales.toFixed(1)}% vs yesterday`,
                    isUp: (stats?.trends.sales || 0) >= 0
                }}
                color="bg-brand-500"
            />
            <StatCard
                title="Low Stock Alerts"
                value={stats?.lowStockCount.toString() || "0"}
                description="Items need attention"
                icon={AlertTriangle}
                color="bg-orange-500"
            />
        </div>
    );
}
