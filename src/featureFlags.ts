export interface FeatureFlags {
  enableAdvancedTaskTypes: boolean;
  enableTaskDuplication: boolean;
  enablePriorityBoosting: boolean;
}

export const defaultFeatureFlags: FeatureFlags = {
  enableAdvancedTaskTypes: false,
  enableTaskDuplication: false,
  enablePriorityBoosting: false
};

let currentFeatureFlags: FeatureFlags = { ...defaultFeatureFlags };

export const setFeatureFlags = (flags: Partial<FeatureFlags>) => {
  currentFeatureFlags = {
    ...currentFeatureFlags,
    ...flags
  };
};

export const getFeatureFlags = (): FeatureFlags => {
  return { ...currentFeatureFlags };
};

export const isFeatureEnabled = (feature: keyof FeatureFlags): boolean => {
  return currentFeatureFlags[feature];
};
