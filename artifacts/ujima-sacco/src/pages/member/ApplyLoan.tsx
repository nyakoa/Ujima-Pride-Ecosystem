import { useState } from "react";
import { useListLoanProducts, useCreateLoanApplication, useUploadDocument, getListLoanApplicationsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { MemberLayout } from "@/components/layout/MemberLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { ChevronRight, ChevronLeft, CheckCircle2 } from "lucide-react";

const STEPS = ["Select Product", "Employment Details", "Loan Details", "Documents", "Review & Submit"];

function fmt(n: number) {
  return `KES ${n.toLocaleString("en-KE", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export default function ApplyLoan() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(0);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [uploadedDocs, setUploadedDocs] = useState<File[]>([]);
  const [form, setForm] = useState({
    requestedAmount: "", tenureMonths: "", purpose: "",
    employmentStatus: "employed", employerName: "", monthlyIncome: "",
    otherIncome: "", existingLoans: "", businessName: "", businessRevenue: "",
    collateralDescription: "",
  });

  const { data: products } = useListLoanProducts();
  const createApp = useCreateLoanApplication();
  const uploadDoc = useUploadDocument();

  const selectedProduct = products?.find(p => p.id === selectedProductId);

  const handleSubmit = async () => {
    if (!selectedProductId) return;
    try {
      // Upload documents first
      for (const file of uploadedDocs) {
        const fileData = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
        await uploadDoc.mutateAsync({ data: { fileName: file.name, fileType: file.type, documentType: "other", fileData } });
      }

      const app = await createApp.mutateAsync({
        data: {
          loanProductId: selectedProductId,
          requestedAmount: parseFloat(form.requestedAmount),
          tenureMonths: parseInt(form.tenureMonths),
          purpose: form.purpose,
          employmentStatus: form.employmentStatus,
          employerName: form.employerName || null,
          monthlyIncome: parseFloat(form.monthlyIncome),
          otherIncome: form.otherIncome ? parseFloat(form.otherIncome) : null,
          existingLoans: form.existingLoans ? parseFloat(form.existingLoans) : null,
          businessName: form.businessName || null,
          businessRevenue: form.businessRevenue ? parseFloat(form.businessRevenue) : null,
          collateralDescription: form.collateralDescription || null,
        }
      });

      queryClient.invalidateQueries({ queryKey: getListLoanApplicationsQueryKey() });
      toast({ title: "Application submitted!", description: "Your loan application is being processed." });
      setLocation(`/member/applications/${app.id}`);
    } catch {
      toast({ variant: "destructive", title: "Submission failed", description: "Please try again." });
    }
  };

  return (
    <MemberLayout>
      <div className="space-y-6 max-w-3xl">
        <div>
          <h1 className="text-2xl font-bold text-foreground" data-testid="page-title">Apply for a Loan</h1>
          <p className="text-muted-foreground text-sm mt-1">Complete all steps to submit your application</p>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-2">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold flex-shrink-0 ${i < step ? "bg-primary text-white" : i === step ? "bg-primary text-white ring-2 ring-primary/30" : "bg-muted text-muted-foreground"}`}>
                {i < step ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
              </div>
              <span className={`text-xs hidden md:block ${i === step ? "text-foreground font-medium" : "text-muted-foreground"}`}>{s}</span>
              {i < STEPS.length - 1 && <div className={`flex-1 h-0.5 ${i < step ? "bg-primary" : "bg-muted"}`} />}
            </div>
          ))}
        </div>

        <Card>
          <CardHeader><CardTitle className="text-base">{STEPS[step]}</CardTitle></CardHeader>
          <CardContent className="space-y-4">

            {/* Step 0: Select Product */}
            {step === 0 && (
              <div className="grid gap-3">
                {products?.map(product => (
                  <button
                    key={product.id}
                    onClick={() => setSelectedProductId(product.id)}
                    data-testid={`product-${product.id}`}
                    className={`text-left p-4 rounded-lg border-2 transition-colors ${selectedProductId === product.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-sm">{product.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{fmt(product.minAmount)} – {fmt(product.maxAmount)} &middot; {product.interestRate}% p.a.</p>
                        <p className="text-xs text-muted-foreground">{product.minTenureMonths}–{product.maxTenureMonths} months</p>
                      </div>
                      <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 ${selectedProductId === product.id ? "border-primary bg-primary" : "border-muted-foreground"}`} />
                    </div>
                    {product.description && <p className="text-xs text-muted-foreground mt-2">{product.description}</p>}
                  </button>
                ))}
              </div>
            )}

            {/* Step 1: Employment Details */}
            {step === 1 && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1 col-span-2">
                  <Label htmlFor="employmentStatus">Employment Status</Label>
                  <select id="employmentStatus" data-testid="input-employmentStatus" className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm" value={form.employmentStatus} onChange={e => setForm(f => ({ ...f, employmentStatus: e.target.value }))}>
                    <option value="employed">Employed</option>
                    <option value="self_employed">Self Employed</option>
                    <option value="business_owner">Business Owner</option>
                    <option value="unemployed">Unemployed</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="employerName">Employer / Business Name</Label>
                  <Input id="employerName" data-testid="input-employerName" value={form.employerName} onChange={e => setForm(f => ({ ...f, employerName: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="monthlyIncome">Monthly Income (KES) *</Label>
                  <Input id="monthlyIncome" data-testid="input-monthlyIncome" type="number" value={form.monthlyIncome} onChange={e => setForm(f => ({ ...f, monthlyIncome: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="otherIncome">Other Income (KES)</Label>
                  <Input id="otherIncome" data-testid="input-otherIncome" type="number" value={form.otherIncome} onChange={e => setForm(f => ({ ...f, otherIncome: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="existingLoans">Existing Loan Obligations (KES)</Label>
                  <Input id="existingLoans" data-testid="input-existingLoans" type="number" value={form.existingLoans} onChange={e => setForm(f => ({ ...f, existingLoans: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="businessName">Business Name (if applicable)</Label>
                  <Input id="businessName" data-testid="input-businessName" value={form.businessName} onChange={e => setForm(f => ({ ...f, businessName: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="businessRevenue">Business Revenue (KES/month)</Label>
                  <Input id="businessRevenue" data-testid="input-businessRevenue" type="number" value={form.businessRevenue} onChange={e => setForm(f => ({ ...f, businessRevenue: e.target.value }))} />
                </div>
              </div>
            )}

            {/* Step 2: Loan Details */}
            {step === 2 && (
              <div className="space-y-4">
                {selectedProduct && (
                  <div className="p-3 bg-muted/40 rounded-lg text-sm">
                    <p className="font-medium">{selectedProduct.name}</p>
                    <p className="text-muted-foreground text-xs mt-0.5">
                      Range: {fmt(selectedProduct.minAmount)} – {fmt(selectedProduct.maxAmount)} &middot;
                      Tenure: {selectedProduct.minTenureMonths}–{selectedProduct.maxTenureMonths} months &middot;
                      Rate: {selectedProduct.interestRate}% p.a.
                    </p>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="requestedAmount">Loan Amount (KES) *</Label>
                    <Input id="requestedAmount" data-testid="input-requestedAmount" type="number" value={form.requestedAmount} onChange={e => setForm(f => ({ ...f, requestedAmount: e.target.value }))} placeholder={selectedProduct ? `${selectedProduct.minAmount}–${selectedProduct.maxAmount}` : ""} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="tenureMonths">Repayment Period (months) *</Label>
                    <Input id="tenureMonths" data-testid="input-tenureMonths" type="number" value={form.tenureMonths} onChange={e => setForm(f => ({ ...f, tenureMonths: e.target.value }))} placeholder={selectedProduct ? `${selectedProduct.minTenureMonths}–${selectedProduct.maxTenureMonths}` : ""} />
                  </div>
                  <div className="space-y-1 col-span-2">
                    <Label htmlFor="purpose">Purpose of Loan *</Label>
                    <Textarea id="purpose" data-testid="input-purpose" value={form.purpose} onChange={e => setForm(f => ({ ...f, purpose: e.target.value }))} placeholder="Describe how you will use this loan..." rows={3} />
                  </div>
                  <div className="space-y-1 col-span-2">
                    <Label htmlFor="collateralDescription">Collateral Description</Label>
                    <Textarea id="collateralDescription" data-testid="input-collateral" value={form.collateralDescription} onChange={e => setForm(f => ({ ...f, collateralDescription: e.target.value }))} placeholder="Describe any assets you can offer as security..." rows={2} />
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Documents */}
            {step === 3 && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">Upload supporting documents (National ID, payslip, bank statements, etc.)</p>
                {selectedProduct?.requirements && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
                    <p className="font-medium mb-1">Required Documents:</p>
                    <p>{selectedProduct.requirements}</p>
                  </div>
                )}
                <div className="border-2 border-dashed border-muted-foreground/30 rounded-lg p-8 text-center">
                  <Label htmlFor="doc-upload-apply" className="cursor-pointer">
                    <p className="text-sm font-medium">Click to upload files</p>
                    <p className="text-xs text-muted-foreground mt-1">PDF, JPG, PNG up to 10MB</p>
                    <Input id="doc-upload-apply" type="file" multiple className="hidden" onChange={e => {
                      const files = Array.from(e.target.files || []);
                      setUploadedDocs(prev => [...prev, ...files]);
                    }} data-testid="input-file-upload" />
                  </Label>
                </div>
                {uploadedDocs.length > 0 && (
                  <div className="space-y-2">
                    {uploadedDocs.map((f, i) => (
                      <div key={i} className="flex items-center justify-between p-2 bg-muted/40 rounded text-sm">
                        <span>{f.name}</span>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-red-500" onClick={() => setUploadedDocs(prev => prev.filter((_, j) => j !== i))}>×</Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Step 4: Review */}
            {step === 4 && (
              <div className="space-y-4 text-sm">
                <div className="grid grid-cols-2 gap-3 p-4 bg-muted/40 rounded-lg">
                  <div><p className="text-muted-foreground">Product</p><p className="font-medium">{selectedProduct?.name}</p></div>
                  <div><p className="text-muted-foreground">Amount</p><p className="font-medium">{form.requestedAmount ? fmt(parseFloat(form.requestedAmount)) : "—"}</p></div>
                  <div><p className="text-muted-foreground">Tenure</p><p className="font-medium">{form.tenureMonths} months</p></div>
                  <div><p className="text-muted-foreground">Monthly Income</p><p className="font-medium">{form.monthlyIncome ? fmt(parseFloat(form.monthlyIncome)) : "—"}</p></div>
                  <div><p className="text-muted-foreground">Employment</p><p className="font-medium capitalize">{form.employmentStatus.replace("_", " ")}</p></div>
                  <div><p className="text-muted-foreground">Documents</p><p className="font-medium">{uploadedDocs.length} file(s)</p></div>
                  <div className="col-span-2"><p className="text-muted-foreground">Purpose</p><p className="font-medium">{form.purpose}</p></div>
                </div>
                <p className="text-xs text-muted-foreground">By submitting this application, you confirm that all information provided is accurate and complete. The AI system will conduct an initial assessment, followed by review by our credit team.</p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-between">
          <Button variant="outline" onClick={() => setStep(s => Math.max(0, s - 1))} disabled={step === 0} className="gap-2">
            <ChevronLeft className="w-4 h-4" /> Back
          </Button>
          {step < STEPS.length - 1 ? (
            <Button onClick={() => setStep(s => s + 1)} disabled={step === 0 && !selectedProductId} className="gap-2" data-testid="button-next-step">
              Next <ChevronRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={createApp.isPending} className="gap-2" data-testid="button-submit-application">
              {createApp.isPending ? "Submitting..." : "Submit Application"}
            </Button>
          )}
        </div>
      </div>
    </MemberLayout>
  );
}
