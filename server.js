const express = require('express');
const { execSync, exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const app = express();
app.use(express.static(__dirname));
const PORT = 3131;
const STATE_FILE = path.join(__dirname, 'state.json');

// Settings we manage (used for backup/restore)
const MANAGED_SETTINGS = [
  'monitor-timeout-ac',
  'monitor-timeout-dc',
  'standby-timeout-ac',
  'standby-timeout-dc',
  'hibernate-timeout-ac',
  'hibernate-timeout-dc'
];

// Read current state
function getState() {
  try {
    return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
  } catch {
    return { mode: 'normal', since: new Date().toISOString() };
  }
}

// Save state
function saveState(mode, originalSettings = null) {
  const payload = {
    mode,
    since: new Date().toISOString()
  };
  if (originalSettings) {
    payload.originalSettings = originalSettings;
  }
  fs.writeFileSync(STATE_FILE, JSON.stringify(payload, null, 2));
}

// Read a single power setting value (returns string or null)
function getPowerSetting(name) {
  try {
    const out = execSync(`powercfg /get ${name}`, { encoding: 'utf-8', stdio: 'pipe' });
    const trimmed = out.trim();
    // powercfg /get returns "GUID: <value>" or just the number depending on Windows version
    // Try to extract a number
    const match = trimmed.match(/(\d+)/);
    return match ? match[1] : trimmed;
  } catch {
    return null;
  }
}

// Capture all managed settings into an object
function captureOriginalSettings() {
  const settings = {};
  for (const key of MANAGED_SETTINGS) {
    const val = getPowerSetting(key);
    if (val !== null) {
      settings[key] = val;
    }
  }
  return settings;
}

// Build restore commands from saved settings
function buildRestoreCommands(savedSettings) {
  const commands = [];
  for (const key of MANAGED_SETTINGS) {
    if (savedSettings[key] !== undefined) {
      commands.push(`powercfg /change ${key} ${savedSettings[key]}`);
    }
  }
  return commands;
}

// PowerShell commands for SERVER MODE (nothing sleeps, nothing turns off)
const SERVER_MODE_COMMANDS = [
  'powercfg /change standby-timeout-ac 0',
  'powercfg /change standby-timeout-dc 0',
  'powercfg /change hibernate-timeout-ac 0',
  'powercfg /change hibernate-timeout-dc 0',
  'powercfg /change monitor-timeout-ac 0',
  'powercfg /change monitor-timeout-dc 0',
  'powercfg /setacvalueindex SCHEME_CURRENT 4f971e89-eebd-4455-a8de-9e59040e7347 5ca83367-6e45-459f-a27b-476b1d01c936 0',
  'powercfg /setdcvalueindex SCHEME_CURRENT 4f971e89-eebd-4455-a8de-9e59040e7347 5ca83367-6e45-459f-a27b-476b1d01c936 0',
  'powercfg /setactive SCHEME_CURRENT'
];

// PowerShell commands for NORMAL MODE (Windows 11 sensible defaults)
const NORMAL_MODE_DEFAULTS = [
  'powercfg /change monitor-timeout-dc 10',
  'powercfg /change monitor-timeout-ac 15',
  'powercfg /change standby-timeout-dc 30',
  'powercfg /change standby-timeout-ac 30',
  'powercfg /change hibernate-timeout-ac 0',
  'powercfg /change hibernate-timeout-dc 0',
  'powercfg /setacvalueindex SCHEME_CURRENT 4f971e89-eebd-4455-a8de-9e59040e7347 5ca83367-6e45-459f-a27b-476b1d01c936 1',
  'powercfg /setdcvalueindex SCHEME_CURRENT 4f971e89-eebd-4455-a8de-9e59040e7347 5ca83367-6e45-459f-a27b-476b1d01c936 1',
  'powercfg /setactive SCHEME_CURRENT'
];

// Run a list of commands, return detailed error if any fail
function runCommands(commands) {
  for (const cmd of commands) {
    try {
      // Use cmd /c so powercfg runs natively without PowerShell quote issues
      const out = execSync(`cmd /c ${cmd}`, { encoding: 'utf-8', stdio: 'pipe' });
      if (out && out.trim()) console.log(`[OK] ${cmd} -> ${out.trim()}`);
    } catch (err) {
      const stderr = err.stderr ? err.stderr.toString() : '';
      const stdout = err.stdout ? err.stdout.toString() : '';
      throw new Error(
        `Command failed: ${cmd}\n` +
        (stderr ? `Stderr: ${stderr.trim()}\n` : '') +
        (stdout ? `Stdout: ${stdout.trim()}` : '')
      );
    }
  }
}

// GET /state — returns current mode
app.get('/state', (req, res) => {
  res.json(getState());
});

// POST /server-mode — activate server mode
app.post('/server-mode', (req, res) => {
  try {
    const state = getState();
    // Only capture original settings if we haven't already (prevents overwriting backup)
    let originalSettings = state.originalSettings || null;
    if (!originalSettings) {
      originalSettings = captureOriginalSettings();
    }

    runCommands(SERVER_MODE_COMMANDS);
    saveState('server', originalSettings);
    res.json({ success: true, mode: 'server' });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message,
      hint: 'If this mentions "Access denied" or "permission", right-click run.bat and select "Run as administrator".'
    });
  }
});

// POST /normal-mode — restore normal mode
app.post('/normal-mode', (req, res) => {
  try {
    const state = getState();
    let commands;
    if (state.originalSettings && Object.keys(state.originalSettings).length > 0) {
      commands = buildRestoreCommands(state.originalSettings);
      // Restore lid-close action to default (sleep)
      commands.push('powercfg /setacvalueindex SCHEME_CURRENT 4f971e89-eebd-4455-a8de-9e59040e7347 5ca83367-6e45-459f-a27b-476b1d01c936 1');
      commands.push('powercfg /setdcvalueindex SCHEME_CURRENT 4f971e89-eebd-4455-a8de-9e59040e7347 5ca83367-6e45-459f-a27b-476b1d01c936 1');
    } else {
      commands = [...NORMAL_MODE_DEFAULTS];
    }
    commands.push('powercfg /setactive SCHEME_CURRENT');

    runCommands(commands);
    saveState('normal');
    res.json({ success: true, mode: 'normal' });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message,
      hint: 'If this mentions "Access denied" or "permission", right-click run.bat and select "Run as administrator".'
    });
  }
});

app.listen(PORT, () => {
  console.log(`BITSERVER running on http://localhost:${PORT}`);
  console.log(`Open http://localhost:${PORT} in your browser.`);
  // Auto-open browser after a short delay
  setTimeout(() => {
    exec('start http://localhost:' + PORT + '/', (err) => {
      if (err && !err.killed) {
        // fallback: print url
        console.log('Could not open browser automatically.');
      }
    });
  }, 800);
});
