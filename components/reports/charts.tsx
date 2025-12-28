"use client";

import { Bar, Pie, Line } from "react-chartjs-2";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
} from "chart.js";

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend
);

interface ProfitChartProps {
    data: any[];
}

export function ProfitByProductChart({ data }: ProfitChartProps) {
    const chartData = {
        labels: data.slice(0, 8).map(p => p.name),
        datasets: [
            {
                label: "Profit",
                data: data.slice(0, 8).map(p => p.profit),
                backgroundColor: "#10b981",
                borderColor: "#059669",
                borderWidth: 2,
            },
        ],
    };

    return (
        <div className="w-full h-64">
            <Bar
                data={chartData}
                options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: true, position: "top" as const },
                        title: { display: false },
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                callback: function (value) {
                                    return "₦" + value.toLocaleString();
                                },
                            },
                        },
                    },
                }}
            />
        </div>
    );
}

interface PaymentMethodChartProps {
    cashSales: number;
    cardSales: number;
    transferSales: number;
}

export function PaymentMethodChart({
    cashSales,
    cardSales,
    transferSales,
}: PaymentMethodChartProps) {
    const total = cashSales + cardSales + transferSales;

    const chartData = {
        labels: ["Cash", "Card", "Transfer"],
        datasets: [
            {
                data: [cashSales, cardSales, transferSales],
                backgroundColor: ["#22c55e", "#3b82f6", "#a855f7"],
                borderColor: ["#16a34a", "#1d4ed8", "#9333ea"],
                borderWidth: 2,
            },
        ],
    };

    return (
        <div className="w-full h-64">
            <Pie
                data={chartData}
                options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: true, position: "bottom" as const },
                        tooltip: {
                            callbacks: {
                                label: function (context) {
                                    const value = context.parsed;
                                    const percentage = ((value / total) * 100).toFixed(1);
                                    return `₦${value.toLocaleString()} (${percentage}%)`;
                                },
                            },
                        },
                    },
                }}
            />
        </div>
    );
}

interface StaffPerformanceChartProps {
    data: any[];
}

export function StaffPerformanceChart({ data }: StaffPerformanceChartProps) {
    const chartData = {
        labels: data.map(s => s.name),
        datasets: [
            {
                label: "Revenue",
                data: data.map(s => s.revenue),
                backgroundColor: "#3b82f6",
                borderColor: "#1d4ed8",
                borderWidth: 2,
            },
            {
                label: "Profit",
                data: data.map(s => s.profit),
                backgroundColor: "#10b981",
                borderColor: "#059669",
                borderWidth: 2,
            },
        ],
    };

    return (
        <div className="w-full h-64">
            <Bar
                data={chartData}
                options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: true, position: "top" as const },
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                callback: function (value) {
                                    return "₦" + value.toLocaleString();
                                },
                            },
                        },
                    },
                }}
            />
        </div>
    );
}

interface SalesOverTimeChartProps {
    data: any[];
}

export function SalesOverTimeChart({ data }: SalesOverTimeChartProps) {
    const chartData = {
        labels: data.map(d => `${d.hour}:00`),
        datasets: [
            {
                label: "Hourly Revenue",
                data: data.map(d => d.revenue),
                borderColor: "#3b82f6",
                backgroundColor: "rgba(59, 130, 246, 0.1)",
                borderWidth: 3,
                fill: true,
                tension: 0.4,
            },
            {
                label: "Hourly Profit",
                data: data.map(d => d.profit),
                borderColor: "#10b981",
                backgroundColor: "rgba(16, 185, 129, 0.1)",
                borderWidth: 3,
                fill: true,
                tension: 0.4,
            },
        ],
    };

    return (
        <div className="w-full h-64">
            <Line
                data={chartData}
                options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: true, position: "top" as const },
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                callback: function (value) {
                                    return "₦" + value.toLocaleString();
                                },
                            },
                        },
                    },
                }}
            />
        </div>
    );
}
