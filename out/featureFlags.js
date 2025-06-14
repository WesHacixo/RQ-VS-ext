"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isFeatureEnabled = exports.getFeatureFlags = exports.setFeatureFlags = exports.defaultFeatureFlags = void 0;
exports.defaultFeatureFlags = {
    enableAdvancedTaskTypes: false,
    enableTaskDuplication: false,
    enablePriorityBoosting: false
};
let currentFeatureFlags = { ...exports.defaultFeatureFlags };
const setFeatureFlags = (flags) => {
    currentFeatureFlags = {
        ...currentFeatureFlags,
        ...flags
    };
};
exports.setFeatureFlags = setFeatureFlags;
const getFeatureFlags = () => {
    return { ...currentFeatureFlags };
};
exports.getFeatureFlags = getFeatureFlags;
const isFeatureEnabled = (feature) => {
    return currentFeatureFlags[feature];
};
exports.isFeatureEnabled = isFeatureEnabled;
//# sourceMappingURL=featureFlags.js.map