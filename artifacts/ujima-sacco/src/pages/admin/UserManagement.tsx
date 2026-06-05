import { useListUsers, useUpdateUser, useDeactivateUser, getListUsersQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export default function UserManagement() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: users, isLoading } = useListUsers({ query: { queryKey: getListUsersQueryKey() } });
  const updateUser = useUpdateUser();
  const deactivate = useDeactivateUser();

  const handleToggleRole = (id: number, currentRole: string) => {
    const newRole = currentRole === "admin" ? "applicant" : "admin";
    updateUser.mutate({ id, data: { role: newRole } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListUsersQueryKey() });
        toast({ title: `User role updated to ${newRole}` });
      },
    });
  };

  const handleDeactivate = (id: number) => {
    deactivate.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListUsersQueryKey() });
        toast({ title: "User deactivated" });
      },
    });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground" data-testid="page-title">User Management</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage user accounts and access roles</p>
        </div>

        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
          <p className="font-medium">Administrative Action</p>
          <p>Changes to user roles and account status take effect immediately. Deactivated accounts cannot log in.</p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-48"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
        ) : (
          <Card>
            <CardHeader><CardTitle className="text-base">{users?.length ?? 0} User{users?.length !== 1 ? "s" : ""}</CardTitle></CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/40">
                      <th className="text-left px-6 py-3 font-medium text-muted-foreground">Name</th>
                      <th className="text-left px-6 py-3 font-medium text-muted-foreground">Email</th>
                      <th className="text-left px-6 py-3 font-medium text-muted-foreground">Role</th>
                      <th className="text-left px-6 py-3 font-medium text-muted-foreground">Status</th>
                      <th className="text-left px-6 py-3 font-medium text-muted-foreground">MFA</th>
                      <th className="text-left px-6 py-3 font-medium text-muted-foreground">Joined</th>
                      <th className="px-6 py-3 font-medium text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {users?.map(user => (
                      <tr key={user.id} className="hover:bg-muted/30" data-testid={`user-row-${user.id}`}>
                        <td className="px-6 py-3 font-medium">{user.firstName} {user.lastName}</td>
                        <td className="px-6 py-3 text-muted-foreground">{user.email}</td>
                        <td className="px-6 py-3">
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${user.role === "admin" ? "bg-purple-100 text-purple-800" : "bg-blue-100 text-blue-800"}`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="px-6 py-3">
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${user.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                            {user.isActive ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="px-6 py-3">
                          <span className={`text-xs ${user.mfaEnabled ? "text-green-600 font-medium" : "text-muted-foreground"}`}>
                            {user.mfaEnabled ? "Enabled" : "Disabled"}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-muted-foreground">{new Date(user.createdAt).toLocaleDateString("en-KE")}</td>
                        <td className="px-6 py-3">
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => handleToggleRole(user.id, user.role)} disabled={updateUser.isPending} data-testid={`button-toggle-role-${user.id}`}>
                              {user.role === "admin" ? "Remove Admin" : "Make Admin"}
                            </Button>
                            {user.isActive && (
                              <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-800 hover:bg-red-50" onClick={() => handleDeactivate(user.id)} disabled={deactivate.isPending} data-testid={`button-deactivate-${user.id}`}>
                                Deactivate
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {!users?.length && <tr><td colSpan={7} className="px-6 py-12 text-center text-muted-foreground">No users found</td></tr>}
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
