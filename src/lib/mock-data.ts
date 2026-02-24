// ============================================================
// Zendo — Comprehensive Mock Data
// ============================================================

import type {
  User,
  Business,
  Service,
  ServicePage,
  ServiceAppointment,
  ServiceAppointmentField,
  ServiceAppointmentFieldOption,
  ServiceAppointmentFieldValidation,
  Payment,
  PaymentLink,
  SalesInvoice,
  Notification,
  PayoutStatement,
  ServiceBilling,
  ServiceFeedback,
  ServiceTag,
  BillingAddress,
} from "@/types";

// ── Users ──────────────────────────────────────────────────
export const mockUsers: User[] = [
  {
    id: "u1",
    firstName: "Jane",
    lastName: "Doe",
    email: "jane@example.com",
    username: "janedoe",
    profilePictureUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Jane",
    role: "user",
  },
  {
    id: "u2",
    firstName: "Carlos",
    lastName: "Rivera",
    middleName: "M.",
    email: "carlos@example.com",
    username: "carlosrivera",
    profilePictureUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Carlos",
    role: "owner",
  },
  {
    id: "u3",
    firstName: "Aisha",
    lastName: "Khan",
    email: "aisha@example.com",
    username: "aishakhan",
    profilePictureUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Aisha",
    role: "owner",
  },
  {
    id: "u4",
    firstName: "Tom",
    lastName: "Wilson",
    email: "tom@example.com",
    username: "tomwilson",
    profilePictureUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Tom",
    role: "user",
  },
];

// ── Businesses ─────────────────────────────────────────────
export const mockBusinesses: Business[] = [
  {
    id: "b1",
    userId: "u2",
    name: "Urban Fitness Gym",
    description:
      "State-of-the-art fitness facility with personal training, group classes, and modern equipment for all fitness levels.",
    bannerUrl: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1200&h=400&fit=crop",
  },
  {
    id: "b2",
    userId: "u3",
    name: "Aisha Wellness Clinic",
    description:
      "Holistic health and wellness clinic offering massage therapy, acupuncture, and nutritional counselling.",
    bannerUrl: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=1200&h=400&fit=crop",
  },
  {
    id: "b3",
    userId: "u3",
    name: "Serenity Yoga Studio",
    description:
      "Find your inner peace. We offer group classes, private sessions, and meditation workshops for all levels.",
    bannerUrl: "https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=1200&h=400&fit=crop",
  },
];

// ── Services ───────────────────────────────────────────────
export const mockServices: Service[] = [
  {
    id: "s1",
    businessId: "b1",
    name: "Personal Training Session",
    description: "One-on-one personalized training with certified fitness coach. Customized workout plan included.",
    bannerUrl: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&h=300&fit=crop",
  },
  {
    id: "s2",
    businessId: "b1",
    name: "Strength Training Program",
    description: "8-week structured strength training program with progressive weightlifting and conditioning.",
    bannerUrl: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&h=300&fit=crop",
  },
  {
    id: "s3",
    businessId: "b2",
    name: "Deep Tissue Massage",
    description: "60-minute therapeutic deep tissue massage to relieve chronic muscle tension.",
    bannerUrl: "https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?w=600&h=300&fit=crop",
  },
  {
    id: "s4",
    businessId: "b2",
    name: "Acupuncture Session",
    description: "Traditional acupuncture treatment targeting pain relief and energy balance.",
    bannerUrl: "https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?w=600&h=300&fit=crop",
  },
  {
    id: "s5",
    businessId: "b3",
    name: "Vinyasa Flow Class",
    description: "Dynamic 75-minute yoga class linking breath with movement. All levels welcome.",
    bannerUrl: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=600&h=300&fit=crop",
  },
  {
    id: "s6",
    businessId: "b3",
    name: "Private Meditation Session",
    description: "One-on-one guided meditation session tailored to your goals.",
    bannerUrl: "https://images.unsplash.com/photo-1508672019048-805c876b67e2?w=600&h=300&fit=crop",
  },
];

// ── Service Pages ──────────────────────────────────────────
export const mockServicePages: ServicePage[] = [
  {
    id: "sp1",
    serviceId: "s1",
    payload: {
      title: "Personal Training Session",
      sections: [
        { heading: "What to Expect", body: "A personalized 60-minute training session designed for your fitness goals." },
        { heading: "What to Bring", body: "Water bottle and comfortable workout attire. We provide towels and equipment." },
      ],
    },
  },
  {
    id: "sp2",
    serviceId: "s3",
    payload: {
      title: "Deep Tissue Massage",
      sections: [
        { heading: "Benefits", body: "Relieves chronic pain, reduces stress, improves flexibility." },
        { heading: "Preparation", body: "Arrive 10 minutes early. Wear comfortable clothing." },
      ],
    },
  },
];

