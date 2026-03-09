export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  DateTime: { input: any; output: any; }
  JSON: { input: any; output: any; }
};

export type ApproveServiceAppointmentPayload = {
  __typename?: 'ApproveServiceAppointmentPayload';
  serviceAppointment: ServiceAppointment;
};

/** A user's billing address. Each user has at most one billing address. */
export type BillingAddress = Node & {
  __typename?: 'BillingAddress';
  /** Primary address line */
  addressLine1: Scalars['String']['output'];
  /** Secondary address line */
  addressLine2?: Maybe<Scalars['String']['output']>;
  /** City */
  city?: Maybe<Scalars['String']['output']>;
  /** Country */
  country: Scalars['String']['output'];
  /** When the record was created */
  createdAt: Scalars['DateTime']['output'];
  /** ID of the user who created this record */
  createdBy: Scalars['ID']['output'];
  /** Globally unique identifier */
  id: Scalars['ID']['output'];
  /** Postal / ZIP code */
  postalCode?: Maybe<Scalars['String']['output']>;
  /** State or province */
  state?: Maybe<Scalars['String']['output']>;
  /** When the record was last updated */
  updatedAt: Scalars['DateTime']['output'];
  /** The user who owns this billing address */
  user?: Maybe<User>;
  /** Owning user ID */
  userId: Scalars['ID']['output'];
};

export type BillingAddressConnection = {
  __typename?: 'BillingAddressConnection';
  edges: Array<BillingAddressEdge>;
  pageInfo: PageInfo;
};

export type BillingAddressEdge = {
  __typename?: 'BillingAddressEdge';
  cursor: Scalars['String']['output'];
  node: BillingAddress;
};

export type BillingAddressFilter = {
  country?: InputMaybe<Scalars['String']['input']>;
  userId?: InputMaybe<Scalars['ID']['input']>;
};

export type BillingAddressSort = {
  field: BillingAddressSortField;
};

export enum BillingAddressSortField {
  Country = 'COUNTRY',
  CountryDesc = 'COUNTRY_DESC',
  CreatedAt = 'CREATED_AT',
  CreatedAtDesc = 'CREATED_AT_DESC'
}

/** A business entity owned by a user. */
export type Business = Node & {
  __typename?: 'Business';
  /** URL to the business banner image */
  bannerImageUrl?: Maybe<Scalars['String']['output']>;
  /** When the record was created */
  createdAt: Scalars['DateTime']['output'];
  /** ID of the user who created this record */
  createdBy: Scalars['ID']['output'];
  /** Business description */
  description?: Maybe<Scalars['String']['output']>;
  /** Globally unique identifier */
  id: Scalars['ID']['output'];
  /** Metrics for this business (total reviews, average rating) */
  metrics?: Maybe<BusinessMetric>;
  /** Business name */
  name: Scalars['String']['output'];
  /** Payments received by this business */
  payments?: Maybe<PaymentConnection>;
  /** Payout statements for this business */
  payoutStatements?: Maybe<PayoutStatementConnection>;
  /** Services offered by this business */
  services?: Maybe<ServiceConnection>;
  /** When the record was last updated */
  updatedAt: Scalars['DateTime']['output'];
  /** The user who owns this business */
  user?: Maybe<User>;
  /** Owning user ID */
  userId: Scalars['ID']['output'];
};


/** A business entity owned by a user. */
export type BusinessPaymentsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  first: Scalars['Int']['input'];
};


/** A business entity owned by a user. */
export type BusinessPayoutStatementsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  first: Scalars['Int']['input'];
};


/** A business entity owned by a user. */
export type BusinessServicesArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  first: Scalars['Int']['input'];
};

export type BusinessConnection = {
  __typename?: 'BusinessConnection';
  edges: Array<BusinessEdge>;
  pageInfo: PageInfo;
};

export type BusinessEdge = {
  __typename?: 'BusinessEdge';
  cursor: Scalars['String']['output'];
  node: Business;
};

export type BusinessFilter = {
  name?: InputMaybe<Scalars['String']['input']>;
  userId?: InputMaybe<Scalars['ID']['input']>;
};

/** Aggregated metrics for a business (total reviews, average rating). */
export type BusinessMetric = Node & {
  __typename?: 'BusinessMetric';
  /** Average rating (1-5) */
  averageRating: Scalars['Float']['output'];
  /** The associated business */
  business?: Maybe<Business>;
  /** ID of the associated business */
  businessId: Scalars['ID']['output'];
  /** When the record was created */
  createdAt: Scalars['DateTime']['output'];
  /** Globally unique identifier */
  id: Scalars['ID']['output'];
  /** Total number of reviews */
  totalReviews: Scalars['Int']['output'];
  /** Total number of services */
  totalServices: Scalars['Int']['output'];
  /** When the record was last updated */
  updatedAt: Scalars['DateTime']['output'];
};

export type BusinessMetricConnection = {
  __typename?: 'BusinessMetricConnection';
  edges: Array<BusinessMetricEdge>;
  pageInfo: PageInfo;
};

export type BusinessMetricEdge = {
  __typename?: 'BusinessMetricEdge';
  cursor: Scalars['String']['output'];
  node: BusinessMetric;
};

export type BusinessSort = {
  field: BusinessSortField;
};

export enum BusinessSortField {
  AverageRating = 'AVERAGE_RATING',
  AverageRatingDesc = 'AVERAGE_RATING_DESC',
  CreatedAt = 'CREATED_AT',
  CreatedAtDesc = 'CREATED_AT_DESC',
  Name = 'NAME',
  NameDesc = 'NAME_DESC'
}

export type CancelPaymentLinkInput = {
  id: Scalars['ID']['input'];
};

export type CancelPaymentLinkPayload = {
  __typename?: 'CancelPaymentLinkPayload';
  paymentLink: PaymentLink;
};

export type CancelServiceAppointmentPayload = {
  __typename?: 'CancelServiceAppointmentPayload';
  serviceAppointment: ServiceAppointment;
};

export type CompleteServiceAppointmentByBusinessInput = {
  /** URL of proof of the completed appointment (e.g. photo, document) */
  completedProofUrl: Scalars['String']['input'];
};

export type CompleteServiceAppointmentByBusinessPayload = {
  __typename?: 'CompleteServiceAppointmentByBusinessPayload';
  serviceAppointment: ServiceAppointment;
};

export type CompleteServiceAppointmentPayload = {
  __typename?: 'CompleteServiceAppointmentPayload';
  serviceAppointment: ServiceAppointment;
};

export type CreateBusinessInput = {
  bannerImageUrl?: InputMaybe<Scalars['String']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  name: Scalars['String']['input'];
};

export type CreateBusinessPayload = {
  __typename?: 'CreateBusinessPayload';
  business: Business;
};

export type CreatePaymentLinkInput = {
  /** Defaults to ${FRONTEND_URL}/appointment/cancelled if omitted */
  canceledUrl?: InputMaybe<Scalars['String']['input']>;
  /** Defaults to ${FRONTEND_URL}/appointment/failed if omitted */
  failedUrl?: InputMaybe<Scalars['String']['input']>;
  serviceAppointmentsId: Scalars['ID']['input'];
  /** Defaults to ${FRONTEND_URL}/appointment/success if omitted */
  successUrl?: InputMaybe<Scalars['String']['input']>;
};

export type CreatePaymentLinkPayload = {
  __typename?: 'CreatePaymentLinkPayload';
  paymentLink: PaymentLink;
};

export type CreatePayoutStatementInput = {
  businessId: Scalars['ID']['input'];
  grossCollection: Scalars['Float']['input'];
  netPayout: Scalars['Float']['input'];
  periodEnd: Scalars['DateTime']['input'];
  periodStart: Scalars['DateTime']['input'];
  totalFees: Scalars['Float']['input'];
  withholdingTax: Scalars['Float']['input'];
};

export type CreatePayoutStatementPayload = {
  __typename?: 'CreatePayoutStatementPayload';
  payoutStatement: PayoutStatement;
};

export type CreateServiceAppointmentInput = {
  amount: Scalars['Float']['input'];
  /** Must match the businessId of the service — validated server-side */
  businessId: Scalars['ID']['input'];
  currency: Scalars['String']['input'];
  payload: Scalars['JSON']['input'];
  serviceId: Scalars['ID']['input'];
};

