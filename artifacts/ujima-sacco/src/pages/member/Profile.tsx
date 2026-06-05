import { useState } from "react";
import { useGetProfile, useUpdateProfile, useGetKyc, useSubmitKyc, useListDocuments, useUploadDocument, useDeleteDocument, getGetProfileQueryKey, getGetKycQueryKey, getListDocumentsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { MemberLayout } from "@/components/layout/MemberLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Upload } from "lucide-react";

function fmt(val: string | number | null | undefined) {
  return val ?? "—";
}

export default function Profile() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: profile, isLoading } = useGetProfile({ query: { queryKey: getGetProfileQueryKey() } });
  const { data: kyc } = useGetKyc({ query: { queryKey: getGetKycQueryKey() } });
  const { data: documents } = useListDocuments({ query: { queryKey: getListDocumentsQueryKey() } });

  const updateProfile = useUpdateProfile();
  const submitKyc = useSubmitKyc();
  const uploadDoc = useUploadDocument();
  const deleteDoc = useDeleteDocument();

  const [profileForm, setProfileForm] = useState({ firstName: "", lastName: "", phone: "" });
  const [kycForm, setKycForm] = useState({
    dateOfBirth: "", gender: "", county: "", subCounty: "", ward: "", physicalAddress: "",
    employmentStatus: "", employerName: "", monthlyIncome: "", otherIncome: "",
    nextOfKinName: "", nextOfKinPhone: "", nextOfKinRelationship: "",
  });

  const handleProfileSave = () => {
    updateProfile.mutate({ data: { firstName: profileForm.firstName || profile?.firstName, lastName: profileForm.lastName || profile?.lastName, phone: profileForm.phone || profile?.phone || undefined } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetProfileQueryKey() });
        toast({ title: "Profile updated successfully" });
      },
      onError: () => toast({ variant: "destructive", title: "Failed to update profile" }),
    });
  };

  const handleKycSubmit = () => {
    submitKyc.mutate({ data: { ...kycForm, monthlyIncome: parseFloat(kycForm.monthlyIncome || "0"), otherIncome: kycForm.otherIncome ? parseFloat(kycForm.otherIncome) : undefined } as any }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetKycQueryKey() });
        toast({ title: "KYC submitted successfully" });
      },
      onError: () => toast({ variant: "destructive", title: "Failed to submit KYC" }),
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      uploadDoc.mutate({ data: { fileName: file.name, fileType: file.type, documentType: "other", fileData: reader.result as string } }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListDocumentsQueryKey() });
          toast({ title: "Document uploaded" });
        },
        onError: () => toast({ variant: "destructive", title: "Upload failed" }),
      });
    };
    reader.readAsDataURL(file);
  };

  if (isLoading) {
    return (
      <MemberLayout>
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </MemberLayout>
    );
  }

  return (
    <MemberLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground" data-testid="page-title">My Profile</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage your personal information and KYC</p>
        </div>

        <Tabs defaultValue="personal">
          <TabsList>
            <TabsTrigger value="personal">Personal Info</TabsTrigger>
            <TabsTrigger value="kyc">KYC</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
          </TabsList>

          <TabsContent value="personal" className="space-y-4 mt-4">
            <Card>
              <CardHeader><CardTitle className="text-base">Account Information</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                  <div><p className="text-muted-foreground">Email</p><p className="font-medium">{profile?.email}</p></div>
                  <div><p className="text-muted-foreground">Role</p><p className="font-medium capitalize">{profile?.role}</p></div>
                  <div><p className="text-muted-foreground">KYC Status</p><p className="font-medium capitalize">{profile?.kycStatus || "pending"}</p></div>
                  <div><p className="text-muted-foreground">Member Since</p><p className="font-medium">{profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString("en-KE") : "—"}</p></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="input-firstName">First Name</Label>
                    <Input id="input-firstName" data-testid="input-firstName" defaultValue={profile?.firstName} onChange={e => setProfileForm(f => ({ ...f, firstName: e.target.value }))} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="input-lastName">Last Name</Label>
                    <Input id="input-lastName" data-testid="input-lastName" defaultValue={profile?.lastName} onChange={e => setProfileForm(f => ({ ...f, lastName: e.target.value }))} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="input-phone">Phone</Label>
                    <Input id="input-phone" data-testid="input-phone" defaultValue={profile?.phone || ""} onChange={e => setProfileForm(f => ({ ...f, phone: e.target.value }))} />
                  </div>
                </div>
                <Button onClick={handleProfileSave} disabled={updateProfile.isPending} data-testid="button-save-profile">
                  {updateProfile.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="kyc" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">KYC Information</CardTitle>
                  {kyc && <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${kyc.status === "verified" ? "bg-green-100 text-green-800" : kyc.status === "submitted" ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-800"}`}>{kyc.status}</span>}
                </div>
              </CardHeader>
              <CardContent>
                {kyc?.status === "verified" ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                    <div><p className="text-muted-foreground">Date of Birth</p><p className="font-medium">{fmt(kyc.dateOfBirth)}</p></div>
                    <div><p className="text-muted-foreground">Gender</p><p className="font-medium">{fmt(kyc.gender)}</p></div>
                    <div><p className="text-muted-foreground">County</p><p className="font-medium">{fmt(kyc.county)}</p></div>
                    <div><p className="text-muted-foreground">Employment</p><p className="font-medium">{fmt(kyc.employmentStatus)}</p></div>
                    <div><p className="text-muted-foreground">Monthly Income</p><p className="font-medium">{kyc.monthlyIncome ? `KES ${Number(kyc.monthlyIncome).toLocaleString()}` : "—"}</p></div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      {[
                        { id: "dateOfBirth", label: "Date of Birth", type: "date" },
                        { id: "gender", label: "Gender (M/F/Other)" },
                        { id: "county", label: "County" },
                        { id: "subCounty", label: "Sub-County" },
                        { id: "ward", label: "Ward" },
                        { id: "physicalAddress", label: "Physical Address" },
                        { id: "employmentStatus", label: "Employment Status" },
                        { id: "employerName", label: "Employer Name" },
                        { id: "monthlyIncome", label: "Monthly Income (KES)", type: "number" },
                        { id: "otherIncome", label: "Other Income (KES)", type: "number" },
                        { id: "nextOfKinName", label: "Next of Kin Name" },
                        { id: "nextOfKinPhone", label: "Next of Kin Phone" },
                        { id: "nextOfKinRelationship", label: "Next of Kin Relationship" },
                      ].map(field => (
                        <div key={field.id} className="space-y-1">
                          <Label htmlFor={`kyc-${field.id}`}>{field.label}</Label>
                          <Input
                            id={`kyc-${field.id}`}
                            data-testid={`input-kyc-${field.id}`}
                            type={field.type || "text"}
                            defaultValue={(kyc as any)?.[field.id] || ""}
                            onChange={e => setKycForm(f => ({ ...f, [field.id]: e.target.value }))}
                          />
                        </div>
                      ))}
                    </div>
                    <Button onClick={handleKycSubmit} disabled={submitKyc.isPending} data-testid="button-submit-kyc">
                      {submitKyc.isPending ? "Submitting..." : "Submit KYC"}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="documents" className="space-y-4 mt-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">My Documents</CardTitle>
                <Label htmlFor="doc-upload" className="cursor-pointer">
                  <Button variant="outline" size="sm" className="gap-2" asChild>
                    <span><Upload className="w-4 h-4" /> Upload Document</span>
                  </Button>
                  <Input id="doc-upload" type="file" className="hidden" onChange={handleFileUpload} />
                </Label>
              </CardHeader>
              <CardContent>
                {!documents?.length ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p className="text-sm">No documents uploaded</p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {documents.map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between py-3" data-testid={`doc-row-${doc.id}`}>
                        <div>
                          <p className="text-sm font-medium">{doc.fileName}</p>
                          <p className="text-xs text-muted-foreground capitalize">{doc.documentType.replace("_", " ")} &middot; {new Date(doc.createdAt).toLocaleDateString("en-KE")}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${doc.status === "verified" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}>{doc.status}</span>
                          <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700 h-8 w-8 p-0" onClick={() => {
                            deleteDoc.mutate({ id: doc.id }, {
                              onSuccess: () => queryClient.invalidateQueries({ queryKey: getListDocumentsQueryKey() }),
                            });
                          }} data-testid={`button-delete-doc-${doc.id}`}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MemberLayout>
  );
}
