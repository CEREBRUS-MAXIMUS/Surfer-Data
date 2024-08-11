import React from 'react';
import { Provider } from 'react-redux';
import store from './state/store';
import { ThemeProvider } from './components/ui/theme-provider';
import { PhotoProvider } from 'react-photo-view';

import './styles/globals.css';
import Surfer from './Surfer';

export default function App() {
  return (
    <Provider store={store}>
      <ThemeProvider defaultTheme="dark" storageKey="app-theme">
        <PhotoProvider>
          <Surfer />
        </PhotoProvider>
      </ThemeProvider>
    </Provider>
  );
}
