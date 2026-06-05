import { useState } from "react";
import { useGetLoanApplication, useGetAiAssessment, useReviewLoanApplication, getGetLoanApplicationQueryKey, getGetAiAssessmentQueryKey, getListAllLoanApplicationsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useRoute, Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, CheckCircle, XCircle, AlertCircle } from "lucide-react";

function fmt(n: number) {
  return `KES ${n.toLocaleString("en-KE", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export default function ApplicationReview() {
  const [, params] = useRoute("/admin/applications/:id");
  const id = parseInt(params?.id || "0");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: app, isLoading } = useGetLoanApplication(id, {
    query: { enabled: !!id, queryKey: getGetLoanApplicationQueryKey(id) }
  });
  const { data: assessment } = useGetAiAssessment(id, {
    query: { enabled: !!id, queryKey: getGetAiAssessmentQueryKey(id) }
  });

  const reviewMutation = useReviewLoanApplication();

  const [decision, setDecision] = useState("");
  const [approvedAmount, setApprovedAmount] = useState("");
  const [approvedTenure, setApprovedTenure] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");

  const handleReview = () => {
    if (!decision) { toast({ variant: "destructive", title: "Please select a decision" }); return; }
    reviewMutation.mutate({
      id,
      data: {
        decision: decision as any,
        approvedAmount: approvedAmount ? parseFloat(approvedAmount) : null,
        approvedTenure: approvedTenure ? parseInt(approvedTenure) : null,
        adminNotes: adminNotes || null,
        rejectionReason: rejectionReason || null,
      }
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetLoanApplicationQueryKey(id) });
        queryClient.invalidateQueries({ queryKey: getListAllLoanApplicationsQueryKey() });
        toast({ title: "Review submitted", description: `Application has been ${decision}` });
      },
      onError: () => toast({ variant: "destructive", title: "Failed to submit review" }),
    });
  };

  if (isLoading) {
    return <AdminLayout><div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div></AdminLayout>;
  }

  if (!app) {
    return <AdminLayout><div className="text-center py-16"><p className="text-muted-foreground">Application not found</p></div></AdminLayout>;
  }

  const isReviewed = ["approved", "rejected", "disbursed"].includes(app.status);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/admin/applications">
            <Button variant="ghost" size="sm" className="gap-1"><ArrowLeft className="w-4 h-4" /> Applications</Button>
          </Link>
          <h1 className="text-2xl font-bold text-foreground" data-testid="page-title">Application #{app.id}</h1>
          <span className={`ml-auto px-3 py-1 rounded-full text-sm font-medium ${
            app.status === "approved" ? "bg-green-100 text-green-800" :
            app.status === "rejected" ? "bg-red-100 text-red-800" :
            app.status === "under_review" ? "bg-amber-100 text-amber-800" :
            "bg-gray-100 text-gray-800"
          }`}>{app.status.replace(/_/g, " ")}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Application Info */}
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader><CardTitle className="text-base">Application Details</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-2 gap-4 text-sm">
                <div><p className="text-muted-foreground">Loan Product</p><p className="font-medium">{app.loanProduct?.name}</p></div>
                <div><p className="text-muted-foreground">Requested Amount</p><p className="font-medium">{fmt(app.requestedAmount)}</p></div>
                <div><p className="text-muted-foreground">Tenure</p><p className="font-medium">{app.tenureMonths} months</p></div>
                <div><p className="text-muted-foreground">Monthly Income</p><p className="font-medium">{fmt(app.monthlyIncome)}</p></div>
                <div><p className="text-muted-foreground">Employment Status</p><p className="font-medium capitalize">{app.employmentStatus.replace("_", " ")}</p></div>
                <div><p className="text-muted-foreground">Pipeline Stage</p><p className="font-medium capitalize text-xs">{app.pipelineStage?.replace(/_/g, " ")}</p></div>
                <div className="col-span-2"><p className="text-muted-foreground">Purpose</p><p className="font-medium">{app.purpose}</p></div>
                <div><p className="text-muted-foreground">Applied</p><p className="font-medium">{new Date(app.createdAt).toLocaleDateString("en-KE")}</p></div>
                {app.approvedAmount && <div><p className="text-muted-foreground">Approved Amount</p><p className="font-medium text-green-700">{fmt(app.approvedAmount)}</p></div>}
                {app.adminNotes && <div className="col-span-2"><p className="text-muted-foreground">Admin Notes</p><p className="font-medium">{app.adminNotes}</p></div>}
                {app.rejectionReason && <div className="col-span-2"><p className="text-muted-foreground">Rejection Reason</p><p className="font-medium text-red-700">{app.rejectionReason}</p></div>}
              </CardContent>
            </Card>

            {/* AI Assessment */}
            {assessment && (
              <Card>
                <CardHeader><CardTitle className="text-base">AI Assessment Report</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-3 bg-muted/40 rounded-lg">
                      <p className="text-2xl font-bold text-primary">{Math.round(assessment.creditScore)}</p>
                      <p className="text-xs text-muted-foreground">Credit Score /850</p>
                    </div>
                    <div className="text-center p-3 bg-muted/40 rounded-lg">
                      <p className="text-2xl font-bold">{Math.round(assessment.riskScore)}</p>
                      <p className="text-xs text-muted-foreground">Risk Score /100</p>
                    </div>
                    <div className="text-center p-3 bg-muted/40 rounded-lg">
                      <p className="text-2xl font-bold">{Math.round(assessment.approvalProbability)}%</p>
                      <p className="text-xs text-muted-foreground">Approval Prob.</p>
                    </div>
                    <div className="text-center p-3 bg-muted/40 rounded-lg">
                      <p className={`text-lg font-bold capitalize ${
                        assessment.riskLevel === "low" ? "text-green-600" :
                        assessment.riskLevel === "medium" ? "text-amber-600" :
                        assessment.riskLevel === "high" ? "text-orange-600" : "text-red-600"
                      }`}>{assessment.riskLevel?.replace("_", " ")}</p>
                      <p className="text-xs text-muted-foreground">Risk Level</p>
                    </div>
                  </div>

                  <div className="p-3 bg-muted/40 rounded-lg">
                    <p className="text-xs font-semibold text-muted-foreground mb-1">RECOMMENDED LIMIT</p>
                    <p className="text-xl font-bold">{fmt(assessment.recommendedLimit)}</p>
                  </div>

                  {assessment.loanTerms && (
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      {Object.entries(assessment.loanTerms as Record<string, any>).map(([k, v]) => (
                        <div key={k} className="p-2 bg-muted/30 rounded">
                          <p className="text-xs text-muted-foreground capitalize">{k.replace(/([A-Z])/g, " $1").trim()}</p>
                          <p className="font-medium">{typeof v === "number" && k !== "suggestedInterestRate" && k !== "recommendedTenure" ? fmt(v) : v}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {[
                    { label: "Scout Agent Analysis", text: assessment.scoutSummary },
                    { label: "Guardian Agent Risk Assessment", text: assessment.guardianSummary },
                    { label: "Hunter Agent Recommendation", text: assessment.hunterSummary },
                  ].filter(s => s.text).map(s => (
                    <div key={s.label} className="p-3 border rounded-lg text-sm">
                      <p className="font-semibold text-xs text-muted-foreground mb-1">{s.label}</p>
                      <p>{s.text}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Review Panel */}
          <div>
            <Card>
              <CardHeader><CardTitle className="text-base">Admin Review</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {isReviewed ? (
                  <div className={`flex items-center gap-3 p-4 rounded-lg ${app.status === "approved" ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"}`}>
                    {app.status === "approved" ? <CheckCircle className="w-5 h-5 text-green-600" /> : <XCircle className="w-5 h-5 text-red-600" />}
                    <div>
                      <p className={`font-medium text-sm ${app.status === "approved" ? "text-green-800" : "text-red-800"}`}>
                        {app.status === "approved" ? "Application Approved" : "Application Rejected"}
                      </p>
                      {app.approvedAmount && <p className="text-xs text-green-700 mt-0.5">Approved: {fmt(app.approvedAmount)}</p>}
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="space-y-1">
                      <Label>Decision *</Label>
                      <div className="grid grid-cols-1 gap-2">
                        {[
                          { val: "approved", label: "Approve", icon: CheckCircle, color: "border-green-500 bg-green-50 text-green-800" },
                          { val: "rejected", label: "Reject", icon: XCircle, color: "border-red-500 bg-red-50 text-red-800" },
                          { val: "additional_info_required", label: "Request Info", icon: AlertCircle, color: "border-orange-500 bg-orange-50 text-orange-800" },
                        ].map(opt => (
                          <button key={opt.val} onClick={() => setDecision(opt.val)} data-testid={`decision-${opt.val}`}
                            className={`flex items-center gap-2 p-3 rounded-lg border-2 text-sm font-medium transition-colors ${decision === opt.val ? opt.color : "border-border hover:border-muted-foreground/50"}`}>
                            <opt.icon className="w-4 h-4" />{opt.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {decision === "approved" && (
                      <>
                        <div className="space-y-1">
                          <Label htmlFor="approvedAmount">Approved Amount (KES)</Label>
                          <Input id="approvedAmount" data-testid="input-approvedAmount" type="number" value={approvedAmount} onChange={e => setApprovedAmount(e.target.value)} placeholder={assessment?.recommendedLimit ? Math.round(assessment.recommendedLimit).toString() : ""} />
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor="approvedTenure">Approved Tenure (months)</Label>
                          <Input id="approvedTenure" data-testid="input-approvedTenure" type="number" value={approvedTenure} onChange={e => setApprovedTenure(e.target.value)} />
                        </div>
                      </>
                    )}

                    {decision === "rejected" && (
                      <div className="space-y-1">
                        <Label htmlFor="rejectionReason">Rejection Reason</Label>
                        <Textarea id="rejectionReason" data-testid="input-rejectionReason" value={rejectionReason} onChange={e => setRejectionReason(e.target.value)} rows={3} />
                      </div>
                    )}

                    <div className="space-y-1">
                      <Label htmlFor="adminNotes">Admin Notes</Label>
                      <Textarea id="adminNotes" data-testid="input-adminNotes" value={adminNotes} onChange={e => setAdminNotes(e.target.value)} placeholder="Internal notes..." rows={3} />
                    </div>

                    <Button className="w-full" onClick={handleReview} disabled={reviewMutation.isPending || !decision} data-testid="button-submit-review">
                      {reviewMutation.isPending ? "Submitting..." : "Submit Review"}
                    </Button>

                    <p className="text-xs text-muted-foreground text-center">AI recommendations are advisory only. Final decision authority rests with the administrator.</p>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
