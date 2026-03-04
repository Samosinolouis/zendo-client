"use client";

import { useState } from "react";
import { useAuth } from "@/providers/AuthProvider";
import { useSession } from "next-auth/react";
import { useQuery, useMutation, extractNodes } from "@/graphql/hooks";
import { GET_BILLING_ADDRESSES } from "@/graphql/queries";
import { UPDATE_EMAIL, UPDATE_PASSWORD, UPDATE_BILLING_ADDRESS } from "@/graphql/mutations";
import type { BillingAddress, Connection } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Mail,
  Lock,
  MapPin,
  Save,
  Settings,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

export default function SettingsPage() {
  const { user, isLoggedIn } = useAuth();
  const { data: session } = useSession();

  // ── Email ──────────────────────────────────────────
  const [email, setEmail] = useState(session?.user?.email ?? "");
  const [emailMsg, setEmailMsg] = useState<string | null>(null);
  const { mutate: updateEmail, loading: emailLoading } = useMutation<{ updateEmail: { success: boolean } }>(UPDATE_EMAIL);

  const handleEmailSave = async () => {
    setEmailMsg(null);
    const res = await updateEmail({ input: { email: email.trim() } });
    if (res?.updateEmail?.success) {
      setEmailMsg("Email updated. You may need to re-login.");
    } else {
      setEmailMsg("Failed to update email.");
    }
  };

  // ── Password ───────────────────────────────────────
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwdMsg, setPwdMsg] = useState<string | null>(null);
  const { mutate: updatePassword, loading: pwdLoading } = useMutation<{ updatePassword: { success: boolean } }>(UPDATE_PASSWORD);

  const handlePasswordSave = async () => {
    setPwdMsg(null);
    if (newPassword !== confirmPassword) {
      setPwdMsg("Passwords do not match.");
      return;
    }
    if (newPassword.length < 8) {
      setPwdMsg("Password must be at least 8 characters.");
      return;
    }
    const res = await updatePassword({
      input: { currentPassword, newPassword },
    });
    if (res?.updatePassword?.success) {
      setPwdMsg("Password updated successfully.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } else {
      setPwdMsg("Failed to update password. Check your current password.");
    }
  };

  // ── Billing Address ────────────────────────────────
  const { data: addrData, loading: addrLoading, refetch: refetchAddr } = useQuery<{
    billingAddresses: Connection<BillingAddress>;
  }>(GET_BILLING_ADDRESSES, { first: 1, filter: { userId: user?.id } }, { skip: !user });
  const address = extractNodes(addrData?.billingAddresses)[0] ?? null;

  const [addrForm, setAddrForm] = useState<Record<string, string>>({});
  const [addrMsg, setAddrMsg] = useState<string | null>(null);
  const { mutate: updateAddress, loading: addrSaving } = useMutation<{
    updateBillingAddress: { billingAddress: BillingAddress };
  }>(UPDATE_BILLING_ADDRESS);

  // Init form from loaded address
  const addrFields = {
    addressLine1: addrForm.addressLine1 ?? address?.addressLine1 ?? "",
    addressLine2: addrForm.addressLine2 ?? address?.addressLine2 ?? "",
    city: addrForm.city ?? address?.city ?? "",
    state: addrForm.state ?? address?.state ?? "",
    postalCode: addrForm.postalCode ?? address?.postalCode ?? "",
    country: addrForm.country ?? address?.country ?? "",
  };

  const handleAddrChange = (field: string, value: string) => {
    setAddrForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddrSave = async () => {
    if (!address) return;
    setAddrMsg(null);
    const res = await updateAddress({
      input: {
        id: address.id,
        ...addrFields,
      },
    });
    if (res) {
      setAddrMsg("Billing address updated.");
      refetchAddr();
    } else {
      setAddrMsg("Failed to update billing address.");
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <AlertCircle className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-foreground">Sign in required</h1>
        <p className="text-muted-foreground mt-2">Please sign in to access settings.</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
          <Settings className="w-7 h-7" />
          Settings
        </h1>
        <p className="text-muted-foreground mt-1">Manage your account settings and preferences</p>
      </div>

      {/* Email Section */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Mail className="w-5 h-5 text-blue-600" />
            Email Address
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="settings-email">Email</Label>
            <Input
              id="settings-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
            />
          </div>
          {emailMsg && (
            <p className={`text-sm flex items-center gap-1 ${emailMsg.includes("Failed") ? "text-red-600" : "text-emerald-600"}`}>
              {emailMsg.includes("Failed") ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
              {emailMsg}
            </p>
          )}
          <Button onClick={handleEmailSave} disabled={emailLoading || !email.trim()} className="gap-2">
            <Save className="w-4 h-4" />
            {emailLoading ? "Saving…" : "Update Email"}
          </Button>
        </CardContent>
      </Card>

      {/* Password Section */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Lock className="w-5 h-5 text-orange-600" />
            Change Password
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="current-pwd">Current Password</Label>
            <Input
              id="current-pwd"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="new-pwd">New Password</Label>
              <Input
                id="new-pwd"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-pwd">Confirm Password</Label>
              <Input
                id="confirm-pwd"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          </div>
          {pwdMsg && (
            <p className={`text-sm flex items-center gap-1 ${pwdMsg.includes("Failed") || pwdMsg.includes("do not") || pwdMsg.includes("must") ? "text-red-600" : "text-emerald-600"}`}>
              {pwdMsg.includes("successfully") ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              {pwdMsg}
            </p>
          )}
          <Button
            onClick={handlePasswordSave}
            disabled={pwdLoading || !currentPassword || !newPassword || !confirmPassword}
            className="gap-2"
          >
            <Save className="w-4 h-4" />
            {pwdLoading ? "Saving…" : "Update Password"}
          </Button>
        </CardContent>
      </Card>

      {/* Billing Address Section */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <MapPin className="w-5 h-5 text-emerald-600" />
            Billing Address
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {addrLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-10 rounded-md" />
              ))}
            </div>
          ) : !address ? (
            <p className="text-sm text-muted-foreground">No billing address on file. Complete onboarding to set one up.</p>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="addr-line1">Address Line 1</Label>
                <Input
                  id="addr-line1"
                  value={addrFields.addressLine1}
                  onChange={(e) => handleAddrChange("addressLine1", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="addr-line2">Address Line 2</Label>
                <Input
                  id="addr-line2"
                  value={addrFields.addressLine2}
                  onChange={(e) => handleAddrChange("addressLine2", e.target.value)}
                  placeholder="Apt, suite, etc. (optional)"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="addr-city">City</Label>
                  <Input
                    id="addr-city"
                    value={addrFields.city}
                    onChange={(e) => handleAddrChange("city", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="addr-state">State / Province</Label>
                  <Input
                    id="addr-state"
                    value={addrFields.state}
                    onChange={(e) => handleAddrChange("state", e.target.value)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="addr-postal">Postal Code</Label>
                  <Input
                    id="addr-postal"
                    value={addrFields.postalCode}
                    onChange={(e) => handleAddrChange("postalCode", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="addr-country">Country</Label>
                  <Input
                    id="addr-country"
                    value={addrFields.country}
                    onChange={(e) => handleAddrChange("country", e.target.value)}
                  />
                </div>
              </div>
              {addrMsg && (
                <p className={`text-sm flex items-center gap-1 ${addrMsg.includes("Failed") ? "text-red-600" : "text-emerald-600"}`}>
                  {addrMsg.includes("Failed") ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                  {addrMsg}
                </p>
              )}
              <Button onClick={handleAddrSave} disabled={addrSaving} className="gap-2">
                <Save className="w-4 h-4" />
                {addrSaving ? "Saving…" : "Update Address"}
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
