"use client";

import { useState, useRef, useCallback, useMemo } from "react";
import Image from "next/image";
import { useAuth } from "@/providers/AuthProvider";
import { useSession } from "next-auth/react";
import { useQuery, useMutation, extractNodes } from "@/graphql/hooks";
import { GET_BILLING_ADDRESSES, GET_PAYMENTS, GET_SALES_INVOICES } from "@/graphql/queries";
import { UPDATE_USER, REQUEST_SALES_INVOICE, RESOLVE_SALES_INVOICE } from "@/graphql/mutations";
import { uploadToCloudinary, uploadPdfToCloudinary, isCloudinaryConfigured } from "@/lib/cloudinary";
import { useToast } from "@/providers/ToastProvider";
import type { BillingAddress, Payment, SalesInvoice, Connection } from "@/types";
import { formatCurrency, formatDate, getInitials } from "@/lib/utils";
import {
  User, Mail, CreditCard, FileText, MapPin, Download,
  Sparkles, Shield, ArrowRight, Star, CalendarDays, TrendingUp,
  Camera, Loader2, Check, X, Pencil, Phone, Briefcase, AlertTriangle,
  Upload, ExternalLink, CheckCircle, Clock, AlertCircle, Receipt,
} from "lucide-react";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

export default function ProfilePage() {
  const { user, isLoggedIn, isOwner, refreshUser } = useAuth();
  const { data: session } = useSession();
  const email = session?.user?.email ?? "";

  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ firstName: "", lastName: "", middleName: "", suffix: "", mobileCountryCode: "+63", mobileLocalNumber: "" });
  const [uploading, setUploading] = useState(false);
  const [bannerUploading, setBannerUploading] = useState(false);
  const [confirmingUpgrade, setConfirmingUpgrade] = useState(false);
  const [upgrading, setUpgrading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const { mutate: updateUser, loading: saving } = useMutation<{ updateUser: { id: string } }>(UPDATE_USER);
  const { showSuccess, showError } = useToast();

  const { mutate: requestInvoice } = useMutation<{ requestSalesInvoice: { salesInvoice: { id: string } } }>(REQUEST_SALES_INVOICE);
  const { mutate: resolveInvoice } = useMutation<{ resolveSalesInvoice: { salesInvoice: { id: string } } }>(RESOLVE_SALES_INVOICE);

  const [requestingForPaymentId, setRequestingForPaymentId] = useState<string | null>(null);
  const [resolvingForInvoiceId, setResolvingForInvoiceId] = useState<string | null>(null);
  const [pendingResolveInvoiceId, setPendingResolveInvoiceId] = useState<string | null>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  // Fetch billing address
  const { data: billingData } = useQuery<{ billingAddresses: Connection<BillingAddress> }>(
    GET_BILLING_ADDRESSES,
    { first: 1, filter: { userId: user?.id } },
    { skip: !user }
  );
  const billingAddress = extractNodes(billingData?.billingAddresses)[0] ?? null;

  // Fetch payments
  const { data: paymentData } = useQuery<{ payments: Connection<Payment> }>(
    GET_PAYMENTS,
    { first: 50, filter: { userId: user?.id } },
    { skip: !user }
  );
  const payments = extractNodes(paymentData?.payments);

  // Fetch invoices
  const { data: invoiceData, refetch: refetchInvoices } = useQuery<{ salesInvoices: Connection<SalesInvoice> }>(
    GET_SALES_INVOICES,
    { first: 50 },
    { skip: !user }
  );
  const invoices = extractNodes(invoiceData?.salesInvoices);

  const invoiceByPaymentId = useMemo(() => {
    const map: Record<string, SalesInvoice> = {};
    for (const inv of invoices) map[inv.paymentId] = inv;
    return map;
  }, [invoices]);

  const handleRequestInvoice = useCallback(async (paymentId: string) => {
    setRequestingForPaymentId(paymentId);
    try {
      const result = await requestInvoice({ input: { paymentId } });
      if (result?.requestSalesInvoice?.salesInvoice?.id) {
        showSuccess("Invoice requested.");
        refetchInvoices();
      }
    } catch (err) {
      showError(err instanceof Error ? err.message : "Failed to request invoice.");
    } finally {
      setRequestingForPaymentId(null);
    }
  }, [requestInvoice, showSuccess, showError, refetchInvoices]);

  const handlePdfChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !pendingResolveInvoiceId) return;
    if (file.type !== "application/pdf") {
      showError("Please select a PDF file.");
      return;
    }
    setResolvingForInvoiceId(pendingResolveInvoiceId);
    try {
      const uploaded = await uploadPdfToCloudinary(file, "zendo/invoices");
      const result = await resolveInvoice({ input: { id: pendingResolveInvoiceId, attachmentUrl: uploaded.secure_url } });
      if (result?.resolveSalesInvoice?.salesInvoice) {
        showSuccess("Invoice resolved — receipt uploaded.");
        refetchInvoices();
      }
    } catch (err) {
      showError(err instanceof Error ? err.message : "Failed to resolve invoice.");
    } finally {
      setResolvingForInvoiceId(null);
      setPendingResolveInvoiceId(null);
      if (pdfInputRef.current) pdfInputRef.current.value = "";
    }
  }, [pendingResolveInvoiceId, resolveInvoice, showSuccess, showError, refetchInvoices]);

  if (!isLoggedIn || !user) {
    return (
      <div className="min-h-screen bg-hero flex items-center justify-center px-4">
        <div className="text-center animate-scale-in">
          <div className="w-24 h-24 bg-white/10 border border-white/20 rounded-full flex items-center justify-center mx-auto mb-6 animate-float">
            <User className="w-10 h-10 text-white/70" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-3">My Profile</h1>
          <p className="text-white/60 mb-8 text-lg">Sign in to view your profile.</p>
          <Button
            onClick={() => signIn("keycloak", { callbackUrl: "/onboarding" })}
            variant="secondary"
            size="lg"
          >
            Sign in <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    );
  }

  const handleStartEdit = () => {
    const existing = user.mobileNumber ?? "";
    // Parse existing "+63 9380542839" → code="+63", local="9380542839"
    const match = existing.match(/^(\+\d+)\s(.+)$/);
    setEditForm({
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      middleName: user.middleName || "",
      suffix: user.suffix || "",
      mobileCountryCode: match ? match[1] : "+63",
      mobileLocalNumber: match ? match[2] : existing.replace(/^\+\d+\s?/, ""),
    });
    setEditing(true);
  };

  const handleSaveEdit = async () => {
    const input: Record<string, unknown> = {
      firstName: editForm.firstName.trim(),
      lastName: editForm.lastName.trim(),
    };
    if (editForm.middleName.trim()) input.middleName = editForm.middleName.trim();
    if (editForm.suffix.trim()) input.suffix = editForm.suffix.trim();
    input.mobileNumber = editForm.mobileLocalNumber.trim()
      ? `${editForm.mobileCountryCode} ${editForm.mobileLocalNumber.trim()}`
      : null;

    await updateUser({ id: user.id, input });
    setEditing(false);
    refreshUser();
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const result = await uploadToCloudinary(file, "profile-pictures");
      await updateUser({ id: user.id, input: { profilePictureUrl: result.secure_url } });
      refreshUser();
    } catch (err) {
      console.error("Upload failed:", err);
    } finally {
      setUploading(false);
    }
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBannerUploading(true);
    try {
      const result = await uploadToCloudinary(file, "profile-banners");
      await updateUser({ id: user.id, input: { bannerImageUrl: result.secure_url } });
      refreshUser();
    } catch (err) {
      console.error("Banner upload failed:", err);
    } finally {
      setBannerUploading(false);
    }
  };

  const handleUpgradeToOwner = async () => {
    setUpgrading(true);
    try {
      await updateUser({ id: user.id, input: { isBusinessOwner: true } });
      refreshUser();
      setConfirmingUpgrade(false);
    } finally {
      setUpgrading(false);
    }
  };

  const totalSpent = payments.reduce((s, p) => s + parseFloat(p.amount || "0"), 0);
  const stats = [
    { icon: CalendarDays, label: "Payments", value: payments.length, color: "text-primary", bg: "bg-primary/10" },
    { icon: TrendingUp, label: "Total Spent", value: formatCurrency(totalSpent), color: "text-green-600", bg: "bg-green-50" },
    { icon: Star, label: "Invoices", value: invoices.length, color: "text-amber-600", bg: "bg-amber-50" },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Cover / Hero */}
      <div className="relative overflow-hidden group">
        <div className="h-52 bg-hero relative overflow-hidden">
          {user?.bannerImageUrl ? (
            <Image 
              src={user.bannerImageUrl} 
              alt="Profile banner" 
              fill
              className="object-cover object-center"
            />
          ) : (
            <>
              <div className="absolute top-0 right-0 w-96 h-96 bg-primary/20 rounded-full filter blur-3xl animate-blob pointer-events-none" />
              <div className="absolute bottom-0 left-20 w-64 h-64 bg-primary/15 rounded-full filter blur-3xl animate-blob pointer-events-none" style={{ animationDelay: "2s" }} />
              <div className="absolute top-6 left-1/4 animate-float" style={{ animationDelay: "1s" }}>
                <Sparkles className="w-5 h-5 text-primary/40" />
              </div>
              <div className="absolute bottom-8 right-1/3 animate-float" style={{ animationDelay: "3s" }}>
                <Star className="w-4 h-4 text-cyan-300/60" />
              </div>
            </>
          )}
          <button
            onClick={() => bannerInputRef.current?.click()}
            className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
          >
            {bannerUploading ? <Loader2 className="w-8 h-8 text-white animate-spin" /> : <Camera className="w-8 h-8 text-white" />}
          </button>
          <input ref={bannerInputRef} type="file" accept="image/*" className="hidden" onChange={handleBannerUpload} />
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-20">
          <div className="relative -mt-12 mb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div className="flex items-end gap-4">
              <div className="relative animate-scale-in group">
                <Avatar className="w-24 h-24 rounded-2xl border-4 border-background shadow-xl">
                  <AvatarImage src={user.profilePictureUrl ?? undefined} alt={user.firstName} />
                  <AvatarFallback className="text-3xl font-extrabold bg-linear-to-br from-primary to-primary/80 text-white rounded-2xl">
                    {getInitials(user.firstName, user.lastName)}
                  </AvatarFallback>
                </Avatar>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 bg-black/40 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                >
                  {uploading ? <Loader2 className="w-6 h-6 text-white animate-spin" /> : <Camera className="w-6 h-6 text-white" />}
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-background" />
              </div>
              <div className="pb-1 animate-slide-up">
                <h1 className="text-2xl font-extrabold text-foreground">
                  {user.firstName} {user.lastName}
                </h1>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-muted-foreground text-sm">{email}</span>
                  <Badge variant={isOwner ? "default" : "secondary"}>
                    {isOwner ? "Business Owner" : "Customer"}
                  </Badge>
                </div>
              </div>
            </div>
            <Button variant="outline" size="sm" className="animate-fade-in shrink-0" onClick={handleStartEdit}>
              <Pencil className="w-3.5 h-3.5 mr-1.5" /> Edit Profile
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 pb-16">
        {/* Stats row */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {stats.map((s, i) => (
            <Card
              key={s.label}
              style={{ animationDelay: `${i * 0.08}s` }}
              className={`animate-scale-in ${s.bg} border-transparent text-center`}
            >
              <CardContent className="p-4">
                <s.icon className={`w-5 h-5 ${s.color} mx-auto mb-2`} />
                <p className="text-2xl font-extrabold text-foreground">{s.value}</p>
                <p className={`text-xs font-medium ${s.color} mt-0.5`}>{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="space-y-6">
          {/* Personal Info */}
          <Card className="animate-slide-up overflow-hidden">
            <CardHeader className="bg-linear-to-r from-primary/5 to-transparent">
              <CardTitle className="flex items-center gap-3 text-base">
                <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                  <User className="w-4 h-4 text-primary" />
                </div>
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              {editing ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label>First name</Label>
                      <Input value={editForm.firstName} onChange={(e) => setEditForm(f => ({ ...f, firstName: e.target.value }))} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Last name</Label>
                      <Input value={editForm.lastName} onChange={(e) => setEditForm(f => ({ ...f, lastName: e.target.value }))} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label>Middle name</Label>
                      <Input value={editForm.middleName} onChange={(e) => setEditForm(f => ({ ...f, middleName: e.target.value }))} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Suffix</Label>
                      <Input value={editForm.suffix} onChange={(e) => setEditForm(f => ({ ...f, suffix: e.target.value }))} />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Mobile number</Label>
                    <div className="flex gap-2">
                      <Select value={editForm.mobileCountryCode} onValueChange={(v) => setEditForm(f => ({ ...f, mobileCountryCode: v }))}>
                        <SelectTrigger className="w-28 shrink-0">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="+63">🇵🇭 +63</SelectItem>
                          <SelectItem value="+1">🇺🇸 +1</SelectItem>
                          <SelectItem value="+44">🇬🇧 +44</SelectItem>
                          <SelectItem value="+61">🇦🇺 +61</SelectItem>
                          <SelectItem value="+81">🇯🇵 +81</SelectItem>
                          <SelectItem value="+82">🇰🇷 +82</SelectItem>
                          <SelectItem value="+86">🇨🇳 +86</SelectItem>
                          <SelectItem value="+65">🇸🇬 +65</SelectItem>
                          <SelectItem value="+60">🇲🇾 +60</SelectItem>
                          <SelectItem value="+66">🇹🇭 +66</SelectItem>
                          <SelectItem value="+62">🇮🇩 +62</SelectItem>
                          <SelectItem value="+84">🇻🇳 +84</SelectItem>
                          <SelectItem value="+91">🇮🇳 +91</SelectItem>
                          <SelectItem value="+49">🇩🇪 +49</SelectItem>
                          <SelectItem value="+33">🇫🇷 +33</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input
                        value={editForm.mobileLocalNumber}
                        onChange={(e) => setEditForm(f => ({ ...f, mobileLocalNumber: e.target.value }))}
                        placeholder="9380542839"
                        type="tel"
                        className="flex-1"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button variant="outline" size="sm" onClick={() => setEditing(false)} disabled={saving}>
                      <X className="w-3.5 h-3.5 mr-1" /> Cancel
                    </Button>
                    <Button size="sm" onClick={handleSaveEdit} disabled={saving}>
                      {saving ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Check className="w-3.5 h-3.5 mr-1" />}
                      Save
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Full Name</p>
                    <p className="text-sm font-semibold text-foreground">
                      {user.firstName} {user.middleName ? `${user.middleName} ` : ""}{user.lastName}{user.suffix ? ` ${user.suffix}` : ""}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Email</p>
                    <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                      <Mail className="w-4 h-4 text-primary shrink-0" />
                      {email}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Account Type</p>
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-green-500" />
                      <p className="text-sm font-semibold text-foreground">{isOwner ? "Business Owner" : "Customer"}</p>
                    </div>
                  </div>
                  {user.mobileNumber && (
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Mobile Number</p>
                      <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                        <Phone className="w-4 h-4 text-primary shrink-0" />
                        {user.mobileNumber}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Upgrade to Business Owner */}
          {!isOwner && (
            <Card className="animate-slide-up overflow-hidden border-primary/20" style={{ animationDelay: "0.05s" }}>
              <CardHeader className="bg-linear-to-r from-primary/5 to-transparent">
                <CardTitle className="flex items-center gap-3 text-base">
                  <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Briefcase className="w-4 h-4 text-primary" />
                  </div>
                  Become a Business Owner
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                {confirmingUpgrade ? (
                  <div className="space-y-4">
                    <div className="flex items-start gap-3 rounded-lg bg-amber-50 border border-amber-200 p-3 text-sm text-amber-800 dark:bg-amber-950/30 dark:border-amber-800 dark:text-amber-200">
                      <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                      <p>
                        This action is <strong>permanent</strong>. Once you become a Business Owner, this cannot be reversed. You will gain access to the owner dashboard to create and manage businesses and services.
                      </p>
                    </div>
                    <div className="flex gap-2 justify-end">
                      <Button variant="outline" size="sm" onClick={() => setConfirmingUpgrade(false)} disabled={upgrading}>
                        <X className="w-3.5 h-3.5 mr-1" /> Cancel
                      </Button>
                      <Button size="sm" onClick={handleUpgradeToOwner} disabled={upgrading}>
                        {upgrading
                          ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                          : <Check className="w-3.5 h-3.5 mr-1" />}
                        Yes, make me a Business Owner
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-4">
                    <p className="text-sm text-muted-foreground">
                      Unlock the owner dashboard to create businesses, list services, and accept appointments.
                    </p>
                    <Button size="sm" className="shrink-0" onClick={() => setConfirmingUpgrade(true)}>
                      <Briefcase className="w-3.5 h-3.5 mr-1.5" /> Upgrade
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Billing Address */}
          <Card className="animate-slide-up overflow-hidden" style={{ animationDelay: "0.1s" }}>
            <CardHeader className="bg-linear-to-r from-green-50 to-transparent dark:from-green-950/30">
              <CardTitle className="flex items-center gap-3 text-base">
                <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                  <MapPin className="w-4 h-4 text-green-600" />
                </div>
                Billing Address
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              {billingAddress ? (
                <div className="bg-muted rounded-xl p-4 border text-sm text-foreground space-y-0.5">
                  <p className="font-semibold">{billingAddress.addressLine1}</p>
                  {billingAddress.addressLine2 && <p>{billingAddress.addressLine2}</p>}
                  <p>{billingAddress.city}, {billingAddress.state} {billingAddress.postalCode}</p>
                  <p className="text-muted-foreground">{billingAddress.country}</p>
                </div>
              ) : (
                <div className="text-center py-8">
                  <MapPin className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3 animate-float" />
                  <p className="text-sm text-muted-foreground">No billing address on file.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payment History */}
          <Card className="animate-slide-up overflow-hidden" style={{ animationDelay: "0.15s" }}>
            <CardHeader className="bg-linear-to-r from-emerald-50 to-transparent dark:from-emerald-950/30">
              <div className="flex items-center justify-between w-full">
                <CardTitle className="flex items-center gap-3 text-base">
                  <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900 rounded-lg flex items-center justify-center">
                    <CreditCard className="w-4 h-4 text-emerald-600" />
                  </div>
                  Payment History
                </CardTitle>
                <Badge variant="secondary">{payments.length}</Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              {payments.length === 0 ? (
                <div className="text-center py-8">
                  <CreditCard className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3 animate-float" />
                  <p className="text-sm text-muted-foreground">No payments yet.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Provider</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Invoice</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.map((p) => {
                      const inv = invoiceByPaymentId[p.id];

                      let paymentStatusBadge: React.ReactNode;
                      if (p.refundedAt) {
                        paymentStatusBadge = <Badge variant="destructive">Refunded</Badge>;
                      } else if (p.paidAt) {
                        paymentStatusBadge = <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Paid</Badge>;
                      } else {
                        paymentStatusBadge = <Badge variant="secondary" className="bg-amber-100 text-amber-700">Pending</Badge>;
                      }

                      let invoiceCell: React.ReactNode;
                      if (inv) {
                        invoiceCell = (
                          <div className="flex items-center gap-1.5">
                            {inv.resolvedAt ? (
                              <Badge className="bg-green-100 text-green-700 border-green-200 gap-1 text-xs font-medium">
                                <CheckCircle className="w-3 h-3" /> Resolved
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50 gap-1 text-xs">
                                <Clock className="w-3 h-3" /> Requested
                              </Badge>
                            )}
                            {inv.attachmentUrl && (
                              <a href={inv.attachmentUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80">
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            )}
                          </div>
                        );
                      } else if (p.paidAt) {
                        invoiceCell = (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-xs gap-1"
                            disabled={requestingForPaymentId === p.id}
                            onClick={() => handleRequestInvoice(p.id)}
                          >
                            {requestingForPaymentId === p.id
                              ? <Loader2 className="w-3 h-3 animate-spin" />
                              : <Receipt className="w-3 h-3" />}
                            Request
                          </Button>
                        );
                      } else {
                        invoiceCell = <span className="text-xs text-muted-foreground">—</span>;
                      }

                      return (
                        <TableRow key={p.id}>
                          <TableCell className="capitalize text-muted-foreground">{p.provider}</TableCell>
                          <TableCell className="font-bold">{formatCurrency(Number.parseFloat(p.amount || "0"), p.currency)}</TableCell>
                          <TableCell className="capitalize text-muted-foreground">{p.method}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{p.paidAt ? formatDate(p.paidAt) : "—"}</TableCell>
                          <TableCell>{paymentStatusBadge}</TableCell>
                          <TableCell>{invoiceCell}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Invoices */}
          <Card className="animate-slide-up overflow-hidden" style={{ animationDelay: "0.2s" }}>
            <CardHeader className="bg-linear-to-r from-primary/5 to-transparent">
              <div className="flex items-center justify-between w-full">
                <CardTitle className="flex items-center gap-3 text-base">
                  <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                    <FileText className="w-4 h-4 text-primary" />
                  </div>
                  Invoices
                </CardTitle>
                <Badge variant="secondary">{invoices.length}</Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              {/* Hidden PDF input for resolve flow */}
              <input
                ref={pdfInputRef}
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={handlePdfChange}
              />
              {invoices.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3 animate-float" />
                  <p className="text-sm text-muted-foreground">No invoices yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {invoices.map((inv, i) => (
                    <div
                      key={inv.id}
                      style={{ animationDelay: `${i * 0.05}s` }}
                      className="animate-fade-in flex items-start justify-between bg-muted rounded-xl p-4 border hover:border-primary/30 transition-all group gap-3"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">Invoice #{inv.id.slice(-6)}</p>
                          {inv.resolvedAt ? (
                            <Badge className="bg-green-100 text-green-700 border-green-200 gap-1 text-xs">
                              <CheckCircle className="w-3 h-3" /> Resolved
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50 gap-1 text-xs">
                              <Clock className="w-3 h-3" /> Pending
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Requested: {formatDate(inv.requestedAt)}
                          {inv.resolvedAt && ` · Resolved: ${formatDate(inv.resolvedAt)}`}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {inv.attachmentUrl && (
                          <Button variant="outline" size="sm" asChild className="h-7 text-xs gap-1">
                            <a href={inv.attachmentUrl} target="_blank" rel="noopener noreferrer">
                              <Download className="w-3 h-3" /> Download
                            </a>
                          </Button>
                        )}
                        {!inv.resolvedAt && isOwner && (
                          isCloudinaryConfigured() ? (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs gap-1"
                              disabled={resolvingForInvoiceId === inv.id}
                              onClick={() => {
                                setPendingResolveInvoiceId(inv.id);
                                pdfInputRef.current?.click();
                              }}
                            >
                              {resolvingForInvoiceId === inv.id
                                ? <><Loader2 className="w-3 h-3 animate-spin" /> Uploading…</>
                                : <><Upload className="w-3 h-3" /> Resolve</>}
                            </Button>
                          ) : (
                            <span className="flex items-center gap-1 text-xs text-destructive">
                              <AlertCircle className="w-3.5 h-3.5" /> Cloudinary not configured
                            </span>
                          )
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
