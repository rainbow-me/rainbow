export const PerformanceTags = {
  lodash: 'lodash',
} as const;

export type PerformanceTagsType = (typeof PerformanceTags)[keyof typeof PerformanceTags];
