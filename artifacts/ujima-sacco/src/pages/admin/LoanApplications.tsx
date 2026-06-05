import { useState } from "react";
import { useListAllLoanApplications, getListAllLoanApplicationsQueryKey } from "@workspace/api-client-react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "wouter";
import { ChevronRight, Search } from "lucide-react";

const STATUSES = ["", "submitted", "under_review", "additional_info_required", "approved", "rejected", "disbursed"];

const STATUS_LABELS: Record<string, string> = {
  "": "All", submitted: "Submitted", under_review: "Under Review",
  additional_info_required: "Info Required", approved: "Approved",
  rejected: "Rejected", disbursed: "Disbursed",
};

const STATUS_COLORS: Record<string, string> = {
  submitted: "bg-blue-100 text-blue-800", under_review: "bg-amber-100 text-amber-800",
  additional_info_required: "bg-orange-100 text-orange-800", approved: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800", disbursed: "bg-emerald-100 text-emerald-800",
};

function fmt(n: number) {
  return `KES ${n.toLocaleString("en-KE")}`;
}

export default function AdminLoanApplications() {
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useListAllLoanApplications(
    statusFilter ? { status: statusFilter, page, limit: 20 } : { page, limit: 20 },
    { query: { queryKey: getListAllLoanApplicationsQueryKey(statusFilter ? { status: statusFilter, page, limit: 20 } : { page, limit: 20 }) } }
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground" data-testid="page-title">Loan Applications</h1>
          <p className="text-muted-foreground text-sm mt-1">Review and manage all member loan applications</p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          {STATUSES.map(s => (
            <Button key={s} variant={statusFilter === s ? "default" : "outline"} size="sm" onClick={() => { setStatusFilter(s); setPage(1); }} data-testid={`filter-${s || "all"}`}>
              {STATUS_LABELS[s]}
            </Button>
          ))}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-48"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{data?.total ?? 0} Application{data?.total !== 1 ? "s" : ""}</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/40">
                      <th className="text-left px-6 py-3 font-medium text-muted-foreground">ID</th>
                      <th className="text-left px-6 py-3 font-medium text-muted-foreground">Product</th>
                      <th className="text-left px-6 py-3 font-medium text-muted-foreground">Amount</th>
                      <th className="text-left px-6 py-3 font-medium text-muted-foreground">Tenure</th>
                      <th className="text-left px-6 py-3 font-medium text-muted-foreground">Stage</th>
                      <th className="text-left px-6 py-3 font-medium text-muted-foreground">Status</th>
                      <th className="text-left px-6 py-3 font-medium text-muted-foreground">Date</th>
                      <th className="px-6 py-3" />
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {data?.data?.map(app => (
                      <tr key={app.id} className="hover:bg-muted/30" data-testid={`app-row-${app.id}`}>
                        <td className="px-6 py-3 font-mono text-xs">#{app.id}</td>
                        <td className="px-6 py-3 font-medium">{app.loanProduct?.name || "—"}</td>
                        <td className="px-6 py-3">{fmt(app.requestedAmount)}</td>
                        <td className="px-6 py-3">{app.tenureMonths}m</td>
                        <td className="px-6 py-3 text-xs text-muted-foreground capitalize">{app.pipelineStage?.replace(/_/g, " ") || "—"}</td>
                        <td className="px-6 py-3">
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[app.status] || "bg-gray-100 text-gray-800"}`}>
                            {STATUS_LABELS[app.status] || app.status}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-muted-foreground">{new Date(app.createdAt).toLocaleDateString("en-KE")}</td>
                        <td className="px-6 py-3">
                          <Link href={`/admin/applications/${app.id}`}>
                            <Button variant="ghost" size="sm" className="gap-1 text-primary">Review <ChevronRight className="w-3 h-3" /></Button>
                          </Link>
                        </td>
                      </tr>
                    ))}
                    {!data?.data?.length && (
                      <tr><td colSpan={8} className="px-6 py-12 text-center text-muted-foreground">No applications found</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
              {data && data.total > 20 && (
                <div className="flex items-center justify-between px-6 py-4 border-t">
                  <p className="text-sm text-muted-foreground">Page {page} of {Math.ceil(data.total / 20)}</p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
                    <Button variant="outline" size="sm" disabled={page >= Math.ceil(data.total / 20)} onClick={() => setPage(p => p + 1)}>Next</Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
}