export type CreateServiceAppointmentPayload = {
  __typename?: 'CreateServiceAppointmentPayload';
  serviceAppointment: ServiceAppointment;
};

export type CreateServiceBillingInput = {
  payload: Scalars['JSON']['input'];
  payoutStatementId: Scalars['ID']['input'];
};

export type CreateServiceBillingPayload = {
  __typename?: 'CreateServiceBillingPayload';
  serviceBilling: ServiceBilling;
};

export type CreateServiceFeedbackInput = {
  appointmentId: Scalars['ID']['input'];
  payload: Scalars['JSON']['input'];
  rating: Scalars['Int']['input'];
  serviceId: Scalars['ID']['input'];
};

export type CreateServiceFeedbackPayload = {
  __typename?: 'CreateServiceFeedbackPayload';
  serviceFeedback: ServiceFeedback;
};

export type CreateServiceInput = {
  bannerImageUrl?: InputMaybe<Scalars['String']['input']>;
  businessId: Scalars['ID']['input'];
  description?: InputMaybe<Scalars['String']['input']>;
  maxPrice?: InputMaybe<Scalars['Float']['input']>;
  minPrice?: InputMaybe<Scalars['Float']['input']>;
  name: Scalars['String']['input'];
  tags?: InputMaybe<Array<Scalars['String']['input']>>;
};

export type CreateServicePayload = {
  __typename?: 'CreateServicePayload';
  service: Service;
};

export type CreateTodoInput = {
  description?: InputMaybe<Scalars['String']['input']>;
  dueDate?: InputMaybe<Scalars['DateTime']['input']>;
  id?: InputMaybe<Scalars['ID']['input']>;
  priority?: InputMaybe<TodoPriority>;
  status?: InputMaybe<TodoStatus>;
  title: Scalars['String']['input'];
};

export type CreateTodoPayload = {
  __typename?: 'CreateTodoPayload';
  todo: Todo;
};

export type DeleteBusinessInput = {
  id: Scalars['ID']['input'];
};

export type DeleteBusinessPayload = {
  __typename?: 'DeleteBusinessPayload';
  deletedId: Scalars['ID']['output'];
  success: Scalars['Boolean']['output'];
};

export type DeleteServiceFormInput = {
  serviceId: Scalars['ID']['input'];
};

export type DeleteServiceFormPayload = {
  __typename?: 'DeleteServiceFormPayload';
  success: Scalars['Boolean']['output'];
};

export type DeleteServiceInput = {
  id: Scalars['ID']['input'];
};

export type DeleteServicePageInput = {
  serviceId: Scalars['ID']['input'];
};

export type DeleteServicePagePayload = {
  __typename?: 'DeleteServicePagePayload';
  success: Scalars['Boolean']['output'];
};

export type DeleteServicePayload = {
  __typename?: 'DeleteServicePayload';
  deletedId: Scalars['ID']['output'];
  success: Scalars['Boolean']['output'];
};

export type DeleteTodoInput = {
  id: Scalars['ID']['input'];
};

export type DeleteTodoPayload = {
  __typename?: 'DeleteTodoPayload';
  deletedId: Scalars['ID']['output'];
  success: Scalars['Boolean']['output'];
};

export type GeneratePaymentStatementInput = {
  /** ID of the business to generate the statement for */
  businessId: Scalars['ID']['input'];
  /**
   * Optional cutoff date for the period (defaults to the current date/time).
   * Must be after the business's last payout period end date.
   */
  periodEnd?: InputMaybe<Scalars['DateTime']['input']>;
};

export type GeneratePaymentStatementPayload = {
  __typename?: 'GeneratePaymentStatementPayload';
  payoutStatement: PayoutStatement;
  serviceBillings: Array<ServiceBilling>;
};

export type Mutation = {
  __typename?: 'Mutation';
  /**
   * Placeholder — actual mutations are defined in domain-specific files
   * and extend this type.
   */
  _empty?: Maybe<Scalars['String']['output']>;
  /** Approve a service appointment — only callable by the business owner */
  approveServiceAppointment: ApproveServiceAppointmentPayload;
  /** Cancel a payment link (owner only) */
  cancelPaymentLink: CancelPaymentLinkPayload;
  /** Cancel a service appointment (requires authentication) */
  cancelServiceAppointment: CancelServiceAppointmentPayload;
  /**
   * Mark a service appointment as completed by the customer.
   * Sets completedAt = now(). Can finalize a pending business-owner completion.
   */
  completeServiceAppointment: CompleteServiceAppointmentPayload;
  /**
   * Mark a service appointment as completed by the business owner.
   * Requires a proof URL. Sets completedAt = now() + 7 days.
   * The appointment will appear as TO_BE_COMPLETED to the customer until they confirm.
   */
  completeServiceAppointmentByBusiness: CompleteServiceAppointmentByBusinessPayload;
  /** Create a new business (requires authentication) */
  createBusiness: CreateBusinessPayload;
  /** Create a payment link for an appointment (requires authentication) */
  createPaymentLink: CreatePaymentLinkPayload;
  /** Create a payout statement (admin only) */
  createPayoutStatement: CreatePayoutStatementPayload;
  /** Create a new service under a business (owner only) */
  createService: CreateServicePayload;
  /** Book a service appointment (requires authentication) */
  createServiceAppointment: CreateServiceAppointmentPayload;
  /** Create a service billing (admin only) */
  createServiceBilling: CreateServiceBillingPayload;
  /** Submit a feedback/review for a service (requires authentication) */
  createServiceFeedback: CreateServiceFeedbackPayload;
  /** Create a new todo (requires authentication) */
  createTodo: CreateTodoPayload;
  /** Delete a business (owner only) */
  deleteBusiness: DeleteBusinessPayload;
  /** Delete a service (business owner only) */
  deleteService: DeleteServicePayload;
  /** Delete a service form (service owner only) */
  deleteServiceForm: DeleteServiceFormPayload;
  /** Delete a service page (service owner only) */
  deleteServicePage: DeleteServicePagePayload;
  /** Delete a todo (owner only) */
  deleteTodo: DeleteTodoPayload;
  /**
   * Auto-generate a payout statement for a business.
   * Fetches all paid payments since the last payout period, creates per-payment
   * BIR-compliant service billings, and advances the period watermark.
   * The caller must own the business.
   */
  generateBusinessPaymentStatement: GeneratePaymentStatementPayload;
  /**
   * Onboarding transaction: creates user profile, billing address,
   * and optionally a business in a single atomic operation.
   */
  processOnboarding: ProcessOnboardingPayload;
  /** Reject a service appointment — only callable by the business owner */
  rejectServiceAppointment: RejectServiceAppointmentPayload;
  /** Request a sales invoice for a payment (customer only) */
  requestSalesInvoice: RequestSalesInvoicePayload;
  /** Resolve a sales invoice with attachment (business owner only) */
  resolveSalesInvoice: ResolveSalesInvoicePayload;
  /** Update a billing address (owner only) */
  updateBillingAddress: UpdateBillingAddressPayload;
  /** Update a business (owner only) */
  updateBusiness: UpdateBusinessPayload;
  /** Update email in Keycloak (owner only) */
  updateEmail: UpdateEmailPayload;
  /** Update password in Keycloak (owner only) */
  updatePassword: UpdatePasswordPayload;
  /** Update phone number in Keycloak (owner only) */
  updatePhoneNumber: UpdatePhoneNumberPayload;
  /** Update a service (business owner only) */
  updateService: UpdateServicePayload;
  /** Update an existing todo (owner only) */
  updateTodo: UpdateTodoPayload;
  /** Update user profile info (owner only) */
  updateUser: UpdateUserPayload;
  /** Update the authenticated user's notification preferences (owner only) */
  updateUserPreference: UpdateUserPreferencePayload;
  /** Create or update the form for a service (service owner only) */
  upsertServiceForm: UpsertServiceFormPayload;
  /** Create or update the page for a service (service owner only) */
  upsertServicePage: UpsertServicePagePayload;
};


