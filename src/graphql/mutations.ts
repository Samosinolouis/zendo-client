// ============================================================
// Zendo — GraphQL Mutations
// All write operations against the Zendo API
// ============================================================

// ── User ──────────────────────────────────────────────────────

export const UPDATE_USER = /* GraphQL */ `
  mutation UpdateUser($input: UpdateUserInput!) {
    updateUser(input: $input) {
      user {
        id
        firstName
        middleName
        lastName
        suffix
        profilePictureUrl
        bannerImageUrl
        createdAt
        updatedAt
      }
    }
  }
`;

export const UPDATE_EMAIL = /* GraphQL */ `
  mutation UpdateEmail($input: UpdateEmailInput!) {
    updateEmail(input: $input) {
      success
    }
  }
`;

export const UPDATE_PHONE_NUMBER = /* GraphQL */ `
  mutation UpdatePhoneNumber($input: UpdatePhoneNumberInput!) {
    updatePhoneNumber(input: $input) {
      success
    }
  }
`;

export const UPDATE_PASSWORD = /* GraphQL */ `
  mutation UpdatePassword($input: UpdatePasswordInput!) {
    updatePassword(input: $input) {
      success
    }
  }
`;

export const PROCESS_ONBOARDING = /* GraphQL */ `
  mutation ProcessOnboarding($input: ProcessOnboardingInput!) {
    processOnboarding(input: $input) {
      user {
        id
        firstName
        middleName
        lastName
        suffix
        profilePictureUrl
        createdAt
        updatedAt
      }
      billingAddress {
        id
        userId
        addressLine1
        addressLine2
        city
        state
        postalCode
        country
        createdBy
        createdAt
        updatedAt
      }
      business {
        id
        userId
        name
        description
        bannerImageUrl
        createdBy
        createdAt
        updatedAt
      }
    }
  }
`;

// ── Billing Address ───────────────────────────────────────────

export const UPDATE_BILLING_ADDRESS = /* GraphQL */ `
  mutation UpdateBillingAddress($input: UpdateBillingAddressInput!) {
    updateBillingAddress(input: $input) {
      billingAddress {
        id
        userId
        addressLine1
        addressLine2
        city
        state
        postalCode
        country
        createdBy
        createdAt
        updatedAt
      }
    }
  }
`;

// ── Business ──────────────────────────────────────────────────

export const CREATE_BUSINESS = /* GraphQL */ `
  mutation CreateBusiness($input: CreateBusinessInput!) {
    createBusiness(input: $input) {
      business {
        id
        userId
        name
        description
        bannerImageUrl
        createdBy
        createdAt
        updatedAt
      }
    }
  }
`;

export const UPDATE_BUSINESS = /* GraphQL */ `
  mutation UpdateBusiness($input: UpdateBusinessInput!) {
    updateBusiness(input: $input) {
      business {
        id
        userId
        name
        description
        bannerImageUrl
        createdBy
        createdAt
        updatedAt
      }
    }
  }
`;

export const DELETE_BUSINESS = /* GraphQL */ `
  mutation DeleteBusiness($input: DeleteBusinessInput!) {
    deleteBusiness(input: $input) {
      success
      deletedId
    }
  }
`;

// ── Service ───────────────────────────────────────────────────

export const CREATE_SERVICE = /* GraphQL */ `
  mutation CreateService($input: CreateServiceInput!) {
    createService(input: $input) {
      service {
        id
        businessId
        name
        description
        bannerImageUrl
        price
        createdBy
        createdAt
        updatedAt
      }
    }
  }
`;

export const UPDATE_SERVICE = /* GraphQL */ `
  mutation UpdateService($input: UpdateServiceInput!) {
    updateService(input: $input) {
      service {
        id
        businessId
        name
        description
        bannerImageUrl
        price
        createdBy
        createdAt
        updatedAt
      }
    }
  }
`;

export const DELETE_SERVICE = /* GraphQL */ `
  mutation DeleteService($input: DeleteServiceInput!) {
    deleteService(input: $input) {
      success
      deletedId
    }
  }
`;

// ── Service Appointment ───────────────────────────────────────

export const CREATE_SERVICE_APPOINTMENT = /* GraphQL */ `
  mutation CreateServiceAppointment($input: CreateServiceAppointmentInput!) {
    createServiceAppointment(input: $input) {
      serviceAppointment {
        id
        userId
        serviceId
        amount
        currency
        payload
        createdBy
        createdAt
        updatedAt
      }
    }
  }
`;

