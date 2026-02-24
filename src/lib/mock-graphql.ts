// ============================================================
// Zendo — Mock GraphQL Operation Definitions
// These mirror the shapes that will be used with a real
// GraphQL client (e.g. Apollo / urql) once the backend exists.
// ============================================================

// ── Query Definitions (documentation only — no runtime GQL) ─

export const QUERIES = {
  GET_BUSINESSES: `
    query GetBusinesses {
      businesses {
        id
        userId
        name
        description
        bannerUrl
      }
    }
  `,

  GET_BUSINESS_BY_ID: `
    query GetBusinessById($id: ID!) {
      business(id: $id) {
        id
        userId
        name
        description
        bannerUrl
        services {
          id
          name
          description
          bannerUrl
        }
      }
    }
  `,

  GET_SERVICES_BY_BUSINESS: `
    query GetServicesByBusiness($businessId: ID!) {
      services(businessId: $businessId) {
        id
        businessId
        name
        description
        bannerUrl
      }
    }
  `,

  GET_SERVICE_BY_ID: `
    query GetServiceById($id: ID!) {
      service(id: $id) {
        id
        businessId
        name
        description
        bannerUrl
        fields {
          id
          type
          name
          description
          options {
            id
            name
            description
            amount
            currency
          }
        }
      }
    }
  `,

  GET_USER_APPOINTMENTS: `
    query GetUserAppointments($userId: ID!) {
      appointments(userId: $userId) {
        id
        serviceId
        amount
        currency
        status
        scheduledAt
        payload
      }
    }
  `,

  GET_USER_NOTIFICATIONS: `
    query GetUserNotifications($userId: ID!) {
      notifications(userId: $userId) {
        id
        type
        payload
        createdAt
        read
      }
    }
  `,

  GET_USER_PAYMENTS: `
    query GetUserPayments($userId: ID!) {
      payments(userId: $userId) {
        id
        amount
        currency
        method
        provider
        paidAt
        refundedAt
      }
    }
  `,

  GET_PAYOUT_STATEMENTS: `
    query GetPayoutStatements($businessId: ID!) {
      payoutStatements(businessId: $businessId) {
        id
        periodStart
        periodEnd
        grossCollection
        totalFees
        withholdingTax
        netPayout
      }
    }
  `,

  GET_SERVICE_FEEDBACKS: `
    query GetServiceFeedbacks($serviceId: ID!) {
      serviceFeedbacks(serviceId: $serviceId) {
        id
        userId
        title
        richText
        rating
        createdAt
      }
    }
  `,
};

export const MUTATIONS = {
  CREATE_APPOINTMENT: `
    mutation CreateAppointment($input: CreateAppointmentInput!) {
      createAppointment(input: $input) {
        id
        serviceId
        amount
        currency
        status
        scheduledAt
      }
    }
  `,

  CANCEL_APPOINTMENT: `
    mutation CancelAppointment($id: ID!) {
      cancelAppointment(id: $id) {
        id
        status
      }
    }
  `,

  CREATE_BUSINESS: `
    mutation CreateBusiness($input: CreateBusinessInput!) {
      createBusiness(input: $input) {
        id
        name
        description
      }
    }
  `,

  CREATE_SERVICE: `
    mutation CreateService($input: CreateServiceInput!) {
      createService(input: $input) {
        id
        name
        description
      }
    }
  `,

  UPDATE_SERVICE: `
    mutation UpdateService($id: ID!, $input: UpdateServiceInput!) {
      updateService(id: $id, input: $input) {
        id
        name
        description
      }
    }
  `,

  MARK_NOTIFICATION_READ: `
    mutation MarkNotificationRead($id: ID!) {
      markNotificationRead(id: $id) {
        id
        read
      }
    }
  `,

  CREATE_PAYMENT_LINK: `
    mutation CreatePaymentLink($serviceAppointmentId: ID!) {
      createPaymentLink(serviceAppointmentId: $serviceAppointmentId) {
        id
        redirectUrl
        provider
      }
    }
  `,

  SUBMIT_FEEDBACK: `
    mutation SubmitFeedback($input: SubmitFeedbackInput!) {
      submitFeedback(input: $input) {
        id
        title
        richText
        rating
      }
    }
  `,
};
