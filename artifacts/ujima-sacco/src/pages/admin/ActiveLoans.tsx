import { useListAllActiveLoans, getListAllActiveLoansQueryKey } from "@workspace/api-client-react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function fmt(n: number) {
  return `KES ${n.toLocaleString("en-KE", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export default function AdminActiveLoans() {
  const { data, isLoading } = useListAllActiveLoans({ query: { queryKey: getListAllActiveLoansQueryKey() } });

  const totalOutstanding = data?.reduce((s, l) => s + l.outstandingBalance, 0) ?? 0;
  const totalPrincipal = data?.reduce((s, l) => s + l.principalAmount, 0) ?? 0;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground" data-testid="page-title">Active Loans</h1>
          <p className="text-muted-foreground text-sm mt-1">Portfolio of all active member loans</p>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground font-medium">Total Loans</CardTitle></CardHeader>
            <CardContent><p className="text-3xl font-bold">{data?.length ?? 0}</p></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground font-medium">Total Principal</CardTitle></CardHeader>
            <CardContent><p className="text-xl font-bold">{fmt(totalPrincipal)}</p></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground font-medium">Outstanding Balance</CardTitle></CardHeader>
            <CardContent><p className="text-xl font-bold text-amber-600">{fmt(totalOutstanding)}</p></CardContent>
          </Card>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-48"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/40">
                      <th className="text-left px-6 py-3 font-medium text-muted-foreground">ID</th>
                      <th className="text-left px-6 py-3 font-medium text-muted-foreground">Member</th>
                      <th className="text-left px-6 py-3 font-medium text-muted-foreground">Product</th>
                      <th className="text-left px-6 py-3 font-medium text-muted-foreground">Principal</th>
                      <th className="text-left px-6 py-3 font-medium text-muted-foreground">Outstanding</th>
                      <th className="text-left px-6 py-3 font-medium text-muted-foreground">Monthly</th>
                      <th className="text-left px-6 py-3 font-medium text-muted-foreground">Next Payment</th>
                      <th className="text-left px-6 py-3 font-medium text-muted-foreground">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {data?.map(loan => (
                      <tr key={loan.id} className="hover:bg-muted/30" data-testid={`loan-row-${loan.id}`}>
                        <td className="px-6 py-3 font-mono text-xs">#{loan.id}</td>
                        <td className="px-6 py-3">{loan.memberName || `Member #${loan.userId}`}</td>
                        <td className="px-6 py-3">{loan.loanProduct?.name || "—"}</td>
                        <td className="px-6 py-3">{fmt(loan.principalAmount)}</td>
                        <td className="px-6 py-3 text-amber-600 font-medium">{fmt(loan.outstandingBalance)}</td>
                        <td className="px-6 py-3">{fmt(loan.monthlyInstalment)}</td>
                        <td className="px-6 py-3">{loan.nextPaymentDate ? new Date(loan.nextPaymentDate).toLocaleDateString("en-KE") : "—"}</td>
                        <td className="px-6 py-3">
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            loan.status === "active" ? "bg-green-100 text-green-800" :
                            loan.status === "defaulted" ? "bg-red-100 text-red-800" :
                            "bg-gray-100 text-gray-800"
                          }`}>{loan.status}</span>
                        </td>
                      </tr>
                    ))}
                    {!data?.length && <tr><td colSpan={8} className="px-6 py-12 text-center text-muted-foreground">No active loans</td></tr>}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
}
