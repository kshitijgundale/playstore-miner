const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('desktop', {
  request: (path, method = 'GET', body) => ipcRenderer.invoke('desktop:request', { path, method, body }),
  settings: () => ipcRenderer.invoke('desktop:settings'),
  saveKey: value => ipcRenderer.invoke('desktop:save-key', value),
  clearKey: () => ipcRenderer.invoke('desktop:clear-key')
});
