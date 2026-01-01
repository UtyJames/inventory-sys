"use client";

import { useEffect, useState } from "react";
import { BarChart3 } from "lucide-react";
import { getHourlyPerformance } from "@/app/lib/actions/inventory.actions";

interface HourlyData {
    hour: string;
    revenue: number;
}

export function HourlySalesChart() {
    const [data, setData] = useState<HourlyData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [timeframe, setTimeframe] = useState("Today");

    const fetchData = async () => {
        // In a real app, passing timeframe to the action would be good. 
        // For now, assuming action returns "Today".
        const result = await getHourlyPerformance();
        if (result.success) {
            setData((result as any).data);
        }
        setIsLoading(false);
    };

    useEffect(() => {
        fetchData();
        // Poll every minute
        const interval = setInterval(fetchData, 60000);
        return () => clearInterval(interval);
    }, [timeframe]);

    return (
        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm h-80 flex flex-col">
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h3 className="text-xl font-black text-gray-900">Hourly Sales Performance</h3>
                    <p className="text-sm text-gray-400 mt-1">Visualizing demand peaks {timeframe.toLowerCase()}</p>
                </div>
                <select
                    value={timeframe}
                    onChange={(e) => setTimeframe(e.target.value)}
                    className="bg-gray-50 border-none rounded-xl text-xs font-bold px-3 py-2 outline-none cursor-pointer"
                >
                    <option>Today</option>
                    {/* <option>Yesterday</option> - Backend support needed later */}
                </select>
            </div>

            <div className="flex-1 flex items-end gap-2 pb-2">
                {data.length > 0 ? (
                    (() => {
                        const maxRevenue = Math.max(...data.map(d => d.revenue), 1);
                        return data.map((d, i) => {
                            const height = (d.revenue / maxRevenue) * 100 || 2; // Min height 2%
                            return (
                                <div key={i} className="flex-1 bg-brand-50 rounded-t-lg relative group transition-all hover:bg-brand-100" style={{ height: `${height}%` }}>
                                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] font-bold px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                                        ₦{d.revenue.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                                        <div className="text-[8px] opacity-70 mt-0.5">{d.hour}:00</div>
                                    </div>
                                </div>
                            );
                        });
                    })()
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 opacity-50">
                        {isLoading ? (
                            <div className="animate-pulse flex flex-col items-center">
                                <div className="h-4 w-4 bg-gray-200 rounded-full mb-2"></div>
                                <span className="text-xs font-medium">Loading...</span>
                            </div>
                        ) : (
                            <>
                                <BarChart3 className="w-8 h-8 mb-2" />
                                <span className="text-xs font-medium">No sales yet today</span>
                            </>
                        )}
                    </div>
                )}
            </div>

            <div className="flex justify-between mt-4 px-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                <span>8am</span>
                <span>12pm</span>
                <span>4pm</span>
                <span>8pm</span>
                <span>10pm</span>
            </div>
        </div>
    );
}
