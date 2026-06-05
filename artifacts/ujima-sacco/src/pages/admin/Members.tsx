import { useState } from "react";
import { useListMembers, getListMembersQueryKey } from "@workspace/api-client-react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "wouter";
import { Search, ChevronRight } from "lucide-react";

export default function AdminMembers() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useListMembers(
    debouncedSearch ? { search: debouncedSearch, page, limit: 20 } : { page, limit: 20 },
    { query: { queryKey: getListMembersQueryKey(debouncedSearch ? { search: debouncedSearch, page } : { page }) } }
  );

  const handleSearch = (val: string) => {
    setSearch(val);
    setTimeout(() => { setDebouncedSearch(val); setPage(1); }, 400);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground" data-testid="page-title">Members</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage SACCO member accounts</p>
        </div>

        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search by name or email..." value={search} onChange={e => handleSearch(e.target.value)} data-testid="input-search" />
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-48"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
        ) : (
          <Card>
            <CardHeader><CardTitle className="text-base">{data?.total ?? 0} Member{data?.total !== 1 ? "s" : ""}</CardTitle></CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/40">
                      <th className="text-left px-6 py-3 font-medium text-muted-foreground">Name</th>
                      <th className="text-left px-6 py-3 font-medium text-muted-foreground">Email</th>
                      <th className="text-left px-6 py-3 font-medium text-muted-foreground">Phone</th>
                      <th className="text-left px-6 py-3 font-medium text-muted-foreground">KYC</th>
                      <th className="text-left px-6 py-3 font-medium text-muted-foreground">Applications</th>
                      <th className="text-left px-6 py-3 font-medium text-muted-foreground">Loans</th>
                      <th className="text-left px-6 py-3 font-medium text-muted-foreground">Status</th>
                      <th className="px-6 py-3" />
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {data?.data?.map(m => (
                      <tr key={m.id} className="hover:bg-muted/30" data-testid={`member-row-${m.id}`}>
                        <td className="px-6 py-3 font-medium">{m.firstName} {m.lastName}</td>
                        <td className="px-6 py-3 text-muted-foreground">{m.email}</td>
                        <td className="px-6 py-3">{m.phone || "—"}</td>
                        <td className="px-6 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${m.kycStatus === "verified" ? "bg-green-100 text-green-800" : m.kycStatus === "submitted" ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-800"}`}>
                            {m.kycStatus || "pending"}
                          </span>
                        </td>
                        <td className="px-6 py-3">{m.totalApplications ?? 0}</td>
                        <td className="px-6 py-3">{m.activeLoans ?? 0}</td>
                        <td className="px-6 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${m.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                            {m.isActive ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="px-6 py-3">
                          <Link href={`/admin/members/${m.id}`}>
                            <Button variant="ghost" size="sm" className="gap-1 text-primary">View <ChevronRight className="w-3 h-3" /></Button>
                          </Link>
                        </td>
                      </tr>
                    ))}
                    {!data?.data?.length && <tr><td colSpan={8} className="px-6 py-12 text-center text-muted-foreground">No members found</td></tr>}
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
