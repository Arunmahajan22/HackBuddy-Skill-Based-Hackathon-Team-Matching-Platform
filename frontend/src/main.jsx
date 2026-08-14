import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext';
import './index.css';

const rootElement = document.getElementById('root');

if (rootElement) {
  createRoot(rootElement).render(
    <StrictMode>
      <ThemeProvider>
        <AuthProvider>
          <SocketProvider>
            <BrowserRouter>
              <App />
            </BrowserRouter>
          </SocketProvider>
        </AuthProvider>
      </ThemeProvider>
    </StrictMode>,
  );
}
