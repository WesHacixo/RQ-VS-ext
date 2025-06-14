"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const SettingsPanel = ({ loopInterval, looping, debugMode, onLoopIntervalChange, onLoopingChange, onDebugModeChange }) => {
    return ((0, jsx_runtime_1.jsxs)("div", { className: "settings-panel", children: [(0, jsx_runtime_1.jsx)("h3", { children: "Settings" }), (0, jsx_runtime_1.jsx)("div", { className: "setting-item", children: (0, jsx_runtime_1.jsxs)("label", { children: ["Loop Interval (ms):", (0, jsx_runtime_1.jsx)("input", { type: "number", value: loopInterval, onChange: (e) => onLoopIntervalChange(Number(e.target.value)), min: 1000, max: 30000, step: 1000 })] }) }), (0, jsx_runtime_1.jsx)("div", { className: "setting-item", children: (0, jsx_runtime_1.jsxs)("label", { children: [(0, jsx_runtime_1.jsx)("input", { type: "checkbox", checked: looping, onChange: (e) => onLoopingChange(e.target.checked) }), "Enable Looping"] }) }), (0, jsx_runtime_1.jsx)("div", { className: "setting-item", children: (0, jsx_runtime_1.jsxs)("label", { children: [(0, jsx_runtime_1.jsx)("input", { type: "checkbox", checked: debugMode, onChange: (e) => onDebugModeChange(e.target.checked) }), "Debug Mode"] }) })] }));
};
exports.default = SettingsPanel;
//# sourceMappingURL=SettingsPanel.js.map