// ── Service Feedback ──────────────────────────────────────────

export const CREATE_SERVICE_FEEDBACK = /* GraphQL */ `
  mutation CreateServiceFeedback($input: CreateServiceFeedbackInput!) {
    createServiceFeedback(input: $input) {
      serviceFeedback {
        id
        userId
        serviceId
        rating
        payload
        createdBy
        createdAt
        updatedAt
      }
    }
  }
`;

// ── Service Form ──────────────────────────────────────────────

export const UPSERT_SERVICE_FORM = /* GraphQL */ `
  mutation UpsertServiceForm($input: UpsertServiceFormInput!) {
    upsertServiceForm(input: $input) {
      serviceForm {
        id
        serviceId
        payload
        createdBy
        createdAt
        updatedAt
      }
    }
  }
`;

export const DELETE_SERVICE_FORM = /* GraphQL */ `
  mutation DeleteServiceForm($input: DeleteServiceFormInput!) {
    deleteServiceForm(input: $input) {
      success
    }
  }
`;

// ── Service Page (Blog) ───────────────────────────────────────

export const UPSERT_SERVICE_PAGE = /* GraphQL */ `
  mutation UpsertServicePage($input: UpsertServicePageInput!) {
    upsertServicePage(input: $input) {
      servicePage {
        id
        serviceId
        payload
        createdBy
        createdAt
        updatedAt
      }
    }
  }
`;

export const DELETE_SERVICE_PAGE = /* GraphQL */ `
  mutation DeleteServicePage($input: DeleteServicePageInput!) {
    deleteServicePage(input: $input) {
      success
    }
  }
`;

// ── Service Tag ───────────────────────────────────────────────

export const ADD_SERVICE_TAG = /* GraphQL */ `
  mutation AddServiceTag($input: AddServiceTagInput!) {
    addServiceTag(input: $input) {
      serviceTag {
        id
        serviceId
        tagId
        createdBy
        createdAt
        updatedAt
      }
    }
  }
`;

export const REMOVE_SERVICE_TAG = /* GraphQL */ `
  mutation RemoveServiceTag($input: RemoveServiceTagInput!) {
    removeServiceTag(input: $input) {
      success
    }
  }
`;

// ── Payment Link ──────────────────────────────────────────────

export const CREATE_PAYMENT_LINK = /* GraphQL */ `
  mutation CreatePaymentLink($input: CreatePaymentLinkInput!) {
    createPaymentLink(input: $input) {
      paymentLink {
        id
        serviceAppointmentsId
        providerPaymentLinkId
        provider
        redirectUrl
        expiredAt
        paidAt
        canceledAt
        failedAt
        createdBy
        createdAt
        updatedAt
      }
    }
  }
`;

export const CANCEL_PAYMENT_LINK = /* GraphQL */ `
  mutation CancelPaymentLink($input: CancelPaymentLinkInput!) {
    cancelPaymentLink(input: $input) {
      paymentLink {
        id
        canceledAt
      }
    }
  }
`;

// ── Sales Invoice ─────────────────────────────────────────────

export const REQUEST_SALES_INVOICE = /* GraphQL */ `
  mutation RequestSalesInvoice($input: RequestSalesInvoiceInput!) {
    requestSalesInvoice(input: $input) {
      salesInvoice {
        id
        paymentId
        requestedAt
        requestedBy
        attachmentUrl
        createdAt
        updatedAt
      }
    }
  }
`;

// ── Business Feedback ─────────────────────────────────────────

export const CREATE_BUSINESS_FEEDBACK = /* GraphQL */ `
  mutation CreateBusinessFeedback($input: CreateBusinessFeedbackInput!) {
    createBusinessFeedback(input: $input) {
      businessFeedback {
        id
        userId
        businessId
        rating
        payload
        createdBy
        createdAt
        updatedAt
      }
    }
  }
`;

// ── Tag ───────────────────────────────────────────────────────

export const CREATE_TAG = /* GraphQL */ `
  mutation CreateTag($input: CreateTagInput!) {
    createTag(input: $input) {
      tag {
        id
        name
        description
        createdAt
        updatedAt
      }
    }
  }
`;
