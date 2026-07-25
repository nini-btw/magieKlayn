/**
 * Feature flag configuration
 * @module domain/config/features
 */

/**
 * Feature flags for optional features
 * Each feature can be disabled via environment variables
 */
export const features = {
  /**
   * Weekly drop countdown and scheduling
   */
  weeklyDrop: process.env.NEXT_PUBLIC_FEATURE_WEEKLY_DROP !== "false",

  /**
   * Community vote feature
   */
  vote: process.env.NEXT_PUBLIC_FEATURE_VOTE !== "false",

  /**
   * Custom box builder
   */
  customBuilder: process.env.NEXT_PUBLIC_FEATURE_CUSTOM_BUILDER !== "false",

  /**
   * Admin analytics dashboard
   */
  analytics: process.env.NEXT_PUBLIC_FEATURE_ANALYTICS !== "false",
} as const;

/**
 * Type for feature names
 */
export type FeatureName = keyof typeof features;

/**
 * Check if a feature is enabled
 */
export function isFeatureEnabled(feature: FeatureName): boolean {
  return features[feature];
}
