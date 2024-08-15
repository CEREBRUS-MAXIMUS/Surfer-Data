import { IAppState, IPreferences } from '../types/interfaces';

export const initialPreferencesState: IPreferences = {
  contentScale: 1,
};

export const initialAppState: IAppState = {
  preferences: initialPreferencesState,
  app: {
    route: '/',
    activeRunIndex: 0,
    isFullScreen: false,
    isMac: false,
    isRunLayerVisible: false,
    breadcrumb: [{ text: 'Home', link: '/' }],
    runs: [],
  },
};