export type MutationApproveServiceAppointmentArgs = {
  id: Scalars['ID']['input'];
};


export type MutationCancelPaymentLinkArgs = {
  input: CancelPaymentLinkInput;
};


export type MutationCancelServiceAppointmentArgs = {
  id: Scalars['ID']['input'];
};


export type MutationCompleteServiceAppointmentArgs = {
  id: Scalars['ID']['input'];
};


export type MutationCompleteServiceAppointmentByBusinessArgs = {
  id: Scalars['ID']['input'];
  input: CompleteServiceAppointmentByBusinessInput;
};


export type MutationCreateBusinessArgs = {
  input: CreateBusinessInput;
};


export type MutationCreatePaymentLinkArgs = {
  input: CreatePaymentLinkInput;
};


export type MutationCreatePayoutStatementArgs = {
  input: CreatePayoutStatementInput;
};


export type MutationCreateServiceArgs = {
  input: CreateServiceInput;
};


export type MutationCreateServiceAppointmentArgs = {
  input: CreateServiceAppointmentInput;
};


export type MutationCreateServiceBillingArgs = {
  input: CreateServiceBillingInput;
};


export type MutationCreateServiceFeedbackArgs = {
  input: CreateServiceFeedbackInput;
};


export type MutationCreateTodoArgs = {
  input: CreateTodoInput;
};


export type MutationDeleteBusinessArgs = {
  input: DeleteBusinessInput;
};


export type MutationDeleteServiceArgs = {
  input: DeleteServiceInput;
};


export type MutationDeleteServiceFormArgs = {
  input: DeleteServiceFormInput;
};


export type MutationDeleteServicePageArgs = {
  input: DeleteServicePageInput;
};


export type MutationDeleteTodoArgs = {
  input: DeleteTodoInput;
};


export type MutationGenerateBusinessPaymentStatementArgs = {
  input: GeneratePaymentStatementInput;
};


export type MutationProcessOnboardingArgs = {
  input: ProcessOnboardingInput;
};


export type MutationRejectServiceAppointmentArgs = {
  id: Scalars['ID']['input'];
};


export type MutationRequestSalesInvoiceArgs = {
  input: RequestSalesInvoiceInput;
};


export type MutationResolveSalesInvoiceArgs = {
  input: ResolveSalesInvoiceInput;
};


export type MutationUpdateBillingAddressArgs = {
  input: UpdateBillingAddressInput;
};


export type MutationUpdateBusinessArgs = {
  input: UpdateBusinessInput;
};


export type MutationUpdateEmailArgs = {
  input: UpdateEmailInput;
};


export type MutationUpdatePasswordArgs = {
  input: UpdatePasswordInput;
};


export type MutationUpdatePhoneNumberArgs = {
  input: UpdatePhoneNumberInput;
};


export type MutationUpdateServiceArgs = {
  input: UpdateServiceInput;
};


export type MutationUpdateTodoArgs = {
  input: UpdateTodoInput;
};


export type MutationUpdateUserArgs = {
  input: UpdateUserInput;
};


export type MutationUpdateUserPreferenceArgs = {
  input: UpdateUserPreferenceInput;
};


export type MutationUpsertServiceFormArgs = {
  input: UpsertServiceFormInput;
};


export type MutationUpsertServicePageArgs = {
  input: UpsertServicePageInput;
};

/**
 * An object with a globally unique ID.
 * Base interface for all types fetchable by ID.
 */
export type Node = {
  /** A globally unique identifier. */
  id: Scalars['ID']['output'];
};

/** A notification sent to a user. */
export type Notification = Node & {
  __typename?: 'Notification';
  /** When the record was created */
  createdAt: Scalars['DateTime']['output'];
  /** When the notification was delivered */
  deliveredAt?: Maybe<Scalars['DateTime']['output']>;
  /** Number of delivery attempts */
  deliveryAttemptCount: Scalars['Int']['output'];
  /** Globally unique identifier */
  id: Scalars['ID']['output'];
  /** Notification content payload (JSON) */
  payload: Scalars['JSON']['output'];
  /** Notification provider (e.g. EMAIL, SMS) */
  provider: Scalars['String']['output'];
  /** When the record was last updated */
  updatedAt: Scalars['DateTime']['output'];
  /** The user who received this notification */
  user?: Maybe<User>;
  /** ID of the recipient user */
  userId: Scalars['ID']['output'];
};

export type NotificationConnection = {
  __typename?: 'NotificationConnection';
  edges: Array<NotificationEdge>;
  pageInfo: PageInfo;
};

export type NotificationEdge = {
  __typename?: 'NotificationEdge';
  cursor: Scalars['String']['output'];
  node: Notification;
};

export type NotificationFilter = {
  provider?: InputMaybe<Scalars['String']['input']>;
  userId?: InputMaybe<Scalars['ID']['input']>;
};

export type NotificationSort = {
  field: NotificationSortField;
};

export enum NotificationSortField {
  CreatedAt = 'CREATED_AT',
  CreatedAtDesc = 'CREATED_AT_DESC'
}

/** Input for the billing address during onboarding */
export type OnboardingBillingAddressInput = {
  addressLine1: Scalars['String']['input'];
  addressLine2?: InputMaybe<Scalars['String']['input']>;
  city?: InputMaybe<Scalars['String']['input']>;
  country: Scalars['String']['input'];
  postalCode?: InputMaybe<Scalars['String']['input']>;
  state?: InputMaybe<Scalars['String']['input']>;
};

/** Input for the business during onboarding (optional) */
export type OnboardingBusinessInput = {
  bannerImageUrl?: InputMaybe<Scalars['String']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  name: Scalars['String']['input'];
};

/** Input for the user profile during onboarding */
export type OnboardingUserInput = {
  bannerImageUrl?: InputMaybe<Scalars['String']['input']>;
  firstName: Scalars['String']['input'];
  /** Whether this user is a business owner */
  isBusinessOwner?: InputMaybe<Scalars['Boolean']['input']>;
  lastName: Scalars['String']['input'];
  middleName?: InputMaybe<Scalars['String']['input']>;
  /** Mobile number in format +<countryCode> <number> (e.g. +63 9380542839) */
  mobileNumber?: InputMaybe<Scalars['String']['input']>;
  profilePictureUrl?: InputMaybe<Scalars['String']['input']>;
  suffix?: InputMaybe<Scalars['String']['input']>;
};

/** Input for the user notification preferences during onboarding */
export type OnboardingUserPreferenceInput = {
  /**
   * Whitelist of event keys to deliver. An empty list means all events are delivered.
   * e.g. [\"APPOINTMENT_CREATED\", \"APPOINTMENT_PAID\"]
   */
  notificationEnabledList?: InputMaybe<Array<Scalars['String']['input']>>;
  /** Notification method: EMAIL or SMS */
  notificationMethod: Scalars['String']['input'];
  notificationsEnabled: Scalars['Boolean']['input'];
};

/** Information about pagination in a connection. */
export type PageInfo = {
  __typename?: 'PageInfo';
  /** When paginating forwards, the cursor to continue. */
  endCursor?: Maybe<Scalars['String']['output']>;
  /** When paginating forwards, are there more items? */
  hasNextPage: Scalars['Boolean']['output'];
};

/** A completed payment record. Created via webhook only. */
export type Payment = Node & {
  __typename?: 'Payment';
  /** Payment amount */
  amount: Scalars['String']['output'];
  /** The business that received the payment */
  business?: Maybe<Business>;
  /** ID of the business receiving payment */
  businessId: Scalars['ID']['output'];
  /** When the record was created */
  createdAt: Scalars['DateTime']['output'];
  /** ID of the user who created this record */
  createdBy: Scalars['ID']['output'];
  /** Currency code */
  currency: Scalars['String']['output'];
  /** Globally unique identifier */
  id: Scalars['ID']['output'];
  /** Payment method */
  method: Scalars['String']['output'];
  /** When the payment was made */
  paidAt: Scalars['DateTime']['output'];
  /** Payment provider name */
  provider: Scalars['String']['output'];
  /** Provider's payment ID */
  providerPaymentId: Scalars['String']['output'];
  /** When the payment was refunded (if applicable) */
  refundedAt?: Maybe<Scalars['DateTime']['output']>;
  /** Sales invoices for this payment */
  salesInvoices?: Maybe<SalesInvoiceConnection>;
  /** The associated service appointment */
  serviceAppointment?: Maybe<ServiceAppointment>;
  /** ID of the associated service appointment */
  serviceAppointmentsId: Scalars['ID']['output'];
  /** When the record was last updated */
  updatedAt: Scalars['DateTime']['output'];
  /** The user who made the payment */
  user?: Maybe<User>;
  /** ID of the user who paid */
  userId: Scalars['ID']['output'];
};


