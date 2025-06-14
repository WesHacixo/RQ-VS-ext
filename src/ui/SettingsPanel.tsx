import React from 'react';

interface SettingsPanelProps {
  loopInterval: number;
  looping: boolean;
  debugMode: boolean;
  onLoopIntervalChange: (value: number) => void;
  onLoopingChange: (value: boolean) => void;
  onDebugModeChange: (value: boolean) => void;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({
  loopInterval,
  looping,
  debugMode,
  onLoopIntervalChange,
  onLoopingChange,
  onDebugModeChange
}) => {
  return (
    <div className="settings-panel">
      <h3>Settings</h3>
      <div className="setting-item">
        <label>
          Loop Interval (ms):
          <input
            type="number"
            value={loopInterval}
            onChange={(e) => onLoopIntervalChange(Number(e.target.value))}
            min={1000}
            max={30000}
            step={1000}
          />
        </label>
      </div>
      <div className="setting-item">
        <label>
          <input
            type="checkbox"
            checked={looping}
            onChange={(e) => onLoopingChange(e.target.checked)}
          />
          Enable Looping
        </label>
      </div>
      <div className="setting-item">
        <label>
          <input
            type="checkbox"
            checked={debugMode}
            onChange={(e) => onDebugModeChange(e.target.checked)}
          />
          Debug Mode
        </label>
      </div>
    </div>
  );
};

export default SettingsPanel;
