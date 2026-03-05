// ============================================================
// Zendo — Landing Page GraphQL Operations
// ============================================================

export const GET_FEATURED_BUSINESSES = /* GraphQL */ `
  query GetFeaturedBusinesses($first: Int!, $sort: BusinessSort) {
    businesses(first: $first, sort: $sort) {
      edges {
        node {
          id
          name
          description
          bannerImageUrl
          userId
          metrics {
            averageRating
            totalReviews
            totalServices
          }
        }
      }
    }
  }
`;

export const GET_FEATURED_FEEDBACKS = /* GraphQL */ `
  query GetFeaturedFeedbacks($first: Int!, $sort: ServiceFeedbackSort) {
    serviceFeedbacks(first: $first, sort: $sort) {
      edges {
        node {
          id
          rating
          payload
          serviceId
          createdAt
          user {
            id
            firstName
            lastName
            profilePictureUrl
          }
        }
      }
    }
  }
`;