/** A completed payment record. Created via webhook only. */
export type PaymentSalesInvoicesArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  first: Scalars['Int']['input'];
};

export type PaymentConnection = {
  __typename?: 'PaymentConnection';
  edges: Array<PaymentEdge>;
  pageInfo: PageInfo;
};

export type PaymentEdge = {
  __typename?: 'PaymentEdge';
  cursor: Scalars['String']['output'];
  node: Payment;
};

export type PaymentFilter = {
  businessId?: InputMaybe<Scalars['ID']['input']>;
  serviceAppointmentsId?: InputMaybe<Scalars['ID']['input']>;
  userId?: InputMaybe<Scalars['ID']['input']>;
};

/** A payment link generated for a service appointment via Maya. */
export type PaymentLink = Node & {
  __typename?: 'PaymentLink';
  /** When the link was canceled */
  canceledAt?: Maybe<Scalars['DateTime']['output']>;
  /** When the record was created */
  createdAt: Scalars['DateTime']['output'];
  /** ID of the user who created this record */
  createdBy: Scalars['ID']['output'];
  /** When the link expires */
  expiredAt: Scalars['DateTime']['output'];
  /** When the payment failed */
  failedAt?: Maybe<Scalars['DateTime']['output']>;
  /** Globally unique identifier */
  id: Scalars['ID']['output'];
  /** When payment was completed */
  paidAt?: Maybe<Scalars['DateTime']['output']>;
  /** Payment provider name (e.g. MAYA) */
  provider: Scalars['String']['output'];
  /** Provider's payment link ID */
  providerPaymentLinkId: Scalars['String']['output'];
  /** Redirect URL for the payment */
  redirectUrl: Scalars['String']['output'];
  /** The associated service appointment */
  serviceAppointment?: Maybe<ServiceAppointment>;
  /** ID of the associated service appointment */
  serviceAppointmentsId: Scalars['ID']['output'];
  /** When the record was last updated */
  updatedAt: Scalars['DateTime']['output'];
};

export type PaymentLinkConnection = {
  __typename?: 'PaymentLinkConnection';
  edges: Array<PaymentLinkEdge>;
  pageInfo: PageInfo;
};

export type PaymentLinkEdge = {
  __typename?: 'PaymentLinkEdge';
  cursor: Scalars['String']['output'];
  node: PaymentLink;
};

export type PaymentLinkFilter = {
  serviceAppointmentsId?: InputMaybe<Scalars['ID']['input']>;
};

export type PaymentLinkSort = {
  field: PaymentLinkSortField;
};

export enum PaymentLinkSortField {
  CreatedAt = 'CREATED_AT',
  CreatedAtDesc = 'CREATED_AT_DESC'
}

export type PaymentSort = {
  field: PaymentSortField;
};

export enum PaymentSortField {
  CreatedAt = 'CREATED_AT',
  CreatedAtDesc = 'CREATED_AT_DESC',
  PaidAt = 'PAID_AT',
  PaidAtDesc = 'PAID_AT_DESC'
}

/** A payout statement for a business. Created by admin. */
export type PayoutStatement = Node & {
  __typename?: 'PayoutStatement';
  /** The associated business */
  business?: Maybe<Business>;
  /** ID of the business */
  businessId: Scalars['ID']['output'];
  /** When the record was created */
  createdAt: Scalars['DateTime']['output'];
  /** ID of the admin who created this record */
  createdBy?: Maybe<Scalars['ID']['output']>;
  /** Gross collection amount */
  grossCollection: Scalars['Float']['output'];
  /** Globally unique identifier */
  id: Scalars['ID']['output'];
  /** Net payout amount */
  netPayout: Scalars['Float']['output'];
  /** End of the payout period */
  periodEnd: Scalars['DateTime']['output'];
  /** Start of the payout period */
  periodStart: Scalars['DateTime']['output'];
  /** Service billings in this payout statement */
  serviceBillings?: Maybe<ServiceBillingConnection>;
  /** Total fees deducted */
  totalFees: Scalars['Float']['output'];
  /** When the record was last updated */
  updatedAt: Scalars['DateTime']['output'];
  /** Withholding tax amount */
  withholdingTax: Scalars['Float']['output'];
};


/** A payout statement for a business. Created by admin. */
export type PayoutStatementServiceBillingsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  first: Scalars['Int']['input'];
};

export type PayoutStatementConnection = {
  __typename?: 'PayoutStatementConnection';
  edges: Array<PayoutStatementEdge>;
  pageInfo: PageInfo;
};

export type PayoutStatementEdge = {
  __typename?: 'PayoutStatementEdge';
  cursor: Scalars['String']['output'];
  node: PayoutStatement;
};

export type PayoutStatementFilter = {
  businessId?: InputMaybe<Scalars['ID']['input']>;
};

export type PayoutStatementSort = {
  field: PayoutStatementSortField;
};

export enum PayoutStatementSortField {
  CreatedAt = 'CREATED_AT',
  CreatedAtDesc = 'CREATED_AT_DESC',
  PeriodStart = 'PERIOD_START',
  PeriodStartDesc = 'PERIOD_START_DESC'
}

export type ProcessOnboardingInput = {
  billingAddress: OnboardingBillingAddressInput;
  business?: InputMaybe<OnboardingBusinessInput>;
  user: OnboardingUserInput;
  userPreference: OnboardingUserPreferenceInput;
};

export type ProcessOnboardingPayload = {
  __typename?: 'ProcessOnboardingPayload';
  billingAddress: BillingAddress;
  business?: Maybe<Business>;
  user: User;
  userPreference: UserPreference;
};

export type Query = {
  __typename?: 'Query';
  /** Fetch a single billing address by ID */
  billingAddress?: Maybe<BillingAddress>;
  /** List billing addresses with relay-style cursor pagination */
  billingAddresses: BillingAddressConnection;
  /** Fetch a single business by ID */
  business?: Maybe<Business>;
  /** Fetch a business metric by ID */
  businessMetric?: Maybe<BusinessMetric>;
  /** Fetch a business metric by business ID */
  businessMetricByBusiness?: Maybe<BusinessMetric>;
  /** List businesses with relay-style cursor pagination */
  businesses: BusinessConnection;
  /** Fetch a node by its global ID (Relay Global Object Identification). */
  node?: Maybe<Node>;
  /** Fetch multiple nodes by their global IDs. */
  nodes: Array<Maybe<Node>>;
  /** Fetch a single notification by ID */
  notification?: Maybe<Notification>;
  /** List notifications with relay-style cursor pagination */
  notifications: NotificationConnection;
  /** Fetch a single payment by ID */
  payment?: Maybe<Payment>;
  /** Fetch a single payment link by ID */
  paymentLink?: Maybe<PaymentLink>;
  /** List payment links with relay-style cursor pagination */
  paymentLinks: PaymentLinkConnection;
  /** List payments with relay-style cursor pagination */
  payments: PaymentConnection;
  /** Fetch a single payout statement by ID */
  payoutStatement?: Maybe<PayoutStatement>;
  /** List payout statements with relay-style cursor pagination */
  payoutStatements: PayoutStatementConnection;
  /** Fetch a single sales invoice by ID */
  salesInvoice?: Maybe<SalesInvoice>;
  /** List sales invoices with relay-style cursor pagination */
  salesInvoices: SalesInvoiceConnection;
  /** Fetch a single service by ID */
  service?: Maybe<Service>;
  /** Fetch a single service appointment by ID */
  serviceAppointment?: Maybe<ServiceAppointment>;
  /** List service appointments with relay-style cursor pagination */
  serviceAppointments: ServiceAppointmentConnection;
  /** Fetch a single service billing by ID */
  serviceBilling?: Maybe<ServiceBilling>;
  /** List service billings with relay-style cursor pagination */
  serviceBillings: ServiceBillingConnection;
  /** Fetch a single service feedback by ID */
  serviceFeedback?: Maybe<ServiceFeedback>;
  /** List service feedbacks with relay-style cursor pagination */
  serviceFeedbacks: ServiceFeedbackConnection;
  /** Fetch a service form by ID */
  serviceForm?: Maybe<ServiceForm>;
  /** Fetch a service form by its service ID */
  serviceFormByService?: Maybe<ServiceForm>;
  /** Fetch a service metric by ID */
  serviceMetric?: Maybe<ServiceMetric>;
  /** Fetch a service metric by service ID */
  serviceMetricByService?: Maybe<ServiceMetric>;
  /** Fetch a service page by ID */
  servicePage?: Maybe<ServicePage>;
  /** Fetch a service page by its service ID */
  servicePageByService?: Maybe<ServicePage>;
  /** List services with relay-style cursor pagination */
  services: ServiceConnection;
  /** Fetch a single todo by ID */
  todo?: Maybe<Todo>;
  /** List todos with relay-style cursor pagination */
  todos: TodoConnection;
  /** Fetch a single user by ID */
  user?: Maybe<User>;
  /** Fetch a single user preference by ID */
  userPreference?: Maybe<UserPreference>;
  /** List user preferences with relay-style cursor pagination */
  userPreferences: UserPreferenceConnection;
  /** List users with relay-style cursor pagination */
  users: UserConnection;
};