// ── Service Appointment Fields ─────────────────────────────
export const mockServiceAppointmentFields: ServiceAppointmentField[] = [
  {
    id: "saf1",
    serviceId: "s1",
    type: "select",
    name: "Preferred Trainer",
    description: "Choose your preferred fitness coach",
  },
  {
    id: "saf2",
    serviceId: "s1",
    type: "date",
    name: "Appointment Date",
    description: "Select your preferred date",
  },
  {
    id: "saf3",
    serviceId: "s1",
    type: "textarea",
    name: "Special Instructions",
    description: "Any special requests or notes",
  },
  {
    id: "saf4",
    serviceId: "s3",
    type: "select",
    name: "Session Duration",
    description: "Choose session length",
  },
  {
    id: "saf5",
    serviceId: "s3",
    type: "text",
    name: "Health Concerns",
    description: "Describe any health conditions we should know about",
  },
  {
    id: "saf6",
    serviceId: "s5",
    type: "select",
    name: "Experience Level",
    description: "Your yoga experience level",
  },
  {
    id: "saf7",
    serviceId: "s5",
    type: "checkbox",
    name: "Bring Own Mat",
    description: "I will bring my own yoga mat",
  },
];

// ── Service Appointment Field Options ──────────────────────
export const mockServiceAppointmentFieldOptions: ServiceAppointmentFieldOption[] = [
  { id: "safo1", serviceAppointmentFieldId: "saf1", name: "Carlos", description: "Senior Barber" },
  { id: "safo2", serviceAppointmentFieldId: "saf1", name: "Mike", description: "Junior Barber" },
  { id: "safo3", serviceAppointmentFieldId: "saf1", name: "Any Available", description: "First available barber" },
  { id: "safo4", serviceAppointmentFieldId: "saf4", name: "60 minutes", amount: 80, currency: "PHP" },
  { id: "safo5", serviceAppointmentFieldId: "saf4", name: "90 minutes", amount: 110, currency: "PHP" },
  { id: "safo6", serviceAppointmentFieldId: "saf4", name: "120 minutes", amount: 140, currency: "PHP" },
  { id: "safo7", serviceAppointmentFieldId: "saf6", name: "Beginner" },
  { id: "safo8", serviceAppointmentFieldId: "saf6", name: "Intermediate" },
  { id: "safo9", serviceAppointmentFieldId: "saf6", name: "Advanced" },
];

// ── Service Appointment Field Validations ──────────────────
export const mockServiceAppointmentFieldValidations: ServiceAppointmentFieldValidation[] = [
  { id: "safv1", serviceAppointmentFieldId: "saf2", payload: { required: true } },
  { id: "safv2", serviceAppointmentFieldId: "saf5", payload: { maxLength: 500 } },
];

// ── Service Appointments ───────────────────────────────────
export const mockServiceAppointments: ServiceAppointment[] = [
  {
    id: "sa1",
    serviceId: "s1",
    userId: "u1",
    amount: 35,
    currency: "PHP",
    status: "confirmed",
    scheduledAt: "2026-03-05T10:00:00Z",
    payload: { barber: "Carlos", instructions: "Low fade, keep the top long" },
  },
  {
    id: "sa2",
    serviceId: "s3",
    userId: "u1",
    amount: 80,
    currency: "PHP",
    status: "pending",
    scheduledAt: "2026-03-08T14:00:00Z",
    payload: { duration: "60 minutes", healthConcerns: "Lower back pain" },
  },
  {
    id: "sa3",
    serviceId: "s5",
    userId: "u4",
    amount: 25,
    currency: "PHP",
    status: "completed",
    scheduledAt: "2026-02-20T09:00:00Z",
    payload: { level: "Beginner", bringMat: false },
  },
  {
    id: "sa4",
    serviceId: "s2",
    userId: "u4",
    amount: 25,
    currency: "PHP",
    status: "cancelled",
    scheduledAt: "2026-02-22T11:00:00Z",
    payload: {},
  },
  {
    id: "sa5",
    serviceId: "s4",
    userId: "u1",
    amount: 95,
    currency: "PHP",
    status: "confirmed",
    scheduledAt: "2026-03-12T16:00:00Z",
    payload: {},
  },
];

