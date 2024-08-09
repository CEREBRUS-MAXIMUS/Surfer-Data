import { IAppState, IPreferences, IUser } from '../types/interfaces';

export const initialPreferencesState: IPreferences = {
  defaultChatPanelPosition: 'right',
  highlightButtons: false,
  applicationFont: 'font-bricolage',
  showSystemMessages: true,
  userProfileActiveTab: 'context',
  contentScale: 1,
};

export const initialUserState: IUser = {
  os: null,
  dataSources: [],
};

export const initialAppState: IAppState = {
  currentPage: 'tabs',
  preferences: initialPreferencesState,
  user: initialUserState,
  runs: [], // Add this line to initialize runs as an empty array
  activeRunIndex: 0, // Add this line to initialize activeRunIndex
  isRunLayerVisible: false, // Add this line to initialize isRunLayerVisible
};
