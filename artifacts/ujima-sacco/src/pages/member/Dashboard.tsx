import { useGetMemberDashboard, getGetMemberDashboardQueryKey } from "@workspace/api-client-react";
import { MemberLayout } from "@/components/layout/MemberLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { CreditCard, FileText, TrendingUp, AlertCircle } from "lucide-react";

function statusBadge(status: string) {
  const map: Record<string, string> = {
    submitted: "bg-blue-100 text-blue-800",
    under_review: "bg-amber-100 text-amber-800",
    additional_info_required: "bg-orange-100 text-orange-800",
    approved: "bg-green-100 text-green-800",
    rejected: "bg-red-100 text-red-800",
    disbursed: "bg-emerald-100 text-emerald-800",
  };
  const labels: Record<string, string> = {
    submitted: "Submitted",
    under_review: "Under Review",
    additional_info_required: "Info Required",
    approved: "Approved",
    rejected: "Rejected",
    disbursed: "Disbursed",
  };
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${map[status] || "bg-gray-100 text-gray-800"}`}>{labels[status] || status}</span>;
}

function fmt(n: number) {
  return `KES ${n.toLocaleString("en-KE", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export default function MemberDashboard() {
  const { data, isLoading } = useGetMemberDashboard({
    query: { queryKey: getGetMemberDashboardQueryKey() }
  });

  if (isLoading) {
    return (
      <MemberLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" data-testid="loading-spinner" />
        </div>
      </MemberLayout>
    );
  }

  const kycWarning = data?.kycStatus === "pending";

  return (
    <MemberLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground" data-testid="page-title">Member Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">Overview of your account and loan portfolio</p>
        </div>

        {kycWarning && (
          <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg" data-testid="kyc-warning">
            <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-amber-900 text-sm">KYC Not Completed</p>
              <p className="text-amber-700 text-sm mt-0.5">Complete your KYC to access all loan products and improve your credit assessment.</p>
              <Link href="/member/profile">
                <Button size="sm" variant="outline" className="mt-2 border-amber-400 text-amber-800 hover:bg-amber-100">Complete KYC</Button>
              </Link>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card data-testid="card-total-applications">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <FileText className="w-4 h-4" /> Total Applications
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold" data-testid="value-total-applications">{data?.totalApplications ?? 0}</p>
            </CardContent>
          </Card>
          <Card data-testid="card-active-loans">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <CreditCard className="w-4 h-4" /> Active Loans
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold" data-testid="value-active-loans">{data?.activeLoans ?? 0}</p>
            </CardContent>
          </Card>
          <Card data-testid="card-total-borrowed">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingUp className="w-4 h-4" /> Total Borrowed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xl font-bold" data-testid="value-total-borrowed">{fmt(data?.totalBorrowed ?? 0)}</p>
            </CardContent>
          </Card>
          <Card data-testid="card-outstanding">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <CreditCard className="w-4 h-4" /> Outstanding Balance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xl font-bold text-amber-600" data-testid="value-outstanding">{fmt(data?.outstandingBalance ?? 0)}</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Recent Applications</CardTitle>
              <Link href="/member/applications">
                <Button variant="ghost" size="sm" className="text-primary">View All</Button>
              </Link>
            </CardHeader>
            <CardContent>
              {!data?.recentApplications?.length ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">No applications yet</p>
                  <Link href="/member/apply">
                    <Button size="sm" className="mt-3">Apply for a Loan</Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {data.recentApplications.map((app) => (
                    <div key={app.id} className="flex items-center justify-between py-2 border-b last:border-0" data-testid={`app-row-${app.id}`}>
                      <div>
                        <p className="text-sm font-medium">{app.loanProduct?.name || "Loan"}</p>
                        <p className="text-xs text-muted-foreground">{fmt(app.requestedAmount)} &middot; {app.tenureMonths}m</p>
                      </div>
                      {statusBadge(app.status)}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Active Loans</CardTitle>
              <Link href="/member/loans">
                <Button variant="ghost" size="sm" className="text-primary">View All</Button>
              </Link>
            </CardHeader>
            <CardContent>
              {!data?.activeLoansDetail?.length ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CreditCard className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">No active loans</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {data.activeLoansDetail.map((loan) => (
                    <div key={loan.id} className="py-2 border-b last:border-0" data-testid={`loan-row-${loan.id}`}>
                      <div className="flex justify-between mb-1">
                        <p className="text-sm font-medium">Outstanding: {fmt(loan.outstandingBalance)}</p>
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">Active</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-1.5">
                        <div
                          className="bg-primary h-1.5 rounded-full"
                          style={{ width: `${Math.min(100, (loan.totalRepaid / (loan.principalAmount + 0.01)) * 100)}%` }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Repaid: {fmt(loan.totalRepaid)} of {fmt(loan.principalAmount)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </MemberLayout>
  );
}
