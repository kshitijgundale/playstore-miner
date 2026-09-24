import React, { useEffect, useState } from 'react';

export default function DesktopSettings() {
  const [settings, setSettings] = useState(null);
  const [key, setKey] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => { window.desktop.settings().then(setSettings).catch(error => setMessage(error.message)); }, []);
  async function update(action) {
    setBusy(true); setMessage('');
    try {
      const status = action === 'save' ? await window.desktop.saveKey(key) : await window.desktop.clearKey();
      setSettings(current => ({ ...current, ...status }));
      setKey(''); setMessage(action === 'save' ? 'Key saved.' : 'Key cleared.');
    } catch (error) { setMessage(error.message); }
    finally { setBusy(false); }
  }
  return <section className="panel desktop-settings"><p className="eyebrow">Desktop settings</p><h1>Settings</h1><h2>SerpApi key</h2><p>{settings?.configured ? 'A key is configured.' : 'No key is configured. Saved research is still available.'}</p><div className="controls"><input type="password" value={key} onChange={event => setKey(event.target.value)} placeholder={settings?.configured ? 'Enter replacement key' : 'Enter SerpApi key'} aria-label="SerpApi key" autoComplete="off"/><button disabled={busy || !key.trim()} onClick={() => update('save')}>{settings?.configured ? 'Replace key' : 'Save key'}</button>{settings?.configured && <button disabled={busy} onClick={() => update('clear')}>Clear key</button>}</div>{message && <p role="status">{message}</p>}<h2>Research data</h2><p>Your desktop database is in:</p><code>{settings?.directory || 'Loading…'}</code><p>Close the app before copying <code>miner.sqlite</code> to a backup. Keep the backup in another location.</p></section>;
}