export type QueryBillingAddressArgs = {
  id: Scalars['ID']['input'];
};


export type QueryBillingAddressesArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  filter?: InputMaybe<BillingAddressFilter>;
  first: Scalars['Int']['input'];
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<BillingAddressSort>;
};


export type QueryBusinessArgs = {
  id: Scalars['ID']['input'];
};


export type QueryBusinessMetricArgs = {
  id: Scalars['ID']['input'];
};


export type QueryBusinessMetricByBusinessArgs = {
  businessId: Scalars['ID']['input'];
};


export type QueryBusinessesArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  filter?: InputMaybe<BusinessFilter>;
  first: Scalars['Int']['input'];
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<BusinessSort>;
};


export type QueryNodeArgs = {
  id: Scalars['ID']['input'];
};


export type QueryNodesArgs = {
  ids: Array<Scalars['ID']['input']>;
};


export type QueryNotificationArgs = {
  id: Scalars['ID']['input'];
};


export type QueryNotificationsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  filter?: InputMaybe<NotificationFilter>;
  first: Scalars['Int']['input'];
  sort?: InputMaybe<NotificationSort>;
};


export type QueryPaymentArgs = {
  id: Scalars['ID']['input'];
};


export type QueryPaymentLinkArgs = {
  id: Scalars['ID']['input'];
};


export type QueryPaymentLinksArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  filter?: InputMaybe<PaymentLinkFilter>;
  first: Scalars['Int']['input'];
  sort?: InputMaybe<PaymentLinkSort>;
};


export type QueryPaymentsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  filter?: InputMaybe<PaymentFilter>;
  first: Scalars['Int']['input'];
  sort?: InputMaybe<PaymentSort>;
};


export type QueryPayoutStatementArgs = {
  id: Scalars['ID']['input'];
};


export type QueryPayoutStatementsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  filter?: InputMaybe<PayoutStatementFilter>;
  first: Scalars['Int']['input'];
  sort?: InputMaybe<PayoutStatementSort>;
};


export type QuerySalesInvoiceArgs = {
  id: Scalars['ID']['input'];
};


export type QuerySalesInvoicesArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  filter?: InputMaybe<SalesInvoiceFilter>;
  first: Scalars['Int']['input'];
  sort?: InputMaybe<SalesInvoiceSort>;
};


export type QueryServiceArgs = {
  id: Scalars['ID']['input'];
};


export type QueryServiceAppointmentArgs = {
  id: Scalars['ID']['input'];
};


export type QueryServiceAppointmentsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  filter?: InputMaybe<ServiceAppointmentFilter>;
  first: Scalars['Int']['input'];
  sort?: InputMaybe<ServiceAppointmentSort>;
};


export type QueryServiceBillingArgs = {
  id: Scalars['ID']['input'];
};


export type QueryServiceBillingsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  filter?: InputMaybe<ServiceBillingFilter>;
  first: Scalars['Int']['input'];
  sort?: InputMaybe<ServiceBillingSort>;
};


export type QueryServiceFeedbackArgs = {
  id: Scalars['ID']['input'];
};


export type QueryServiceFeedbacksArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  filter?: InputMaybe<ServiceFeedbackFilter>;
  first: Scalars['Int']['input'];
  sort?: InputMaybe<ServiceFeedbackSort>;
};


export type QueryServiceFormArgs = {
  id: Scalars['ID']['input'];
};


export type QueryServiceFormByServiceArgs = {
  serviceId: Scalars['ID']['input'];
};


export type QueryServiceMetricArgs = {
  id: Scalars['ID']['input'];
};


export type QueryServiceMetricByServiceArgs = {
  serviceId: Scalars['ID']['input'];
};


export type QueryServicePageArgs = {
  id: Scalars['ID']['input'];
};


export type QueryServicePageByServiceArgs = {
  serviceId: Scalars['ID']['input'];
};


export type QueryServicesArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  filter?: InputMaybe<ServiceFilter>;
  first: Scalars['Int']['input'];
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<ServiceSort>;
};


export type QueryTodoArgs = {
  id: Scalars['ID']['input'];
};


export type QueryTodosArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  filter?: InputMaybe<TodoFilter>;
  first: Scalars['Int']['input'];
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<TodoSort>;
};


export type QueryUserArgs = {
  id: Scalars['ID']['input'];
};


export type QueryUserPreferenceArgs = {
  id: Scalars['ID']['input'];
};


export type QueryUserPreferencesArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  filter?: InputMaybe<UserPreferenceFilter>;
  first: Scalars['Int']['input'];
  sort?: InputMaybe<UserPreferenceSort>;
};


export type QueryUsersArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  filter?: InputMaybe<UserFilter>;
  first: Scalars['Int']['input'];
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<UserSort>;
};

export type RejectServiceAppointmentPayload = {
  __typename?: 'RejectServiceAppointmentPayload';
  serviceAppointment: ServiceAppointment;
};

export type RequestSalesInvoiceInput = {
  paymentId: Scalars['ID']['input'];
};

export type RequestSalesInvoicePayload = {
  __typename?: 'RequestSalesInvoicePayload';
  salesInvoice: SalesInvoice;
};

export type ResolveSalesInvoiceInput = {
  attachmentUrl: Scalars['String']['input'];
  id: Scalars['ID']['input'];
};

export type ResolveSalesInvoicePayload = {
  __typename?: 'ResolveSalesInvoicePayload';
  salesInvoice: SalesInvoice;
};

/** A sales invoice linked to a payment. Customer requests, business owner resolves. */
export type SalesInvoice = Node & {
  __typename?: 'SalesInvoice';
  /** URL to the invoice attachment */
  attachmentUrl?: Maybe<Scalars['String']['output']>;
  /** When the record was created */
  createdAt: Scalars['DateTime']['output'];
  /** ID of the user who created this record */
  createdBy: Scalars['ID']['output'];
  /** Globally unique identifier */
  id: Scalars['ID']['output'];
  /** The associated payment */
  payment?: Maybe<Payment>;
  /** ID of the associated payment */
  paymentId: Scalars['ID']['output'];
  /** When the invoice was requested */
  requestedAt: Scalars['DateTime']['output'];
  /** ID of the user who requested */
  requestedBy: Scalars['ID']['output'];
  /** When the invoice was resolved */
  resolvedAt?: Maybe<Scalars['DateTime']['output']>;
  /** ID of the user who resolved */
  resolvedBy?: Maybe<Scalars['ID']['output']>;
  /** When the record was last updated */
  updatedAt: Scalars['DateTime']['output'];
};

