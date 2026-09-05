import { contextBridge, ipcRenderer } from 'electron';
import { AUTH_CHANNELS } from '../ipc/channels/auth.channels';

contextBridge.exposeInMainWorld('electronAPI', {
  auth: {
    login:   (email: string, password: string) =>
      ipcRenderer.invoke(AUTH_CHANNELS.LOGIN, { email, password }),
    logout:  () => ipcRenderer.invoke(AUTH_CHANNELS.LOGOUT),
    refresh: () => ipcRenderer.invoke(AUTH_CHANNELS.REFRESH),
  },
});
