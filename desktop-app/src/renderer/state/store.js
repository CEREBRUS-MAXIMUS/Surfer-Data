import { configureStore } from '@reduxjs/toolkit';
import rootReducer from './reducers';
import { initialAppState } from './initialStates';

// Load saved state from localStorage
let savedState = localStorage.getItem('userState');

const preloadedState = savedState ? JSON.parse(savedState) : initialAppState;

// Ensure isRunLayerVisible is false on application start
if (preloadedState) {
  preloadedState.isRunLayerVisible = false;
}

// Create a custom middleware to log actions
const loggerMiddleware = (store) => (next) => (action) => {
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
