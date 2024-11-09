export interface IUserFile {
  uniqueID: string;
  mimeType: any;
  id: string;
  userId: string;
  path: string;
  dateCreated: number;
  dateModified: number;
  type: string;
  content: string;
  lastIndexed: number;
}

export interface IPreferences {
  contentScale: number;
}

export interface IDataSource {
  id: string;
  name: string;
  description: string;
  supportedOS: ('mac' | 'windows' | 'linux')[];
  status: 'not_imported' | 'importing' | 'imported';
}

export interface IAppState {
  preferences: IPreferences;
  app: {
    route: string;
    activeRunIndex: number;
    isFullScreen: boolean;
    isMac: boolean;
    isRunLayerVisible: boolean;
    breadcrumb: { text: string; link: string }[];
    runs: IRun[];
  };
}

export const initialState: IAppState = {
  preferences: {
    contentScale: 1,
  },
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

export interface IStep {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'success' | 'error';
  errorMessage?: string;
  startTime?: string;
  endTime?: string;
  logs: string;
}

export interface ITask {
  id: string;
  name: string;
  steps: IStep[];
  status: 'pending' | 'running' | 'success' | 'error';
  startTime?: string;
  endTime?: string;
  logs: string;
}

export interface IRun {
  id: string;
  platformId: string;
  filename: string;
  isConnected: boolean;
  startDate: string;
  endDate?: string;
  status: 'pending' | 'running' | 'success' | 'error' | 'stopped';
  tasks: ITask[];
  url: string;
  exportSize?: number;
  exportPath?: string;
  company: string;
  name: string;
  currentStep?: string;
  isUpdated?: boolean;
  logs?: string;
}

export interface IPlatform {
  id: string;
  name: string;
  logo: {
    light: string;
    dark: string;
  };
  company: string;
  companyLogo: string;
  home_url: string;
  supportedOS: ('mac' | 'windows' | 'linux')[];
  steps: Array<{ id: number; name: string; status: 'pending' | 'running' | 'success' | 'error' }>;
}
