import React, { useState } from 'react';
import { Provider } from 'react-redux';
import store from './state/store';
import { ThemeProvider } from './components/ui/theme-provider';
import { PhotoProvider } from 'react-photo-view';
import { AuthProvider } from './auth/FirebaseAuth';

import './styles/globals.css';
import Surfer from './Surfer';

export default function App() {

  return (
    <Provider store={store}>
      <ThemeProvider defaultTheme="light" storageKey="app-theme">
        <AuthProvider>
          <PhotoProvider>
            <Surfer />
          </PhotoProvider>
        </AuthProvider>
      </ThemeProvider>
    </Provider>
  );
}
