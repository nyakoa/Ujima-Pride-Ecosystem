import { useListActiveLoans, getListActiveLoansQueryKey } from "@workspace/api-client-react";
import { MemberLayout } from "@/components/layout/MemberLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { CreditCard } from "lucide-react";

function fmt(n: number) {
  return `KES ${n.toLocaleString("en-KE", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export default function ActiveLoans() {
  const { data, isLoading } = useListActiveLoans({
    query: { queryKey: getListActiveLoansQueryKey() }
  });

  return (
    <MemberLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground" data-testid="page-title">Active Loans</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage your current loan obligations</p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : !data?.length ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <CreditCard className="w-12 h-12 text-muted-foreground opacity-30 mb-4" />
              <p className="font-medium text-foreground">No active loans</p>
              <p className="text-muted-foreground text-sm mt-1">Apply for a loan to get started</p>
              <Link href="/member/apply">
                <Button className="mt-4">Apply for a Loan</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {data.map((loan) => {
              const repaymentPct = loan.principalAmount > 0 ? (loan.totalRepaid / loan.principalAmount) * 100 : 0;
              return (
                <Card key={loan.id} data-testid={`loan-card-${loan.id}`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{loan.loanProduct?.name || "Loan"}</CardTitle>
                      <span className="text-xs bg-green-100 text-green-800 px-2.5 py-0.5 rounded-full font-medium">Active</span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Principal</p>
                        <p className="font-semibold">{fmt(loan.principalAmount)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Outstanding</p>
                        <p className="font-semibold text-amber-600">{fmt(loan.outstandingBalance)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Monthly Payment</p>
                        <p className="font-semibold">{fmt(loan.monthlyInstalment)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Interest Rate</p>
                        <p className="font-semibold">{loan.interestRate}% p.a.</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Total Repaid</p>
                        <p className="font-semibold text-green-600">{fmt(loan.totalRepaid)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Next Payment</p>
                        <p className="font-semibold">{loan.nextPaymentDate ? new Date(loan.nextPaymentDate).toLocaleDateString("en-KE") : "—"}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Maturity Date</p>
                        <p className="font-semibold">{loan.maturityDate ? new Date(loan.maturityDate).toLocaleDateString("en-KE") : "—"}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Tenure</p>
                        <p className="font-semibold">{loan.tenureMonths} months</p>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs text-muted-foreground mb-1">
                        <span>Repayment Progress</span>
                        <span>{repaymentPct.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div className="bg-primary h-2 rounded-full transition-all" style={{ width: `${Math.min(100, repaymentPct)}%` }} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </MemberLayout>
  );
}
