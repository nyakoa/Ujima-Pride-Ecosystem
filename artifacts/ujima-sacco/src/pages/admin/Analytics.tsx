import { useGetPortfolioAnalytics, useGetRiskDistribution, useGetLendingTrends, useGetMemberGrowth, getGetPortfolioAnalyticsQueryKey, getGetRiskDistributionQueryKey, getGetLendingTrendsQueryKey, getGetMemberGrowthQueryKey } from "@workspace/api-client-react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, AreaChart, Area, LineChart, Line } from "recharts";

function fmt(n: number) {
  if (n >= 1_000_000) return `KES ${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `KES ${(n / 1_000).toFixed(0)}K`;
  return `KES ${n.toLocaleString()}`;
}

const RISK_COLORS = { low: "#22c55e", medium: "#f59e0b", high: "#f97316", veryHigh: "#ef4444" };
const PRODUCT_COLORS = ["#1b5e3b", "#2d7a55", "#3e9c6f", "#4fbf88", "#a8d5c2", "#d4edda"];

export default function Analytics() {
  const { data: portfolio } = useGetPortfolioAnalytics({ query: { queryKey: getGetPortfolioAnalyticsQueryKey() } });
  const { data: risk } = useGetRiskDistribution({ query: { queryKey: getGetRiskDistributionQueryKey() } });
  const { data: trends } = useGetLendingTrends({ query: { queryKey: getGetLendingTrendsQueryKey() } });
  const { data: growth } = useGetMemberGrowth({ query: { queryKey: getGetMemberGrowthQueryKey() } });

  const riskData = risk ? [
    { name: "Low Risk", value: risk.low, color: RISK_COLORS.low },
    { name: "Medium Risk", value: risk.medium, color: RISK_COLORS.medium },
    { name: "High Risk", value: risk.high, color: RISK_COLORS.high },
    { name: "Very High", value: risk.veryHigh, color: RISK_COLORS.veryHigh },
  ].filter(d => d.value > 0) : [];

  const productBreakdown = portfolio?.productBreakdown?.map((p, i) => ({
    name: p.productType.replace("_", " "),
    loans: p.count,
    value: Math.round(p.totalAmount / 1000),
    color: PRODUCT_COLORS[i % PRODUCT_COLORS.length],
  })) || [];

  const trendData = trends?.map(t => ({
    month: t.month.slice(5),
    Disbursed: Math.round(t.disbursed / 1000),
    Repaid: Math.round(t.repaid / 1000),
    Applications: t.applications,
  })) || [];

  const growthData = growth?.map(g => ({
    month: g.month.slice(5),
    "New Members": g.newMembers,
    "Total Members": g.totalMembers,
  })) || [];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground" data-testid="page-title">Analytics</h1>
          <p className="text-muted-foreground text-sm mt-1">Comprehensive lending portfolio analysis</p>
        </div>

        {/* Portfolio Summary */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Total Disbursed", value: fmt(portfolio?.totalDisbursed ?? 0) },
            { label: "Total Outstanding", value: fmt(portfolio?.totalOutstanding ?? 0) },
            { label: "Total Repaid", value: fmt(portfolio?.totalRepaid ?? 0) },
            { label: "Avg. Loan Size", value: fmt(portfolio?.averageLoanSize ?? 0) },
          ].map(kpi => (
            <Card key={kpi.label} data-testid={`analytics-${kpi.label.toLowerCase().replace(/\s/g, "-")}`}>
              <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground font-medium">{kpi.label}</CardTitle></CardHeader>
              <CardContent><p className="text-xl font-bold">{kpi.value}</p></CardContent>
            </Card>
          ))}
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader><CardTitle className="text-base">Lending Trends (KES Thousands)</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="Disbursed" stroke="#1b5e3b" fill="#1b5e3b20" strokeWidth={2} />
                  <Area type="monotone" dataKey="Repaid" stroke="#b8860b" fill="#b8860b20" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Risk Distribution</CardTitle></CardHeader>
            <CardContent>
              {riskData.length === 0 ? (
                <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">No data yet</div>
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie data={riskData} cx="50%" cy="45%" innerRadius={60} outerRadius={85} dataKey="value" paddingAngle={3}>
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

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader><CardTitle className="text-base">Portfolio by Loan Type (KES Thousands)</CardTitle></CardHeader>
            <CardContent>
              {productBreakdown.length === 0 ? (
                <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">No data yet</div>
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={productBreakdown} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 11 }} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={90} />
                    <Tooltip />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                      {productBreakdown.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Member Growth</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={growthData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="Total Members" stroke="#1b5e3b" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="New Members" stroke="#b8860b" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