export type SalesInvoiceConnection = {
  __typename?: 'SalesInvoiceConnection';
  edges: Array<SalesInvoiceEdge>;
  pageInfo: PageInfo;
};

export type SalesInvoiceEdge = {
  __typename?: 'SalesInvoiceEdge';
  cursor: Scalars['String']['output'];
  node: SalesInvoice;
};

export type SalesInvoiceFilter = {
  paymentId?: InputMaybe<Scalars['ID']['input']>;
};

export type SalesInvoiceSort = {
  field: SalesInvoiceSortField;
};

export enum SalesInvoiceSortField {
  CreatedAt = 'CREATED_AT',
  CreatedAtDesc = 'CREATED_AT_DESC'
}

/** A service offered by a business. */
export type Service = Node & {
  __typename?: 'Service';
  /** URL to the service banner image */
  bannerImageUrl?: Maybe<Scalars['String']['output']>;
  /** The owning business */
  business?: Maybe<Business>;
  /** ID of the owning business */
  businessId: Scalars['ID']['output'];
  /** When the record was created */
  createdAt: Scalars['DateTime']['output'];
  /** ID of the user who created this record */
  createdBy: Scalars['ID']['output'];
  /** Service description */
  description?: Maybe<Scalars['String']['output']>;
  /** Globally unique identifier */
  id: Scalars['ID']['output'];
  /** Maximum price of the service in PHP */
  maxPrice?: Maybe<Scalars['Float']['output']>;
  /** Metrics for this service */
  metrics?: Maybe<ServiceMetric>;
  /** Minimum price of the service in PHP */
  minPrice?: Maybe<Scalars['Float']['output']>;
  /** Service name */
  name: Scalars['String']['output'];
  /** Appointments for this service */
  serviceAppointments?: Maybe<ServiceAppointmentConnection>;
  /** Feedbacks for this service */
  serviceFeedbacks?: Maybe<ServiceFeedbackConnection>;
  /** Form configuration for this service */
  serviceForm?: Maybe<ServiceForm>;
  /** Landing page for this service */
  servicePage?: Maybe<ServicePage>;
  /** Tags associated with this service */
  tags: Array<Scalars['String']['output']>;
  /** When the record was last updated */
  updatedAt: Scalars['DateTime']['output'];
};


/** A service offered by a business. */
export type ServiceServiceAppointmentsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  first: Scalars['Int']['input'];
};


/** A service offered by a business. */
export type ServiceServiceFeedbacksArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  first: Scalars['Int']['input'];
};

/** A customer's appointment booking for a service. */
export type ServiceAppointment = Node & {
  __typename?: 'ServiceAppointment';
  /** Appointment amount */
  amount: Scalars['Float']['output'];
  /** When the appointment was approved by the business owner (null if not yet approved) */
  approvedAt?: Maybe<Scalars['DateTime']['output']>;
  /** ID of the business that owns the service */
  businessId: Scalars['ID']['output'];
  /** When the appointment was cancelled (null if active) */
  canceledAt?: Maybe<Scalars['DateTime']['output']>;
  /**
   * When the appointment was completed.
   * - null: not yet completed
   * - future date: business owner has flagged it as complete (7-day confirmation window); status is TO_BE_COMPLETED
   * - past/current date: fully completed
   */
  completedAt?: Maybe<Scalars['DateTime']['output']>;
  /** URL of the proof submitted by the business owner when marking the appointment complete */
  completedProofUrl?: Maybe<Scalars['String']['output']>;
  /** When the record was created */
  createdAt: Scalars['DateTime']['output'];
  /** ID of the user who created this record */
  createdBy: Scalars['ID']['output'];
  /** Currency code (e.g. PHP) */
  currency: Scalars['String']['output'];
  /** Globally unique identifier */
  id: Scalars['ID']['output'];
  /** When the appointment was paid (null if unpaid) */
  paidAt?: Maybe<Scalars['DateTime']['output']>;
  /** Appointment details payload (JSON) */
  payload: Scalars['JSON']['output'];
  /** Payment links for this appointment */
  paymentLinks?: Maybe<PaymentLinkConnection>;
  /** Payments for this appointment */
  payments?: Maybe<PaymentConnection>;
  /** When the appointment was rejected by the business owner (null if not rejected) */
  rejectedAt?: Maybe<Scalars['DateTime']['output']>;
  /** The service being booked */
  service?: Maybe<Service>;
  /** ID of the service being booked */
  serviceId: Scalars['ID']['output'];
  /** When the record was last updated */
  updatedAt: Scalars['DateTime']['output'];
  /** The user who booked */
  user?: Maybe<User>;
  /** ID of the user who booked */
  userId: Scalars['ID']['output'];
};


/** A customer's appointment booking for a service. */
export type ServiceAppointmentPaymentLinksArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  first: Scalars['Int']['input'];
};


/** A customer's appointment booking for a service. */
export type ServiceAppointmentPaymentsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  first: Scalars['Int']['input'];
};

export type ServiceAppointmentConnection = {
  __typename?: 'ServiceAppointmentConnection';
  edges: Array<ServiceAppointmentEdge>;
  pageInfo: PageInfo;
};

export type ServiceAppointmentEdge = {
  __typename?: 'ServiceAppointmentEdge';
  cursor: Scalars['String']['output'];
  node: ServiceAppointment;
};

export type ServiceAppointmentFilter = {
  businessId?: InputMaybe<Scalars['ID']['input']>;
  serviceId?: InputMaybe<Scalars['ID']['input']>;
  userId?: InputMaybe<Scalars['ID']['input']>;
};

export type ServiceAppointmentSort = {
  field: ServiceAppointmentSortField;
};

export enum ServiceAppointmentSortField {
  CreatedAt = 'CREATED_AT',
  CreatedAtDesc = 'CREATED_AT_DESC'
}

/** A BIR-registered service billing linked to a payout statement. */
export type ServiceBilling = Node & {
  __typename?: 'ServiceBilling';
  /** When the record was created */
  createdAt: Scalars['DateTime']['output'];
  /** Globally unique identifier */
  id: Scalars['ID']['output'];
  /** Billing payload (JSON, BIR invoice data) */
  payload: Scalars['JSON']['output'];
  /** The associated payout statement */
  payoutStatement?: Maybe<PayoutStatement>;
  /** ID of the associated payout statement */
  payoutStatementId: Scalars['ID']['output'];
  /** When the record was last updated */
  updatedAt: Scalars['DateTime']['output'];
};

export type ServiceBillingConnection = {
  __typename?: 'ServiceBillingConnection';
  edges: Array<ServiceBillingEdge>;
  pageInfo: PageInfo;
};

export type ServiceBillingEdge = {
  __typename?: 'ServiceBillingEdge';
  cursor: Scalars['String']['output'];
  node: ServiceBilling;
};

export type ServiceBillingFilter = {
  payoutStatementId?: InputMaybe<Scalars['ID']['input']>;
};

export type ServiceBillingSort = {
  field: ServiceBillingSortField;
};

export enum ServiceBillingSortField {
  CreatedAt = 'CREATED_AT',
  CreatedAtDesc = 'CREATED_AT_DESC'
}

export type ServiceConnection = {
  __typename?: 'ServiceConnection';
  edges: Array<ServiceEdge>;
  pageInfo: PageInfo;
};

export type ServiceEdge = {
  __typename?: 'ServiceEdge';
  cursor: Scalars['String']['output'];
  node: Service;
};

/** A customer's feedback/review for a service. */
export type ServiceFeedback = Node & {
  __typename?: 'ServiceFeedback';
  /** When the record was created */
  createdAt: Scalars['DateTime']['output'];
  /** ID of the user who created this record */
  createdBy: Scalars['ID']['output'];
  /** Globally unique identifier */
  id: Scalars['ID']['output'];
  /** Feedback content payload (JSON, ProseMirror) */
  payload: Scalars['JSON']['output'];
  /** Rating (1-5) */
  rating: Scalars['Int']['output'];
  /** The service being reviewed */
  service?: Maybe<Service>;
  /** ID of the service being reviewed */
  serviceId: Scalars['ID']['output'];
  /** When the record was last updated */
  updatedAt: Scalars['DateTime']['output'];
  /** The user who submitted the feedback */
  user?: Maybe<User>;
  /** ID of the user who submitted the feedback */
  userId: Scalars['ID']['output'];
};

