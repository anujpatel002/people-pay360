import { app, BrowserWindow } from 'electron';
import path from 'path';
import { createMainWindow } from './windows/mainWindow';

const isDev = process.env.NODE_ENV === 'development';

app.whenReady().then(() => {
  createMainWindow(isDev);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow(isDev);
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
