// ============================================================
// Zendo — GraphQL Queries
// All read operations against the Zendo API
// ============================================================

// ── User ──────────────────────────────────────────────────────

export const GET_USER = /* GraphQL */ `
  query GetUser($id: ID!) {
    user(id: $id) {
      id
      firstName
      middleName
      lastName
      suffix
      mobileNumber
      isBusinessOwner
      profilePictureUrl
      bannerImageUrl
      createdAt
      updatedAt
    }
  }
`;

export const GET_USERS = /* GraphQL */ `
  query GetUsers($first: Int!, $after: String, $search: String, $filter: UserFilter, $sort: UserSort) {
    users(first: $first, after: $after, search: $search, filter: $filter, sort: $sort) {
      edges {
        node {
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
        cursor
      }
      pageInfo {
        endCursor
        hasNextPage
      }
    }
  }
`;

// ── Billing Address ───────────────────────────────────────────

export const GET_BILLING_ADDRESS = /* GraphQL */ `
  query GetBillingAddress($id: ID!) {
    billingAddress(id: $id) {
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
`;

export const GET_BILLING_ADDRESSES = /* GraphQL */ `
  query GetBillingAddresses($first: Int!, $after: String, $filter: BillingAddressFilter, $sort: BillingAddressSort) {
    billingAddresses(first: $first, after: $after, filter: $filter, sort: $sort) {
      edges {
        node {
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
        cursor
      }
      pageInfo {
        endCursor
        hasNextPage
      }
    }
  }
`;

// ── Business ──────────────────────────────────────────────────

export const GET_BUSINESS = /* GraphQL */ `
  query GetBusiness($id: ID!) {
    business(id: $id) {
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
`;

export const GET_BUSINESSES = /* GraphQL */ `
  query GetBusinesses($first: Int!, $after: String, $search: String, $filter: BusinessFilter, $sort: BusinessSort) {
    businesses(first: $first, after: $after, search: $search, filter: $filter, sort: $sort) {
      edges {
        node {
          id
          userId
          name
          description
          bannerImageUrl
          createdBy
          createdAt
          updatedAt
        }
        cursor
      }
      pageInfo {
        endCursor
        hasNextPage
      }
    }
  }
`;

// ── Business Metric ───────────────────────────────────────────

export const GET_BUSINESS_METRIC = /* GraphQL */ `
  query GetBusinessMetricByBusiness($businessId: ID!) {
    businessMetricByBusiness(businessId: $businessId) {
      id
      businessId
      totalReviews
      averageRating
      createdAt
      updatedAt
    }
  }
`;

// ── Service ───────────────────────────────────────────────────

export const GET_SERVICE = /* GraphQL */ `
  query GetService($id: ID!) {
    service(id: $id) {
      id
      businessId
      name
      description
      bannerImageUrl
      minPrice
      maxPrice
      createdBy
      createdAt
      updatedAt
    }
  }
`;

export const GET_SERVICES = /* GraphQL */ `
  query GetServices($first: Int!, $after: String, $search: String, $filter: ServiceFilter, $sort: ServiceSort) {
    services(first: $first, after: $after, search: $search, filter: $filter, sort: $sort) {
      edges {
        node {
          id
          businessId
          name
          description
          bannerImageUrl
          minPrice
          maxPrice
          createdBy
          createdAt
          updatedAt
        }
        cursor
      }
      pageInfo {
        endCursor
        hasNextPage
      }
    }
  }
`;

// ── Service Metric ────────────────────────────────────────────

export const GET_SERVICE_METRIC = /* GraphQL */ `
  query GetServiceMetricByService($serviceId: ID!) {
    serviceMetricByService(serviceId: $serviceId) {
      id
      serviceId
      totalReviews
      averageRating
      createdAt
      updatedAt
    }
  }
`;

// ── Service Page (Blog) ───────────────────────────────────────