export type ServiceFeedbackConnection = {
  __typename?: 'ServiceFeedbackConnection';
  edges: Array<ServiceFeedbackEdge>;
  pageInfo: PageInfo;
};

export type ServiceFeedbackEdge = {
  __typename?: 'ServiceFeedbackEdge';
  cursor: Scalars['String']['output'];
  node: ServiceFeedback;
};

export type ServiceFeedbackFilter = {
  serviceId?: InputMaybe<Scalars['ID']['input']>;
  userId?: InputMaybe<Scalars['ID']['input']>;
};

export type ServiceFeedbackSort = {
  field: ServiceFeedbackSortField;
};

export enum ServiceFeedbackSortField {
  CreatedAt = 'CREATED_AT',
  CreatedAtDesc = 'CREATED_AT_DESC',
  Rating = 'RATING',
  RatingDesc = 'RATING_DESC'
}

export type ServiceFilter = {
  businessId?: InputMaybe<Scalars['ID']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  tags?: InputMaybe<Array<Scalars['String']['input']>>;
};

/** The booking form configuration for a service. One-to-one with Service. */
export type ServiceForm = Node & {
  __typename?: 'ServiceForm';
  /** When the record was created */
  createdAt: Scalars['DateTime']['output'];
  /** ID of the user who created this record */
  createdBy: Scalars['ID']['output'];
  /** Globally unique identifier */
  id: Scalars['ID']['output'];
  /** Form configuration payload (JSON) */
  payload: Scalars['JSON']['output'];
  /** The associated service */
  service?: Maybe<Service>;
  /** ID of the associated service */
  serviceId: Scalars['ID']['output'];
  /** When the record was last updated */
  updatedAt: Scalars['DateTime']['output'];
};

export type ServiceFormConnection = {
  __typename?: 'ServiceFormConnection';
  edges: Array<ServiceFormEdge>;
  pageInfo: PageInfo;
};

export type ServiceFormEdge = {
  __typename?: 'ServiceFormEdge';
  cursor: Scalars['String']['output'];
  node: ServiceForm;
};

/** Aggregated metrics for a service (total reviews, average rating). */
export type ServiceMetric = Node & {
  __typename?: 'ServiceMetric';
  /** Average rating (1-5) */
  averageRating: Scalars['Float']['output'];
  /** When the record was created */
  createdAt: Scalars['DateTime']['output'];
  /** Globally unique identifier */
  id: Scalars['ID']['output'];
  /** The associated service */
  service?: Maybe<Service>;
  /** ID of the associated service */
  serviceId: Scalars['ID']['output'];
  /** Total number of reviews */
  totalReviews: Scalars['Int']['output'];
  /** When the record was last updated */
  updatedAt: Scalars['DateTime']['output'];
};

export type ServiceMetricConnection = {
  __typename?: 'ServiceMetricConnection';
  edges: Array<ServiceMetricEdge>;
  pageInfo: PageInfo;
};

export type ServiceMetricEdge = {
  __typename?: 'ServiceMetricEdge';
  cursor: Scalars['String']['output'];
  node: ServiceMetric;
};

/** The landing/content page for a service. One-to-one with Service. */
export type ServicePage = Node & {
  __typename?: 'ServicePage';
  /** When the record was created */
  createdAt: Scalars['DateTime']['output'];
  /** ID of the user who created this record */
  createdBy: Scalars['ID']['output'];
  /** Globally unique identifier */
  id: Scalars['ID']['output'];
  /** Page content payload (JSON) */
  payload: Scalars['JSON']['output'];
  /** The associated service */
  service?: Maybe<Service>;
  /** ID of the associated service */
  serviceId: Scalars['ID']['output'];
  /** When the record was last updated */
  updatedAt: Scalars['DateTime']['output'];
};

export type ServicePageConnection = {
  __typename?: 'ServicePageConnection';
  edges: Array<ServicePageEdge>;
  pageInfo: PageInfo;
};

export type ServicePageEdge = {
  __typename?: 'ServicePageEdge';
  cursor: Scalars['String']['output'];
  node: ServicePage;
};

export type ServiceSort = {
  field: ServiceSortField;
};

export enum ServiceSortField {
  AverageRating = 'AVERAGE_RATING',
  AverageRatingDesc = 'AVERAGE_RATING_DESC',
  CreatedAt = 'CREATED_AT',
  CreatedAtDesc = 'CREATED_AT_DESC',
  Name = 'NAME',
  NameDesc = 'NAME_DESC'
}

/** Sort order for query results. */
export enum SortOrder {
  /** Ascending order */
  Asc = 'ASC',
  /** Descending order */
  Desc = 'DESC'
}

/** A todo item in the system. */
export type Todo = Node & {
  __typename?: 'Todo';
  /** When the todo was created */
  createdAt: Scalars['DateTime']['output'];
  /** ID of the user who created this todo */
  createdBy: Scalars['ID']['output'];
  /** Optional description */
  description?: Maybe<Scalars['String']['output']>;
  /** Optional due date */
  dueDate?: Maybe<Scalars['DateTime']['output']>;
  /** Globally unique identifier */
  id: Scalars['ID']['output'];
  /** Priority level */
  priority: TodoPriority;
  /** Current status */
  status: TodoStatus;
  /** Title of the todo */
  title: Scalars['String']['output'];
  /** When the todo was last updated */
  updatedAt: Scalars['DateTime']['output'];
};

export type TodoConnection = {
  __typename?: 'TodoConnection';
  edges: Array<TodoEdge>;
  pageInfo: PageInfo;
};

export type TodoEdge = {
  __typename?: 'TodoEdge';
  cursor: Scalars['String']['output'];
  node: Todo;
};

export type TodoFilter = {
  createdBy?: InputMaybe<Scalars['ID']['input']>;
  priority?: InputMaybe<TodoPriority>;
  status?: InputMaybe<TodoStatus>;
};

export enum TodoPriority {
  High = 'HIGH',
  Low = 'LOW',
  Medium = 'MEDIUM'
}

export type TodoSort = {
  field: TodoSortField;
};

export enum TodoSortField {
  CreatedAt = 'CREATED_AT',
  CreatedAtDesc = 'CREATED_AT_DESC',
  DueDate = 'DUE_DATE',
  DueDateDesc = 'DUE_DATE_DESC',
  Priority = 'PRIORITY',
  PriorityDesc = 'PRIORITY_DESC',
  Title = 'TITLE',
  TitleDesc = 'TITLE_DESC'
}

export enum TodoStatus {
  Cancelled = 'CANCELLED',
  Completed = 'COMPLETED',
  InProgress = 'IN_PROGRESS',
  Pending = 'PENDING'
}

