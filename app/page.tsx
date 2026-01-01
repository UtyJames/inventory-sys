import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Sidebar } from "@/components/dashboard/sidebar"
import { DashboardStats } from "@/components/dashboard/stat-cards"
import { SalesReportTable } from "@/components/dashboard/sales-report-table"
import { RightSidebarDashboard } from "@/components/dashboard/right-sidebar"
import { Button } from "@/components/ui/button"
import { HeldOrdersCard } from "@/components/dashboard/held-orders-card"
import { Calendar, Plus, BarChart3 } from "lucide-react"
import { HourlySalesChart } from "@/components/dashboard/hourly-sales-chart"
import { getDashboardStats, getSalesReports } from "@/app/lib/actions/order.actions"
import { getStockAlerts, getPopularItems } from "@/app/lib/actions/inventory.actions"

export default async function DashboardPage() {
  const session = await auth()
  if (!session) redirect("/auth/sign-in")

  const statsResult = await getDashboardStats()
  const reportsResult = await getSalesReports({
    startDate: new Date(new Date().setHours(0, 0, 0, 0))
  })
  // const hourlyResult = await getHourlyPerformance() // Moved to client
  const alertsResult = await getStockAlerts()
  const popularResult = await getPopularItems()

  const stats = statsResult.success ? statsResult.stats : null
  const reports = reportsResult.success ? reportsResult.reports : []
  // const hourlyData: any[] = hourlyResult.success ? (hourlyResult as any).data : []
  const stockAlerts = alertsResult.success ? alertsResult.alerts : []
  const popularItems = popularResult.success ? popularResult.items : []

  const user = {
    name: session.user?.name,
    role: session.user?.role,
  }

  const todayDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const currentTime = new Date().toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div className="flex min-h-screen bg-gray-50/50">
      <Sidebar user={user} />

      <main className="flex-1 flex flex-col">
        {/* Header */}
        <header className="px-8 py-6 flex items-center justify-between sticky top-0 bg-gray-50/80 backdrop-blur-md z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-3xl font-black text-gray-900 tracking-tight">Restaurant Overview</h1>
              <div className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
            </div>
            <p className="text-gray-500 font-medium flex items-center gap-2 text-xs">
              <Calendar className="w-4 h-4" />
              {todayDate} • {currentTime}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/reports">
              <Button variant="outline" className="rounded-2xl h-12 px-6 font-bold border-gray-200">
                <BarChart3 className="mr-2 h-4 w-4" />
                Reports
              </Button>
            </Link>
            <Link href="/pos">
              <Button className="rounded-2xl h-12 px-6 font-black bg-brand-500 hover:bg-brand-600 shadow-lg shadow-brand-500/20">
                <Plus className="mr-2 h-5 w-5" />
                New Order
              </Button>
            </Link>
          </div>
        </header>

        {/* Content */}
        <div className="px-8 pb-10 space-y-8">
          <DashboardStats stats={stats} />

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            <div className="xl:col-span-2 space-y-8">
              {/* Sales Chart Placeholder */}
              <HourlySalesChart />

              <SalesReportTable reports={reports} />
            </div>

            <div className="xl:col-span-1">
              <RightSidebarDashboard stockAlerts={stockAlerts} popularItems={popularItems} />
              <HeldOrdersCard />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}