import { useGetAdminDashboard, useGetLendingTrends, useGetRiskDistribution, getGetAdminDashboardQueryKey, getGetLendingTrendsQueryKey, getGetRiskDistributionQueryKey } from "@workspace/api-client-react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { Users, FileText, CreditCard, TrendingUp, AlertTriangle, CheckCircle } from "lucide-react";

function fmt(n: number) {
  if (n >= 1_000_000) return `KES ${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `KES ${(n / 1_000).toFixed(0)}K`;
  return `KES ${n.toLocaleString()}`;
}

const STATUS_COLORS: Record<string, string> = {
  submitted: "#3b82f6",
  under_review: "#f59e0b",
  additional_info_required: "#f97316",
  approved: "#22c55e",
  rejected: "#ef4444",
  disbursed: "#059669",
};

const RISK_COLORS = { low: "#22c55e", medium: "#f59e0b", high: "#f97316", veryHigh: "#ef4444" };

export default function AdminDashboard() {
  const { data: dashboard, isLoading } = useGetAdminDashboard({ query: { queryKey: getGetAdminDashboardQueryKey() } });
  const { data: trends } = useGetLendingTrends({ query: { queryKey: getGetLendingTrendsQueryKey() } });
  const { data: risk } = useGetRiskDistribution({ query: { queryKey: getGetRiskDistributionQueryKey() } });

  const riskData = risk ? [
    { name: "Low Risk", value: risk.low, color: RISK_COLORS.low },
    { name: "Medium Risk", value: risk.medium, color: RISK_COLORS.medium },
    { name: "High Risk", value: risk.high, color: RISK_COLORS.high },
    { name: "Very High", value: risk.veryHigh, color: RISK_COLORS.veryHigh },
  ].filter(d => d.value > 0) : [];

  const trendData = trends?.map(t => ({
    month: t.month,
    Disbursed: Math.round(t.disbursed / 1000),
    Applications: t.applications,
  })) || [];

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground" data-testid="page-title">Admin Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">Ujima SACCO lending portfolio overview</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Total Members", value: dashboard?.totalMembers ?? 0, icon: Users, color: "text-blue-600" },
            { label: "Total Applications", value: dashboard?.totalApplications ?? 0, icon: FileText, color: "text-amber-600" },
            { label: "Pending Review", value: dashboard?.pendingApplications ?? 0, icon: AlertTriangle, color: "text-orange-600" },
            { label: "Active Loans", value: dashboard?.activeLoans ?? 0, icon: CreditCard, color: "text-green-600" },
          ].map(kpi => (
            <Card key={kpi.label} data-testid={`kpi-${kpi.label.toLowerCase().replace(/\s/g, "-")}`}>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-2">
                  <kpi.icon className={`w-4 h-4 ${kpi.color}`} />{kpi.label}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{typeof kpi.value === "number" ? kpi.value.toLocaleString() : kpi.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Portfolio Value", value: fmt(dashboard?.portfolioValue ?? 0), sub: "Outstanding balance" },
            { label: "Approval Rate", value: `${(dashboard?.approvalRate ?? 0).toFixed(1)}%`, sub: "Of all applications" },
            { label: "Default Rate", value: `${(dashboard?.defaultRate ?? 0).toFixed(1)}%`, sub: "Of active loans" },
            { label: "Approved Loans", value: (dashboard?.approvedLoans ?? 0).toLocaleString(), sub: "Ready for disbursement" },
          ].map(kpi => (
            <Card key={kpi.label}>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground">{kpi.label}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xl font-bold">{kpi.value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{kpi.sub}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Lending Trend */}
          <Card className="lg:col-span-2">
            <CardHeader><CardTitle className="text-base">Lending Trends (KES Thousands)</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Area type="monotone" dataKey="Disbursed" stroke="hsl(152 60% 22%)" fill="hsl(152 60% 22% / 0.1)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Risk Distribution */}
          <Card>
            <CardHeader><CardTitle className="text-base">Risk Distribution</CardTitle></CardHeader>
            <CardContent>
              {riskData.length === 0 ? (
                <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">No assessments yet</div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={riskData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} dataKey="value" paddingAngle={3}>
                      {riskData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Legend iconType="circle" iconSize={10} />
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Status Breakdown + Recent Applications */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader><CardTitle className="text-base">Applications by Status</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2">
                {dashboard?.applicationsByStatus?.map(s => {
                  const total = dashboard.totalApplications || 1;
                  const pct = Math.round((s.count / total) * 100);
                  return (
                    <div key={s.status}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="capitalize">{s.status.replace(/_/g, " ")}</span>
                        <span>{s.count} ({pct}%)</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-1.5">
                        <div className="h-1.5 rounded-full" style={{ width: `${pct}%`, backgroundColor: STATUS_COLORS[s.status] || "#6b7280" }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Recent Applications</CardTitle>
              <Link href="/admin/applications"><Button variant="ghost" size="sm" className="text-primary">View All</Button></Link>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {dashboard?.recentApplications?.slice(0, 5).map(app => (
                  <Link key={app.id} href={`/admin/applications/${app.id}`}>
                    <div className="flex items-center justify-between px-6 py-3 hover:bg-muted/40 cursor-pointer" data-testid={`recent-app-${app.id}`}>
                      <div>
                        <p className="text-sm font-medium">{app.loanProduct?.name || "Loan"}</p>
                        <p className="text-xs text-muted-foreground">KES {app.requestedAmount.toLocaleString()} &middot; {new Date(app.createdAt).toLocaleDateString("en-KE")}</p>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[app.status] ? "" : "bg-gray-100"}`} style={{ backgroundColor: `${STATUS_COLORS[app.status]}20`, color: STATUS_COLORS[app.status] }}>
                        {app.status.replace(/_/g, " ")}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
