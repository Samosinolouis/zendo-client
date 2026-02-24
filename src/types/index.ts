// ============================================================
// Zendo — Type Definitions (mirrors the database schema)
// ============================================================

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  suffix?: string;
  email: string;
  username: string;
  profilePictureUrl?: string;
  role: "user" | "owner"; // derived from business ownership
}

export interface Business {
  id: string;
  userId: string;
  name: string;
  description: string;
  bannerUrl?: string;
}

export interface Service {
  id: string;
  businessId: string;
  name: string;
  description: string;
  bannerUrl?: string;
}

export interface ServicePage {
  id: string;
  serviceId: string;
  payload: Record<string, unknown>;
}

export interface ServiceAppointment {
  id: string;
  serviceId: string;
  userId?: string;
  amount: number;
  currency: string;
  payload: Record<string, unknown>;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  scheduledAt?: string;
}

export type FieldType = "text" | "number" | "select" | "date" | "textarea" | "checkbox";

export interface ServiceAppointmentField {
  id: string;
  serviceId: string;
  type: FieldType;
  name: string;
  description?: string;
  richText?: string;
  minAmount?: number;
  maxAmount?: number;
  currency?: string;
}

export interface ServiceAppointmentFieldOption {
  id: string;
  serviceAppointmentFieldId: string;
  name: string;
  description?: string;
  amount?: number;
  currency?: string;
  richText?: string;
}

export interface ServiceAppointmentFieldValidation {
  id: string;
  serviceAppointmentFieldId: string;
  payload: Record<string, unknown>;
}

export interface Payment {
  id: string;
  userId: string;
  businessId: string;
  serviceAppointmentId: string;
  providerPaymentId?: string;
  provider: string;
  amount: number;
  currency: string;
  method: string;
  paidAt?: string;
  refundedAt?: string;
}

export interface PaymentLink {
  id: string;
  serviceAppointmentId: string;
  providerPaymentLinkId?: string;
  provider: string;
  redirectUrl: string;
  expiredAt?: string;
  paidAt?: string;
  canceledAt?: string;
  failedAt?: string;
}

export interface SalesInvoice {
  id: string;
  paymentId: string;
  requestedAt: string;
  resolvedAt?: string;
  attachmentUrl?: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: "appointment_confirmed" | "payment_received" | "appointment_reminder" | "payout_ready" | "feedback_received" | "general";
  payload: Record<string, unknown>;
  createdAt: string;
  read: boolean;
}

export interface PayoutStatement {
  id: string;
  businessId: string;
  periodStart: string;
  periodEnd: string;
  grossCollection: number;
  totalFees: number;
  withholdingTax: number;
  netPayout: number;
}

export interface ServiceBilling {
  id: string;
  payoutStatementId: string;
  payload: Record<string, unknown>;
}

export interface ServiceFeedback {
  id: string;
  userId: string;
  serviceId: string;
  title: string;
  richText: string;
  rating?: number;
  createdAt: string;
}

export interface ServiceTag {
  id: string;
  name: string;
  description?: string;
}

export interface BillingAddress {
  id: string;
  userId: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}