export const GET_SERVICE_PAGE = /* GraphQL */ `
  query GetServicePageByService($serviceId: ID!) {
    servicePageByService(serviceId: $serviceId) {
      id
      serviceId
      payload
      createdBy
      createdAt
      updatedAt
    }
  }
`;

// ── Service Form ──────────────────────────────────────────────

export const GET_SERVICE_FORM = /* GraphQL */ `
  query GetServiceFormByService($serviceId: ID!) {
    serviceFormByService(serviceId: $serviceId) {
      id
      serviceId
      payload
      createdBy
      createdAt
      updatedAt
    }
  }
`;

// ── Service Appointment ───────────────────────────────────────

export const GET_SERVICE_APPOINTMENTS = /* GraphQL */ `
  query GetServiceAppointments($first: Int!, $after: String, $filter: ServiceAppointmentFilter, $sort: ServiceAppointmentSort) {
    serviceAppointments(first: $first, after: $after, filter: $filter, sort: $sort) {
      edges {
        node {
          id
          userId
          serviceId
          amount
          currency
          payload
          paidAt
          canceledAt
          approvedAt
          rejectedAt
          completedAt
          completedProofUrl
          createdBy
          createdAt
          updatedAt
        }
        cursor
      }
      pageInfo {
        endCursor
        hasNextPage
      }
    }
  }
`;

// ── Service Feedback ──────────────────────────────────────────

export const GET_SERVICE_FEEDBACKS = /* GraphQL */ `
  query GetServiceFeedbacks($first: Int!, $after: String, $filter: ServiceFeedbackFilter, $sort: ServiceFeedbackSort) {
    serviceFeedbacks(first: $first, after: $after, filter: $filter, sort: $sort) {
      edges {
        node {
          id
          userId
          serviceId
          rating
          payload
          createdBy
          createdAt
          updatedAt
        }
        cursor
      }
      pageInfo {
        endCursor
        hasNextPage
      }
    }
  }
`;

// ── Service Tags ──────────────────────────────────────────────

export const GET_SERVICE_TAGS_BY_SERVICE = /* GraphQL */ `
  query GetServiceTagsByService($serviceId: ID!) {
    serviceTagsByService(serviceId: $serviceId) {
      id
      serviceId
      tagId
      tag {
        id
        name
      }
      createdBy
      createdAt
      updatedAt
    }
  }
`;

// ── Service Availability ─────────────────────────────────────

export const GET_SERVICE_AVAILABILITIES = /* GraphQL */ `
  query GetServiceAvailabilities($serviceId: ID!, $includeAll: Boolean) {
    serviceAvailabilities(serviceId: $serviceId, includeAll: $includeAll) {
      id
      serviceId
      businessId
      scheduledAt
      durationMinutes
      maxBookings
      bookedCount
      isFull
      createdAt
      updatedAt
    }
  }
`;

export const GET_BUSINESS_AVAILABILITIES = /* GraphQL */ `
  query GetBusinessAvailabilities($businessId: ID!, $includeAll: Boolean) {
    businessAvailabilities(businessId: $businessId, includeAll: $includeAll) {
      id
      serviceId
      businessId
      scheduledAt
      durationMinutes
      maxBookings
      bookedCount
      isFull
      createdAt
      updatedAt
    }
  }
`;

// ── Tags ──────────────────────────────────────────────────────

export const GET_TAGS = /* GraphQL */ `
  query GetTags($first: Int!, $after: String, $search: String, $filter: TagFilter, $sort: TagSort) {
    tags(first: $first, after: $after, search: $search, filter: $filter, sort: $sort) {
      edges {
        node {
          id
          name
          description
          createdAt
          updatedAt
        }
        cursor
      }
      pageInfo {
        endCursor
        hasNextPage
      }
    }
  }
`;

// ── Notification ──────────────────────────────────────────────

