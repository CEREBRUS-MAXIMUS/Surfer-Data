import { IAppState, IPreferences, IUser } from '../types/interfaces';

export const initialPreferencesState: IPreferences = {
  contentScale: 1,
};


export const initialAppState: IAppState = {
  preferences: initialPreferencesState,
  runs: [], // Add this line to initialize runs as an empty array
  activeRunIndex: 0, // Add this line to initialize activeRunIndex
  isRunLayerVisible: false, // Add this line to initialize isRunLayerVisible
};
