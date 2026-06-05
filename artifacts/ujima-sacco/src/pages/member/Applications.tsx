import { useListLoanApplications, getListLoanApplicationsQueryKey } from "@workspace/api-client-react";
import { MemberLayout } from "@/components/layout/MemberLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { FileText, ChevronRight } from "lucide-react";

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
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${map[status] || "bg-gray-100 text-gray-800"}`}>
      {labels[status] || status}
    </span>
  );
}

function fmt(n: number) {
  return `KES ${n.toLocaleString("en-KE", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export default function Applications() {
  const { data, isLoading } = useListLoanApplications({
    query: { queryKey: getListLoanApplicationsQueryKey() }
  });

  return (
    <MemberLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground" data-testid="page-title">My Applications</h1>
            <p className="text-muted-foreground text-sm mt-1">Track your loan application history</p>
          </div>
          <Link href="/member/apply">
            <Button data-testid="button-new-application">New Application</Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : !data?.length ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <FileText className="w-12 h-12 text-muted-foreground opacity-30 mb-4" />
              <p className="font-medium text-foreground">No applications yet</p>
              <p className="text-muted-foreground text-sm mt-1">Start your first loan application today</p>
              <Link href="/member/apply">
                <Button className="mt-4">Apply for a Loan</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{data.length} Application{data.length !== 1 ? "s" : ""}</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {data.map((app) => (
                  <Link key={app.id} href={`/member/applications/${app.id}`}>
                    <div className="flex items-center justify-between px-6 py-4 hover:bg-muted/40 cursor-pointer transition-colors" data-testid={`app-row-${app.id}`}>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3">
                          <p className="font-medium text-sm">{app.loanProduct?.name || "Loan Application"}</p>
                          {statusBadge(app.status)}
                        </div>
                        <div className="flex gap-4 mt-1">
                          <p className="text-xs text-muted-foreground">{fmt(app.requestedAmount)}</p>
                          <p className="text-xs text-muted-foreground">{app.tenureMonths} months</p>
                          <p className="text-xs text-muted-foreground">{new Date(app.createdAt).toLocaleDateString("en-KE")}</p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </MemberLayout>
  );
}