export const GET_NOTIFICATIONS = /* GraphQL */ `
  query GetNotifications($first: Int!, $after: String, $filter: NotificationFilter, $sort: NotificationSort) {
    notifications(first: $first, after: $after, filter: $filter, sort: $sort) {
      edges {
        node {
          id
          userId
          provider
          payload
          deliveredAt
          deliveryAttemptCount
          createdAt
          updatedAt
        }
        cursor
      }
      pageInfo {
        endCursor
        hasNextPage
      }
    }
  }
`;

// ── Payment ───────────────────────────────────────────────────

export const GET_PAYMENTS = /* GraphQL */ `
  query GetPayments($first: Int!, $after: String, $filter: PaymentFilter, $sort: PaymentSort) {
    payments(first: $first, after: $after, filter: $filter, sort: $sort) {
      edges {
        node {
          id
          userId
          businessId
          serviceAppointmentsId
          providerPaymentId
          provider
          amount
          currency
          method
          paidAt
          refundedAt
          createdBy
          createdAt
          updatedAt
        }
        cursor
      }
      pageInfo {
        endCursor
        hasNextPage
      }
    }
  }
`;

// ── Payment Link ──────────────────────────────────────────────

export const GET_PAYMENT_LINKS = /* GraphQL */ `
  query GetPaymentLinks($first: Int!, $after: String, $filter: PaymentLinkFilter, $sort: PaymentLinkSort) {
    paymentLinks(first: $first, after: $after, filter: $filter, sort: $sort) {
      edges {
        node {
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
        cursor
      }
      pageInfo {
        endCursor
        hasNextPage
      }
    }
  }
`;

// ── Sales Invoice ─────────────────────────────────────────────

export const GET_SALES_INVOICES = /* GraphQL */ `
  query GetSalesInvoices($first: Int!, $after: String, $filter: SalesInvoiceFilter, $sort: SalesInvoiceSort) {
    salesInvoices(first: $first, after: $after, filter: $filter, sort: $sort) {
      edges {
        node {
          id
          paymentId
          requestedAt
          requestedBy
          resolvedAt
          resolvedBy
          attachmentUrl
          createdBy
          createdAt
          updatedAt
        }
        cursor
      }
      pageInfo {
        endCursor
        hasNextPage
      }
    }
  }
`;

// ── Payout Statement ──────────────────────────────────────────

export const GET_PAYOUT_STATEMENTS = /* GraphQL */ `
  query GetPayoutStatements($first: Int!, $after: String, $filter: PayoutStatementFilter, $sort: PayoutStatementSort) {
    payoutStatements(first: $first, after: $after, filter: $filter, sort: $sort) {
      edges {
        node {
          id
          businessId
          periodStart
          periodEnd
          grossCollection
          totalFees
          withholdingTax
          netPayout
          createdBy
          createdAt
          updatedAt
        }
        cursor
      }
      pageInfo {
        endCursor
        hasNextPage
      }
    }
  }
`;

// ── Service Billing ───────────────────────────────────────────

export const GET_SERVICE_BILLINGS = /* GraphQL */ `
  query GetServiceBillings($first: Int!, $after: String, $filter: ServiceBillingFilter, $sort: ServiceBillingSort) {
    serviceBillings(first: $first, after: $after, filter: $filter, sort: $sort) {
      edges {
        node {
          id
          payoutStatementId
          payload
          createdAt
          updatedAt
        }
        cursor
      }
      pageInfo {
        endCursor
        hasNextPage
      }
    }
  }
`;

// ── Business Feedback ─────────────────────────────────────────

export const GET_BUSINESS_FEEDBACKS = /* GraphQL */ `
  query GetBusinessFeedbacks($first: Int!, $after: String, $filter: BusinessFeedbackFilter, $sort: BusinessFeedbackSort) {
    businessFeedbacks(first: $first, after: $after, filter: $filter, sort: $sort) {
      edges {
        node {
          id
          userId
          businessId
          rating
          payload
          createdBy
          createdAt
          updatedAt
        }
        cursor
      }
      pageInfo {
        endCursor
        hasNextPage
      }
    }
  }
`;