export type UpdateBillingAddressInput = {
  addressLine1?: InputMaybe<Scalars['String']['input']>;
  addressLine2?: InputMaybe<Scalars['String']['input']>;
  city?: InputMaybe<Scalars['String']['input']>;
  country?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['ID']['input'];
  postalCode?: InputMaybe<Scalars['String']['input']>;
  state?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateBillingAddressPayload = {
  __typename?: 'UpdateBillingAddressPayload';
  billingAddress: BillingAddress;
};

export type UpdateBusinessInput = {
  bannerImageUrl?: InputMaybe<Scalars['String']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['ID']['input'];
  name?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateBusinessPayload = {
  __typename?: 'UpdateBusinessPayload';
  business: Business;
};

export type UpdateEmailInput = {
  email: Scalars['String']['input'];
};

export type UpdateEmailPayload = {
  __typename?: 'UpdateEmailPayload';
  success: Scalars['Boolean']['output'];
};

export type UpdatePasswordInput = {
  currentPassword: Scalars['String']['input'];
  newPassword: Scalars['String']['input'];
};

export type UpdatePasswordPayload = {
  __typename?: 'UpdatePasswordPayload';
  success: Scalars['Boolean']['output'];
};

export type UpdatePhoneNumberInput = {
  newPhoneNumber: Scalars['String']['input'];
};

export type UpdatePhoneNumberPayload = {
  __typename?: 'UpdatePhoneNumberPayload';
  success: Scalars['Boolean']['output'];
};

export type UpdateServiceInput = {
  bannerImageUrl?: InputMaybe<Scalars['String']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['ID']['input'];
  maxPrice?: InputMaybe<Scalars['Float']['input']>;
  minPrice?: InputMaybe<Scalars['Float']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  tags?: InputMaybe<Array<Scalars['String']['input']>>;
};

export type UpdateServicePayload = {
  __typename?: 'UpdateServicePayload';
  service: Service;
};

export type UpdateTodoInput = {
  description?: InputMaybe<Scalars['String']['input']>;
  dueDate?: InputMaybe<Scalars['DateTime']['input']>;
  id: Scalars['ID']['input'];
  priority?: InputMaybe<TodoPriority>;
  status?: InputMaybe<TodoStatus>;
  title?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateTodoPayload = {
  __typename?: 'UpdateTodoPayload';
  todo: Todo;
};

export type UpdateUserInput = {
  bannerImageUrl?: InputMaybe<Scalars['String']['input']>;
  firstName?: InputMaybe<Scalars['String']['input']>;
  isBusinessOwner?: InputMaybe<Scalars['Boolean']['input']>;
  lastName?: InputMaybe<Scalars['String']['input']>;
  middleName?: InputMaybe<Scalars['String']['input']>;
  mobileNumber?: InputMaybe<Scalars['String']['input']>;
  profilePictureUrl?: InputMaybe<Scalars['String']['input']>;
  suffix?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateUserPayload = {
  __typename?: 'UpdateUserPayload';
  user: User;
};

/** Input for updating the authenticated user's notification preferences */
export type UpdateUserPreferenceInput = {
  /**
   * Whitelist of event keys to deliver. An empty list means all events are delivered.
   * e.g. [\"APPOINTMENT_CREATED\", \"APPOINTMENT_PAID\"]
   */
  notificationEnabledList?: InputMaybe<Array<Scalars['String']['input']>>;
  /** Notification method: EMAIL or SMS */
  notificationMethod?: InputMaybe<Scalars['String']['input']>;
  /** Whether notifications are enabled */
  notificationsEnabled?: InputMaybe<Scalars['Boolean']['input']>;
};

export type UpdateUserPreferencePayload = {
  __typename?: 'UpdateUserPreferencePayload';
  userPreference: UserPreference;
};

export type UpsertServiceFormInput = {
  payload: Scalars['JSON']['input'];
  serviceId: Scalars['ID']['input'];
};

export type UpsertServiceFormPayload = {
  __typename?: 'UpsertServiceFormPayload';
  serviceForm: ServiceForm;
};

export type UpsertServicePageInput = {
  payload: Scalars['JSON']['input'];
  serviceId: Scalars['ID']['input'];
};

export type UpsertServicePagePayload = {
  __typename?: 'UpsertServicePagePayload';
  servicePage: ServicePage;
};

/**
 * User profile information.
 * This is the application-level user record — NOT the Keycloak identity.
 */
export type User = Node & {
  __typename?: 'User';
  /** URL to the user's profile banner */
  bannerImageUrl?: Maybe<Scalars['String']['output']>;
  /** User's billing address */
  billingAddress?: Maybe<BillingAddress>;
  /** Businesses owned by this user */
  businesses?: Maybe<BusinessConnection>;
  /** When the record was created */
  createdAt: Scalars['DateTime']['output'];
  /** User's first name */
  firstName: Scalars['String']['output'];
  /** Globally unique identifier */
  id: Scalars['ID']['output'];
  /** Whether this user is a business owner */
  isBusinessOwner: Scalars['Boolean']['output'];
  /** User's last name */
  lastName: Scalars['String']['output'];
  /** User's middle name */
  middleName?: Maybe<Scalars['String']['output']>;
  /** Mobile number in format +<countryCode> <number> (e.g. +63 9380542839) */
  mobileNumber?: Maybe<Scalars['String']['output']>;
  /** Notifications for this user */
  notifications?: Maybe<NotificationConnection>;
  /** Payments made by this user */
  payments?: Maybe<PaymentConnection>;
  /** URL to the user's profile picture */
  profilePictureUrl?: Maybe<Scalars['String']['output']>;
  /** Service appointments by this user */
  serviceAppointments?: Maybe<ServiceAppointmentConnection>;
  /** Service feedbacks by this user */
  serviceFeedbacks?: Maybe<ServiceFeedbackConnection>;
  /** Suffix (e.g. Jr., III) */
  suffix?: Maybe<Scalars['String']['output']>;
  /** When the record was last updated */
  updatedAt: Scalars['DateTime']['output'];
  /** User's notification preferences */
  userPreference?: Maybe<UserPreference>;
};


/**
 * User profile information.
 * This is the application-level user record — NOT the Keycloak identity.
 */
export type UserBusinessesArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  first: Scalars['Int']['input'];
};


/**
 * User profile information.
 * This is the application-level user record — NOT the Keycloak identity.
 */
export type UserNotificationsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  first: Scalars['Int']['input'];
};


/**
 * User profile information.
 * This is the application-level user record — NOT the Keycloak identity.
 */
export type UserPaymentsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  first: Scalars['Int']['input'];
};


/**
 * User profile information.
 * This is the application-level user record — NOT the Keycloak identity.
 */
export type UserServiceAppointmentsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  first: Scalars['Int']['input'];
};


/**
 * User profile information.
 * This is the application-level user record — NOT the Keycloak identity.
 */
export type UserServiceFeedbacksArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  first: Scalars['Int']['input'];
};

export type UserConnection = {
  __typename?: 'UserConnection';
  edges: Array<UserEdge>;
  pageInfo: PageInfo;
};

export type UserEdge = {
  __typename?: 'UserEdge';
  cursor: Scalars['String']['output'];
  node: User;
};

export type UserFilter = {
  firstName?: InputMaybe<Scalars['String']['input']>;
  lastName?: InputMaybe<Scalars['String']['input']>;
};

/**
 * User notification preferences.
 * Configured during onboarding, determines how the user receives notifications.
 */
export type UserPreference = Node & {
  __typename?: 'UserPreference';
  /** When the record was created */
  createdAt: Scalars['DateTime']['output'];
  /** ID of the user who created this record */
  createdBy: Scalars['ID']['output'];
  /** Globally unique identifier */
  id: Scalars['ID']['output'];
  /**
   * Whitelist of event keys to deliver (e.g. [\"APPOINTMENT_CREATED\", \"APPOINTMENT_PAID\"]).
   * An empty list means all events are delivered.
   */
  notificationEnabledList: Array<Scalars['String']['output']>;
  /** Notification method: EMAIL or SMS */
  notificationMethod: Scalars['String']['output'];
  /** Whether notifications are enabled */
  notificationsEnabled: Scalars['Boolean']['output'];
  /** When the record was last updated */
  updatedAt: Scalars['DateTime']['output'];
  /** ID of the user who owns this preference */
  userId: Scalars['ID']['output'];
};

export type UserPreferenceConnection = {
  __typename?: 'UserPreferenceConnection';
  edges: Array<UserPreferenceEdge>;
  pageInfo: PageInfo;
};

export type UserPreferenceEdge = {
  __typename?: 'UserPreferenceEdge';
  cursor: Scalars['String']['output'];
  node: UserPreference;
};

export type UserPreferenceFilter = {
  /** Filter by owning user ID */
  userId?: InputMaybe<Scalars['ID']['input']>;
};

export type UserPreferenceSort = {
  field: UserPreferenceSortField;
};

export enum UserPreferenceSortField {
  CreatedAt = 'CREATED_AT',
  CreatedAtDesc = 'CREATED_AT_DESC'
}

export type UserSort = {
  field: UserSortField;
};

export enum UserSortField {
  CreatedAt = 'CREATED_AT',
  CreatedAtDesc = 'CREATED_AT_DESC',
  FirstName = 'FIRST_NAME',
  FirstNameDesc = 'FIRST_NAME_DESC',
  LastName = 'LAST_NAME',
  LastNameDesc = 'LAST_NAME_DESC'
}