// ── Payments ───────────────────────────────────────────────
export const mockPayments: Payment[] = [
  {
    id: "p1",
    userId: "u1",
    businessId: "b1",
    serviceAppointmentId: "sa1",
    providerPaymentId: "pi_abc123",
    provider: "stripe",
    amount: 35,
    currency: "PHP",
    method: "card",
    paidAt: "2026-03-01T12:00:00Z",
  },
  {
    id: "p2",
    userId: "u4",
    businessId: "b3",
    serviceAppointmentId: "sa3",
    providerPaymentId: "pi_def456",
    provider: "stripe",
    amount: 25,
    currency: "PHP",
    method: "card",
    paidAt: "2026-02-18T10:30:00Z",
  },
  {
    id: "p3",
    userId: "u1",
    businessId: "b2",
    serviceAppointmentId: "sa2",
    provider: "stripe",
    amount: 80,
    currency: "PHP",
    method: "card",
  },
];

// ── Payment Links ──────────────────────────────────────────
export const mockPaymentLinks: PaymentLink[] = [
  {
    id: "pl1",
    serviceAppointmentId: "sa2",
    provider: "stripe",
    redirectUrl: "https://checkout.stripe.com/mock/pl1",
    expiredAt: "2026-03-07T00:00:00Z",
  },
  {
    id: "pl2",
    serviceAppointmentId: "sa5",
    provider: "stripe",
    redirectUrl: "https://checkout.stripe.com/mock/pl2",
    paidAt: "2026-03-10T09:00:00Z",
  },
];

// ── Sales Invoices ─────────────────────────────────────────
export const mockSalesInvoices: SalesInvoice[] = [
  {
    id: "si1",
    paymentId: "p1",
    requestedAt: "2026-03-01T12:05:00Z",
    resolvedAt: "2026-03-01T12:06:00Z",
    attachmentUrl: "/invoices/invoice-sa1.pdf",
  },
  {
    id: "si2",
    paymentId: "p2",
    requestedAt: "2026-02-18T10:35:00Z",
    resolvedAt: "2026-02-18T10:36:00Z",
    attachmentUrl: "/invoices/invoice-sa3.pdf",
  },
];

// ── Notifications ──────────────────────────────────────────
export const mockNotifications: Notification[] = [
  {
    id: "n1",
    userId: "u1",
    type: "appointment_confirmed",
    payload: { serviceAppointmentId: "sa1", message: "Your haircut with Carlos is confirmed for Mar 5." },
    createdAt: "2026-03-01T12:10:00Z",
    read: true,
  },
  {
    id: "n2",
    userId: "u1",
    type: "payment_received",
    payload: { paymentId: "p1", message: "Payment of ₱35.00 received for Classic Haircut." },
    createdAt: "2026-03-01T12:05:00Z",
    read: true,
  },
  {
    id: "n3",
    userId: "u1",
    type: "appointment_reminder",
    payload: { serviceAppointmentId: "sa5", message: "Reminder: Acupuncture session on Mar 12." },
    createdAt: "2026-03-10T08:00:00Z",
    read: false,
  },
  {
    id: "n4",
    userId: "u2",
    type: "feedback_received",
    payload: { serviceFeedbackId: "sf1", message: "New 5-star review for Classic Haircut!" },
    createdAt: "2026-03-02T14:00:00Z",
    read: false,
  },
  {
    id: "n5",
    userId: "u2",
    type: "payout_ready",
    payload: { payoutStatementId: "ps1", message: "Your February payout of ₱892.50 is ready." },
    createdAt: "2026-03-01T00:00:00Z",
    read: false,
  },
];

// ── Payout Statements ──────────────────────────────────────
export const mockPayoutStatements: PayoutStatement[] = [
  {
    id: "ps1",
    businessId: "b1",
    periodStart: "2026-02-01",
    periodEnd: "2026-02-28",
    grossCollection: 1050,
    totalFees: 31.5,
    withholdingTax: 126,
    netPayout: 892.5,
  },
  {
    id: "ps2",
    businessId: "b2",
    periodStart: "2026-02-01",
    periodEnd: "2026-02-28",
    grossCollection: 2400,
    totalFees: 72,
    withholdingTax: 288,
    netPayout: 2040,
  },
  {
    id: "ps3",
    businessId: "b1",
    periodStart: "2026-01-01",
    periodEnd: "2026-01-31",
    grossCollection: 980,
    totalFees: 29.4,
    withholdingTax: 117.6,
    netPayout: 833,
  },
];

