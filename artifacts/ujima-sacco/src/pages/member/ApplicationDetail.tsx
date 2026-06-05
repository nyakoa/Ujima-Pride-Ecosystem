import { useGetLoanApplication, useGetLoanApplicationStatus, useGetAiAssessment, getGetLoanApplicationQueryKey, getGetLoanApplicationStatusQueryKey, getGetAiAssessmentQueryKey } from "@workspace/api-client-react";
import { MemberLayout } from "@/components/layout/MemberLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRoute, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CheckCircle2, Circle, Clock, XCircle, Loader2 } from "lucide-react";

function fmt(n: number) {
  return `KES ${n.toLocaleString("en-KE", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

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
    additional_info_required: "Additional Info Required",
    approved: "Approved",
    rejected: "Rejected",
    disbursed: "Disbursed",
  };
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${map[status] || "bg-gray-100 text-gray-800"}`}>
      {labels[status] || status}
    </span>
  );
}

function StageIcon({ status }: { status: string }) {
  if (status === "completed") return <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0" />;
  if (status === "in_progress") return <Loader2 className="w-6 h-6 text-amber-500 animate-spin flex-shrink-0" />;
  if (status === "failed") return <XCircle className="w-6 h-6 text-red-500 flex-shrink-0" />;
  return <Circle className="w-6 h-6 text-gray-300 flex-shrink-0" />;
}

export default function ApplicationDetail() {
  const [, params] = useRoute("/member/applications/:id");
  const id = parseInt(params?.id || "0");

  const { data: app, isLoading } = useGetLoanApplication(id, {
    query: { enabled: !!id, queryKey: getGetLoanApplicationQueryKey(id) }
  });

  const { data: pipeline } = useGetLoanApplicationStatus(id, {
    query: { enabled: !!id, queryKey: getGetLoanApplicationStatusQueryKey(id), refetchInterval: 5000 }
  });

  const { data: assessment } = useGetAiAssessment(id, {
    query: { enabled: !!id, queryKey: getGetAiAssessmentQueryKey(id) }
  });

  if (isLoading) {
    return (
      <MemberLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </MemberLayout>
    );
  }

  if (!app) {
    return (
      <MemberLayout>
        <div className="text-center py-16">
          <p className="text-muted-foreground">Application not found</p>
          <Link href="/member/applications"><Button variant="outline" className="mt-4">Back to Applications</Button></Link>
        </div>
      </MemberLayout>
    );
  }

  return (
    <MemberLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/member/applications">
            <Button variant="ghost" size="sm" className="gap-1"><ArrowLeft className="w-4 h-4" /> Back</Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground" data-testid="page-title">Application #{app.id}</h1>
          </div>
          <div className="ml-auto">{statusBadge(app.status)}</div>
        </div>

        {/* Application Details */}
        <Card>
          <CardHeader><CardTitle className="text-base">Application Details</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div><p className="text-muted-foreground">Loan Product</p><p className="font-medium">{app.loanProduct?.name}</p></div>
            <div><p className="text-muted-foreground">Requested Amount</p><p className="font-medium">{fmt(app.requestedAmount)}</p></div>
            <div><p className="text-muted-foreground">Tenure</p><p className="font-medium">{app.tenureMonths} months</p></div>
            <div><p className="text-muted-foreground">Purpose</p><p className="font-medium">{app.purpose}</p></div>
            <div><p className="text-muted-foreground">Monthly Income</p><p className="font-medium">{fmt(app.monthlyIncome)}</p></div>
            <div><p className="text-muted-foreground">Applied On</p><p className="font-medium">{new Date(app.createdAt).toLocaleDateString("en-KE")}</p></div>
            {app.approvedAmount && <div><p className="text-muted-foreground">Approved Amount</p><p className="font-medium text-green-700">{fmt(app.approvedAmount)}</p></div>}
            {app.adminNotes && <div className="col-span-full"><p className="text-muted-foreground">Admin Notes</p><p className="font-medium">{app.adminNotes}</p></div>}
            {app.rejectionReason && <div className="col-span-full"><p className="text-muted-foreground">Rejection Reason</p><p className="font-medium text-red-700">{app.rejectionReason}</p></div>}
          </CardContent>
        </Card>

        {/* AI Pipeline Progress */}
        <Card>
          <CardHeader><CardTitle className="text-base">Application Progress</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pipeline?.stages?.map((stage, i) => (
                <div key={stage.name} className="flex items-start gap-4" data-testid={`stage-${stage.name}`}>
                  <StageIcon status={stage.status} />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className={`font-medium text-sm ${stage.status === "pending" ? "text-muted-foreground" : "text-foreground"}`}>{stage.label}</p>
                        <p className="text-xs text-muted-foreground">{stage.labelSw}</p>
                      </div>
                      {stage.status === "in_progress" && (
                        <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full animate-pulse">In Progress</span>
                      )}
                      {stage.status === "completed" && (
                        <span className="text-xs text-green-600">Complete</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* AI Assessment (limited member view) */}
        {assessment && assessment.completedAt && (
          <Card>
            <CardHeader><CardTitle className="text-base">AI Assessment Summary</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-muted/40 rounded-lg">
                <p className="text-2xl font-bold text-primary">{Math.round(assessment.creditScore)}</p>
                <p className="text-xs text-muted-foreground mt-1">Credit Score</p>
                <p className="text-xs text-muted-foreground">out of 850</p>
              </div>
              <div className="text-center p-4 bg-muted/40 rounded-lg">
                <p className="text-2xl font-bold">{Math.round(assessment.approvalProbability)}%</p>
                <p className="text-xs text-muted-foreground mt-1">Approval Probability</p>
              </div>
              <div className="text-center p-4 bg-muted/40 rounded-lg">
                <p className={`text-lg font-bold capitalize ${
                  assessment.riskLevel === "low" ? "text-green-600" :
                  assessment.riskLevel === "medium" ? "text-amber-600" :
                  assessment.riskLevel === "high" ? "text-orange-600" : "text-red-600"
                }`}>{assessment.riskLevel?.replace("_", " ")}</p>
                <p className="text-xs text-muted-foreground mt-1">Risk Level</p>
              </div>
              <div className="text-center p-4 bg-muted/40 rounded-lg">
                <p className="text-lg font-bold">{fmt(assessment.recommendedLimit)}</p>
                <p className="text-xs text-muted-foreground mt-1">Recommended Limit</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </MemberLayout>
  );
}
