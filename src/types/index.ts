// ============================================================
// Zendo — Type Definitions (mirrors the GraphQL API schema)
// ============================================================

// ── Relay Connection Types ────────────────────────────────────

export interface PageInfo {
  endCursor: string | null;
  hasNextPage: boolean;
}

export interface Edge<T> {
  node: T;
  cursor: string;
}

export interface Connection<T> {
  edges: Edge<T>[];
  pageInfo: PageInfo;
}

// ── User ──────────────────────────────────────────────────────
// NOTE: email/username/role come from Keycloak/NextAuth session,
// NOT from the API User type.

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  suffix?: string;
  profilePictureUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

// ── Business ──────────────────────────────────────────────────

export interface Business {
  id: string;
  userId: string;
  name: string;
  description?: string | null;
  bannerImageUrl?: string | null;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

// ── Business Metric ───────────────────────────────────────────

export interface BusinessMetric {
  id: string;
  businessId: string;
  totalReviews: number;
  averageRating: number;
  createdAt?: string;
  updatedAt?: string;
}

// ── Business Feedback ─────────────────────────────────────────

export interface BusinessFeedback {
  id: string;
  userId: string;
  businessId: string;
  rating: number;
  payload: Record<string, unknown>; // { title, richText, ... }
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

// ── Service ───────────────────────────────────────────────────

export interface Service {
  id: string;
  businessId: string;
  name: string;
  description?: string | null;
  bannerImageUrl?: string | null;
  price?: number | null;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

// ── Service Metric ────────────────────────────────────────────

export interface ServiceMetric {
  id: string;
  serviceId: string;
  totalReviews: number;
  averageRating: number;
  createdAt?: string;
  updatedAt?: string;
}

// ── Service Page (Blog) ───────────────────────────────────────

export interface ServicePage {
  id: string;
  serviceId: string;
  payload: Record<string, unknown>; // Blog/content JSON
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

// ── Service Form ──────────────────────────────────────────────

export interface ServiceForm {
  id: string;
  serviceId: string;
  payload: Record<string, unknown>; // Form field definitions JSON
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

// ── Service Appointment ───────────────────────────────────────
// NOTE: status and scheduledAt are stored INSIDE payload JSON

export interface ServiceAppointment {
  id: string;
  serviceId: string;
  userId?: string;
  amount: number; // Float in API
  currency: string;
  payload: Record<string, unknown>; // { status, scheduledAt, formValues, ... }
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

// ── Service Feedback ──────────────────────────────────────────
// NOTE: title and richText are stored INSIDE payload JSON

export interface ServiceFeedback {
  id: string;
  userId: string;
  serviceId: string;
  rating: number;
  payload: Record<string, unknown>; // { title, richText, ... }
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

// ── Service Tag ───────────────────────────────────────────────

export interface ServiceTag {
  id: string;
  serviceId: string;
  tagId: string;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

// ── Tag ───────────────────────────────────────────────────────

export interface Tag {
  id: string;
  name: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

// ── Payment ───────────────────────────────────────────────────

export interface Payment {
  id: string;
  userId: string;
  businessId: string;
  serviceAppointmentsId: string;
  providerPaymentId?: string;
  provider: string;
  amount: string; // String in API
  currency: string;
  method: string;
  paidAt?: string;
  refundedAt?: string;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

// ── Payment Link ──────────────────────────────────────────────

export interface PaymentLink {
  id: string;
  serviceAppointmentsId: string;
  providerPaymentLinkId?: string;
  provider: string;
  redirectUrl: string;
  expiredAt?: string;
  paidAt?: string;
  canceledAt?: string;
  failedAt?: string;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

// ── Sales Invoice ─────────────────────────────────────────────

export interface SalesInvoice {
  id: string;
  paymentId: string;
  requestedAt: string;
  requestedBy?: string;
  resolvedAt?: string;
  resolvedBy?: string;
  attachmentUrl?: string;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

// ── Notification ──────────────────────────────────────────────
// NOTE: type and read status are stored INSIDE payload JSON

export interface Notification {
  id: string;
  userId: string;
  provider: string;
  payload: Record<string, unknown>; // { type, message, read, ... }
  deliveredAt?: string;
  deliveryAttemptCount: number;
  createdAt?: string;
  updatedAt?: string;
}

// ── Payout Statement ──────────────────────────────────────────

export interface PayoutStatement {
  id: string;
  businessId: string;
  periodStart: string;
  periodEnd: string;
  grossCollection: number;
  totalFees: number;
  withholdingTax: number;
  netPayout: number;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

// ── Service Billing ───────────────────────────────────────────

export interface ServiceBilling {
  id: string;
  payoutStatementId: string;
  payload: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
}

// ── Billing Address ───────────────────────────────────────────

export interface BillingAddress {
  id: string;
  userId: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
}
