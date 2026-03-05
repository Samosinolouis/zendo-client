// ============================================================
// Zendo — Onboarding GraphQL Operations
// ============================================================

// --------------- Queries ---------------

/** Check if the current user already has a profile */
export const GET_CURRENT_USER = /* GraphQL */ `
  query GetCurrentUser($id: ID!) {
    user(id: $id) {
      id
      firstName
      lastName
      middleName
      suffix
      profilePictureUrl
      createdAt
      updatedAt
    }
  }
`;

/** Check if the user already has a billing address */
export const GET_BILLING_ADDRESSES = /* GraphQL */ `
  query GetBillingAddresses($first: Int!, $filter: BillingAddressFilter) {
    billingAddresses(first: $first, filter: $filter) {
      edges {
        node {
          id
          userId
          addressLine1
          country
        }
      }
    }
  }
`;

/** Check if the user already owns a business */
export const GET_BUSINESSES = /* GraphQL */ `
  query GetBusinesses($first: Int!, $filter: BusinessFilter) {
    businesses(first: $first, filter: $filter) {
      edges {
        node {
          id
          userId
          name
        }
      }
    }
  }
`;

// --------------- Mutations ---------------

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
      userPreference {
        id
        userId
        notificationsEnabled
        notificationMethod
        createdAt
        updatedAt
      }
    }
  }
`;
