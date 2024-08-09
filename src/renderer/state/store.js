import { configureStore } from '@reduxjs/toolkit';
import rootReducer from './reducers';
import { initialAppState } from '../config/initialStates';

// Load saved state from localStorage
const savedState = localStorage.getItem('userState');
const preloadedState = savedState ? JSON.parse(savedState) : initialAppState;

// Create a custom middleware to log actions
const loggerMiddleware = (store) => (next) => (action) => {
  console.log('Action dispatched:', action);
  return next(action);
};

const store = configureStore({
  reducer: rootReducer,
  preloadedState: preloadedState,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(loggerMiddleware),
});

// Subscribe to store changes to save the state in localStorage
store.subscribe(() => {
  const currentState = store.getState();
  localStorage.setItem('userState', JSON.stringify(currentState));
});

export default store;
