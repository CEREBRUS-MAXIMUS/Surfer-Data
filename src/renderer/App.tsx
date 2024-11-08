import { Provider } from 'react-redux';
import store from './state/store';
import { ThemeProvider } from './components/ui/theme-provider';
import './styles/globals.css';
import Surfer from './Surfer';

export default function App() {
  return (
    <Provider store={store}>
      <ThemeProvider defaultTheme="light" storageKey="app-theme">
        <Surfer />
      </ThemeProvider>
    </Provider>
  );
}
