"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/providers/AuthProvider";
import { useSession } from "next-auth/react";
import { useQuery, useMutation, extractNodes } from "@/graphql/hooks";
import { GET_BILLING_ADDRESSES, GET_USER } from "@/graphql/queries";
import { UPDATE_EMAIL, UPDATE_PASSWORD, UPDATE_BILLING_ADDRESS, UPDATE_USER_PREFERENCE } from "@/graphql/mutations";
import type { BillingAddress, Connection, UserPreference } from "@/types";
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
  Bell,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

import { Checkbox } from "@/components/ui/checkbox";

// ── Notification event catalogue ──────────────────────────────
const NOTIFICATION_EVENTS: { key: string; label: string; description: string }[] = [
  { key: "APPOINTMENT_CREATED",              label: "Appointment Booked",             description: "When you book a new appointment" },
  { key: "APPOINTMENT_PAID",                 label: "Payment Confirmed",              description: "When your payment is confirmed" },
  { key: "APPOINTMENT_APPROVED",             label: "Appointment Approved",           description: "When a business approves your appointment" },
  { key: "APPOINTMENT_REJECTED",             label: "Appointment Rejected",           description: "When a business rejects your appointment" },
  { key: "APPOINTMENT_CANCELLED",            label: "Appointment Cancelled",          description: "When an appointment is cancelled" },
  { key: "APPOINTMENT_COMPLETED",            label: "Appointment Completed",          description: "When you confirm an appointment is complete" },
  { key: "APPOINTMENT_COMPLETION_REQUESTED", label: "Completion Requested",           description: "When a business marks your appointment as done (awaiting your confirmation)" },
  { key: "PAYMENT_RECEIVED",                 label: "Payment Received",               description: "When a payment is successfully received (business owners)" },
  { key: "PAYMENT_FAILED",                   label: "Payment Failed",                 description: "When a payment attempt fails" },
];

const ALL_KEYS = NOTIFICATION_EVENTS.map((e) => e.key);

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

  // ── User Preference ────────────────────────────────
  const { data: userData, refetch: refetchPref } = useQuery<{
    user: { userPreference: UserPreference | null };
  }>(GET_USER, { id: user?.id }, { skip: !user });
  const pref = userData?.user?.userPreference ?? null;

  const [prefEnabled, setPrefEnabled] = useState<boolean>(true);
  const [prefMethod, setPrefMethod] = useState<"EMAIL" | "SMS">("EMAIL");
  // "*" in the list means all events; we track as Set of individual keys (empty = all via wildcard)
  const [prefEvents, setPrefEvents] = useState<Set<string>>(new Set(ALL_KEYS));
  const [allEvents, setAllEvents] = useState<boolean>(true);
  const [prefMsg, setPrefMsg] = useState<string | null>(null);
  const { mutate: updatePref, loading: prefLoading } = useMutation<{
    updateUserPreference: { userPreference: UserPreference };
  }>(UPDATE_USER_PREFERENCE);

  // Keep local state in sync with remote on first load
  useEffect(() => {
    if (pref) {
      setPrefEnabled(pref.notificationsEnabled);
      setPrefMethod(pref.notificationMethod);
      const list = pref.notificationEnabledList;
      if (list.includes("*")) {
        setAllEvents(true);
        setPrefEvents(new Set(ALL_KEYS));
      } else {
        setAllEvents(false);
        setPrefEvents(new Set(list.filter((k) => ALL_KEYS.includes(k))));
      }
    }
  }, [pref]);

  const handlePrefSave = async () => {
    setPrefMsg(null);
    const notificationEnabledList = allEvents ? ["*"] : [...prefEvents];
    const res = await updatePref({
      input: {
        notificationsEnabled: prefEnabled,
        notificationMethod: prefMethod,
        notificationEnabledList,
      },
    });
    if (res?.updateUserPreference?.userPreference) {
      setPrefMsg("Preferences saved.");
      refetchPref();
    } else {
      setPrefMsg("Failed to save preferences.");
    }
  };

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

      {/* Notification Preferences Section */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Bell className="w-5 h-5 text-violet-600" />
            Notification Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Enable Notifications</p>
              <p className="text-xs text-muted-foreground mt-0.5">Receive updates about your appointments and activity</p>
            </div>
            <Switch
              checked={prefEnabled}
              onCheckedChange={(v) => {
                setPrefEnabled(v);
                setPrefMsg(null);
              }}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pref-method">Notification Method</Label>
            <Select
              value={prefMethod}
              onValueChange={(v) => {
                setPrefMethod(v as "EMAIL" | "SMS");
                setPrefMsg(null);
              }}
            >
              <SelectTrigger id="pref-method" className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="EMAIL">Email</SelectItem>
                <SelectItem value="SMS">SMS</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Events to receive</Label>
              <button
                type="button"
                onClick={() => {
                  setAllEvents((prev) => {
                    if (!prev) setPrefEvents(new Set(ALL_KEYS));
                    return !prev;
                  });
                  setPrefMsg(null);
                }}
                className="text-xs text-primary underline underline-offset-2"
              >
                {allEvents ? "Customise" : "Subscribe to all"}
              </button>
            </div>
            {allEvents ? (
              <p className="text-xs text-muted-foreground">All events will be delivered.</p>
            ) : (
              <div className="space-y-2">
                {NOTIFICATION_EVENTS.map((evt) => (
                  <label
                    key={evt.key}
                    className="flex items-start gap-3 cursor-pointer group"
                  >
                    <Checkbox
                      checked={prefEvents.has(evt.key)}
                      onCheckedChange={(checked) => {
                        setPrefEvents((prev) => {
                          const next = new Set(prev);
                          if (checked) next.add(evt.key);
                          else next.delete(evt.key);
                          return next;
                        });
                        setPrefMsg(null);
                      }}
                      className="mt-0.5"
                    />
                    <div>
                      <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">{evt.label}</p>
                      <p className="text-xs text-muted-foreground">{evt.description}</p>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>
          {prefMsg && (
            <p className={`text-sm flex items-center gap-1 ${prefMsg.includes("Failed") ? "text-red-600" : "text-emerald-600"}`}>
              {prefMsg.includes("Failed") ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
              {prefMsg}
            </p>
          )}
          <Button onClick={handlePrefSave} disabled={prefLoading || !pref} className="gap-2">
            <Save className="w-4 h-4" />
            {prefLoading ? "Saving…" : "Save Preferences"}
          </Button>
          {!pref && (
            <p className="text-xs text-muted-foreground">Preferences not yet set up. Complete onboarding to enable this.</p>
          )}
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