// ── Service Billings ───────────────────────────────────────
export const mockServiceBillings: ServiceBilling[] = [
  {
    id: "sb1",
    payoutStatementId: "ps1",
    payload: { serviceName: "Classic Haircut", count: 20, subtotal: 700 },
  },
  {
    id: "sb2",
    payoutStatementId: "ps1",
    payload: { serviceName: "Beard Trim & Shape", count: 14, subtotal: 350 },
  },
  {
    id: "sb3",
    payoutStatementId: "ps2",
    payload: { serviceName: "Deep Tissue Massage", count: 20, subtotal: 1600 },
  },
  {
    id: "sb4",
    payoutStatementId: "ps2",
    payload: { serviceName: "Acupuncture Session", count: 10, subtotal: 800 },
  },
];

// ── Service Feedback ───────────────────────────────────────
export const mockServiceFeedbacks: ServiceFeedback[] = [
  {
    id: "sf1",
    userId: "u1",
    serviceId: "s1",
    title: "Best haircut I've ever had!",
    richText: "Carlos really knows his craft. The hot towel finish was amazing.",
    rating: 5,
    createdAt: "2026-03-02T13:00:00Z",
  },
  {
    id: "sf2",
    userId: "u4",
    serviceId: "s5",
    title: "Great intro to yoga",
    richText: "Very welcoming class. Perfect for beginners like me.",
    rating: 4,
    createdAt: "2026-02-21T11:00:00Z",
  },
  {
    id: "sf3",
    userId: "u1",
    serviceId: "s3",
    title: "Incredible tension relief",
    richText: "My back feels so much better after the deep tissue session.",
    rating: 5,
    createdAt: "2026-02-15T16:00:00Z",
  },
];

// ── Service Tags ───────────────────────────────────────────
export const mockServiceTags: ServiceTag[] = [
  { id: "st1", name: "Haircut", description: "Hair cutting and styling services" },
  { id: "st2", name: "Massage", description: "Therapeutic massage services" },
  { id: "st3", name: "Wellness", description: "Health and wellness services" },
  { id: "st4", name: "Yoga", description: "Yoga and meditation classes" },
  { id: "st5", name: "Grooming", description: "Personal grooming services" },
  { id: "st6", name: "Therapy", description: "Therapeutic treatments" },
];

// ── Billing Addresses ──────────────────────────────────────
export const mockBillingAddresses: BillingAddress[] = [
  {
    id: "ba1",
    userId: "u1",
    addressLine1: "123 Main St",
    addressLine2: "Apt 4B",
    city: "New York",
    state: "NY",
    postalCode: "10001",
    country: "US",
  },
  {
    id: "ba2",
    userId: "u4",
    addressLine1: "456 Oak Ave",
    city: "Austin",
    state: "TX",
    postalCode: "73301",
    country: "US",
  },
];

// ── Helper lookups ─────────────────────────────────────────
export function getBusinessById(id: string) {
  return mockBusinesses.find((b) => b.id === id);
}

export function getServicesByBusinessId(businessId: string) {
  return mockServices.filter((s) => s.businessId === businessId);
}

export function getServiceById(id: string) {
  return mockServices.find((s) => s.id === id);
}

export function getUserById(id: string) {
  return mockUsers.find((u) => u.id === id);
}

export function getFieldsByServiceId(serviceId: string) {
  return mockServiceAppointmentFields.filter((f) => f.serviceId === serviceId);
}

export function getOptionsByFieldId(fieldId: string) {
  return mockServiceAppointmentFieldOptions.filter((o) => o.serviceAppointmentFieldId === fieldId);
}

export function getAppointmentsByUserId(userId: string) {
  return mockServiceAppointments.filter((a) => a.userId === userId);
}

export function getAppointmentsByServiceId(serviceId: string) {
  return mockServiceAppointments.filter((a) => a.serviceId === serviceId);
}

export function getPaymentsByUserId(userId: string) {
  return mockPayments.filter((p) => p.userId === userId);
}

export function getNotificationsByUserId(userId: string) {
  return mockNotifications.filter((n) => n.userId === userId);
}

export function getPayoutsByBusinessId(businessId: string) {
  return mockPayoutStatements.filter((ps) => ps.businessId === businessId);
}

export function getFeedbacksByServiceId(serviceId: string) {
  return mockServiceFeedbacks.filter((f) => f.serviceId === serviceId);
}

export function getBusinessesByUserId(userId: string) {
  return mockBusinesses.filter((b) => b.userId === userId);
}

export function getBillingsByPayoutId(payoutStatementId: string) {
  return mockServiceBillings.filter((sb) => sb.payoutStatementId === payoutStatementId);
}
