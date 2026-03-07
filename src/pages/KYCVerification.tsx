import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Upload, FileCheck, AlertCircle, CheckCircle2, Clock, Camera, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { logAudit } from "@/lib/audit";
import AppLayout from "@/components/layout/AppLayout";
import type { KycVerification } from "@/types";

const documentTypes = [
  { value: "passport", label: "Passport" },
  { value: "drivers_license", label: "Driver's License" },
  { value: "national_id", label: "National ID Card" },
];

const statusConfig: Record<string, { icon: any; color: string; label: string; desc: string }> = {
  pending: { icon: Clock, color: "text-muted-foreground", label: "Not Submitted", desc: "Upload your documents to begin verification" },
  submitted: { icon: Upload, color: "text-amber-400", label: "Submitted", desc: "Your documents have been submitted for review" },
  under_review: { icon: Clock, color: "text-blue-400", label: "Under Review", desc: "Our team is reviewing your documents" },
  approved: { icon: CheckCircle2, color: "text-primary", label: "Approved", desc: "Your identity has been verified" },
  rejected: { icon: AlertCircle, color: "text-destructive", label: "Rejected", desc: "Please resubmit your documents" },
};

const KYCVerification = () => {
  const { user } = useAuth();
  const [kyc, setKyc] = useState<KycVerification | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [docType, setDocType] = useState("passport");
  const [docFile, setDocFile] = useState<File | null>(null);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [docPreview, setDocPreview] = useState<string | null>(null);
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null);

  const fetchKYC = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("kyc_verifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) toast.error("Failed to load KYC status");
    else setKyc(data);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchKYC(); }, [fetchKYC]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: "doc" | "selfie") => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File must be under 10MB");
      return;
    }
    if (type === "doc") {
      setDocFile(file);
      setDocPreview(URL.createObjectURL(file));
    } else {
      setSelfieFile(file);
      setSelfiePreview(URL.createObjectURL(file));
    }
  };

  const uploadFile = async (file: File, path: string) => {
    const { error } = await supabase.storage.from("kyc-documents").upload(path, file, { upsert: true });
    if (error) throw error;
    return path;
  };

  const handleSubmit = async () => {
    if (!user || !docFile || !selfieFile) {
      toast.error("Please upload both document and selfie");
      return;
    }
    setSubmitting(true);
    try {
      const timestamp = Date.now();
      const docPath = `${user.id}/document-${timestamp}.${docFile.name.split('.').pop()}`;
      const selfiePath = `${user.id}/selfie-${timestamp}.${selfieFile.name.split('.').pop()}`;

      await uploadFile(docFile, docPath);
      await uploadFile(selfieFile, selfiePath);

      const { error } = await supabase.from("kyc_verifications").insert({
        user_id: user.id,
        document_type: docType,
        document_url: docPath,
        selfie_url: selfiePath,
        status: "submitted" as any,
        submitted_at: new Date().toISOString(),
      });

      if (error) throw error;

      await logAudit({ action: "kyc_submitted", entity_type: "kyc", metadata: { document_type: docType } });
      toast.success("KYC documents submitted successfully!");
      setDocFile(null);
      setSelfieFile(null);
      setDocPreview(null);
      setSelfiePreview(null);
      fetchKYC();
    } catch (err: any) {
      toast.error(err.message || "Failed to submit KYC");
    } finally {
      setSubmitting(false);
    }
  };

  const currentStatus = kyc?.status || "pending";
  const config = statusConfig[currentStatus] || statusConfig.pending;
  const StatusIcon = config.icon;
  const canSubmit = currentStatus === "pending" || currentStatus === "rejected";

  return (
    <AppLayout>
      <div className="p-6 lg:p-8 max-w-3xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="font-heading font-bold text-3xl text-foreground mb-1">Identity Verification</h1>
          <p className="font-body text-sm text-muted-foreground">Complete KYC to unlock higher investment limits</p>
        </motion.div>

        {/* Status Card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div className="bg-card border border-border rounded-lg p-6 mb-6">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-full bg-secondary flex items-center justify-center ${config.color}`}>
                <StatusIcon size={22} />
              </div>
              <div>
                <h3 className="font-heading font-bold text-lg text-foreground">{config.label}</h3>
                <p className="font-body text-sm text-muted-foreground">{config.desc}</p>
              </div>
            </div>
            {kyc?.review_notes && (
              <div className="mt-4 p-3 bg-destructive/5 border border-destructive/20 rounded-lg">
                <p className="font-body text-sm text-destructive">Reviewer note: {kyc.review_notes}</p>
              </div>
            )}

            {/* Progress Steps */}
            <div className="mt-6 flex items-center gap-2">
              {["Upload", "Review", "Verified"].map((step, i) => {
                const stepIndex = currentStatus === "approved" ? 2 : currentStatus === "submitted" || currentStatus === "under_review" ? 1 : 0;
                return (
                  <div key={step} className="flex items-center gap-2 flex-1">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-mono ${i <= stepIndex ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                      }`}>
                      {i < stepIndex ? "✓" : i + 1}
                    </div>
                    <span className={`font-body text-xs ${i <= stepIndex ? "text-foreground" : "text-muted-foreground"}`}>{step}</span>
                    {i < 2 && <div className={`flex-1 h-px ${i < stepIndex ? "bg-primary" : "bg-border"}`} />}
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>

        {/* Upload Form */}
        {canSubmit && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="font-heading font-bold text-base text-foreground mb-6">Upload Documents</h3>

              {/* Document Type */}
              <div className="mb-6">
                <Label className="font-body text-sm text-muted-foreground mb-2 block">Document Type</Label>
                <div className="flex gap-2 flex-wrap">
                  {documentTypes.map((dt) => (
                    <button
                      key={dt.value}
                      onClick={() => setDocType(dt.value)}
                      className={`px-4 py-2 rounded-lg text-xs font-body font-medium transition-all ${docType === dt.value
                          ? "bg-accent-dim text-primary border border-primary/30"
                          : "bg-secondary text-muted-foreground border border-border hover:border-border-light"
                        }`}
                    >
                      {dt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Document Upload */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <div>
                  <Label className="font-body text-sm text-muted-foreground mb-2 block">
                    <FileCheck size={14} className="inline mr-1" /> ID Document
                  </Label>
                  <label className={`relative flex flex-col items-center justify-center h-40 rounded-lg border-2 border-dashed cursor-pointer transition-all ${docPreview ? "border-primary/30 bg-accent-dim" : "border-border hover:border-border-light bg-input"
                    }`}>
                    {docPreview ? (
                      <div className="relative w-full h-full">
                        <img src={docPreview} alt="Document" className="w-full h-full object-cover rounded-lg" />
                        <button
                          onClick={(e) => { e.preventDefault(); setDocFile(null); setDocPreview(null); }}
                          className="absolute top-2 right-2 w-6 h-6 bg-background/80 rounded-full flex items-center justify-center"
                        >
                          <X size={12} className="text-foreground" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <Upload size={24} className="text-muted-foreground mb-2" />
                        <span className="font-body text-xs text-muted-foreground">Click to upload</span>
                        <span className="font-mono text-[10px] text-muted-foreground/60 mt-1">JPG, PNG, PDF — Max 10MB</span>
                      </>
                    )}
                    <input type="file" className="hidden" accept="image/jpeg,image/png,image/webp,application/pdf" onChange={(e) => handleFileChange(e, "doc")} />
                  </label>
                </div>

                <div>
                  <Label className="font-body text-sm text-muted-foreground mb-2 block">
                    <Camera size={14} className="inline mr-1" /> Selfie with Document
                  </Label>
                  <label className={`relative flex flex-col items-center justify-center h-40 rounded-lg border-2 border-dashed cursor-pointer transition-all ${selfiePreview ? "border-primary/30 bg-accent-dim" : "border-border hover:border-border-light bg-input"
                    }`}>
                    {selfiePreview ? (
                      <div className="relative w-full h-full">
                        <img src={selfiePreview} alt="Selfie" className="w-full h-full object-cover rounded-lg" />
                        <button
                          onClick={(e) => { e.preventDefault(); setSelfieFile(null); setSelfiePreview(null); }}
                          className="absolute top-2 right-2 w-6 h-6 bg-background/80 rounded-full flex items-center justify-center"
                        >
                          <X size={12} className="text-foreground" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <Camera size={24} className="text-muted-foreground mb-2" />
                        <span className="font-body text-xs text-muted-foreground">Click to upload selfie</span>
                        <span className="font-mono text-[10px] text-muted-foreground/60 mt-1">Hold your ID next to your face</span>
                      </>
                    )}
                    <input type="file" className="hidden" accept="image/jpeg,image/png,image/webp" onChange={(e) => handleFileChange(e, "selfie")} />
                  </label>
                </div>
              </div>

              <Button variant="hero" onClick={handleSubmit} disabled={submitting || !docFile || !selfieFile} className="w-full py-6">
                {submitting ? "Submitting..." : "Submit for Verification"}
              </Button>
            </div>
          </motion.div>
        )}
      </div>
    </AppLayout>
  );
};

export default KYCVerification;
