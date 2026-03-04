"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { useAuth } from "@/providers/AuthProvider";
import { useSession } from "next-auth/react";
import { useQuery, useMutation, extractNodes } from "@/graphql/hooks";
import { GET_BILLING_ADDRESSES, GET_PAYMENTS, GET_SALES_INVOICES } from "@/graphql/queries";
import { UPDATE_USER } from "@/graphql/mutations";
import { uploadToCloudinary } from "@/lib/cloudinary";
import type { BillingAddress, Payment, SalesInvoice, Connection } from "@/types";
import { formatCurrency, formatDate, getInitials } from "@/lib/utils";
import {
  User, Mail, CreditCard, FileText, MapPin, Download,
  Sparkles, Shield, ArrowRight, Star, CalendarDays, TrendingUp,
  Camera, Loader2, Check, X, Pencil,
} from "lucide-react";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

export default function ProfilePage() {
  const { user, isLoggedIn, isOwner, refreshUser } = useAuth();
  const { data: session } = useSession();
  const email = session?.user?.email ?? "";

  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ firstName: "", lastName: "", middleName: "", suffix: "" });
  const [uploading, setUploading] = useState(false);
  const [bannerUploading, setBannerUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const { mutate: updateUser, loading: saving } = useMutation<{ updateUser: { id: string } }>(UPDATE_USER);

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
  const { data: invoiceData } = useQuery<{ salesInvoices: Connection<SalesInvoice> }>(
    GET_SALES_INVOICES,
    { first: 50 },
    { skip: !user }
  );
  const invoices = extractNodes(invoiceData?.salesInvoices);

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
    setEditForm({
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      middleName: user.middleName || "",
      suffix: user.suffix || "",
    });
    setEditing(true);
  };

  const handleSaveEdit = async () => {
    const input: Record<string, string> = {
      firstName: editForm.firstName.trim(),
      lastName: editForm.lastName.trim(),
    };
    if (editForm.middleName.trim()) input.middleName = editForm.middleName.trim();
    if (editForm.suffix.trim()) input.suffix = editForm.suffix.trim();

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
                </div>
              )}
            </CardContent>
          </Card>

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
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="capitalize text-muted-foreground">{p.provider}</TableCell>
                        <TableCell className="font-bold">{formatCurrency(parseFloat(p.amount || "0"), p.currency)}</TableCell>
                        <TableCell className="capitalize text-muted-foreground">{p.method}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{p.paidAt ? formatDate(p.paidAt) : "—"}</TableCell>
                        <TableCell>
                          {p.refundedAt ? (
                            <Badge variant="destructive">Refunded</Badge>
                          ) : p.paidAt ? (
                            <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Paid</Badge>
                          ) : (
                            <Badge variant="secondary" className="bg-amber-100 text-amber-700">Pending</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
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
                      className="animate-fade-in flex items-center justify-between bg-muted rounded-xl p-4 border hover:border-primary/30 transition-all group"
                    >
                      <div>
                        <p className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">Invoice #{inv.id.slice(-6)}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Requested: {formatDate(inv.requestedAt)}
                          {inv.resolvedAt && ` · Resolved: ${formatDate(inv.resolvedAt)}`}
                        </p>
                      </div>
                      {inv.attachmentUrl && (
                        <Button variant="outline" size="sm" asChild>
                          <a href={inv.attachmentUrl}>
                            <Download className="w-3.5 h-3.5 mr-1.5" /> Download
                          </a>
                        </Button>
                      )}
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
