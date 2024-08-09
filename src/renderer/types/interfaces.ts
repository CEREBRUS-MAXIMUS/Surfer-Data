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

export interface IUser {
  os: 'mac' | 'windows' | 'linux' | null;
  dataSources: IDataSource[];
}

export interface IAppState {
  currentPage: string;
  preferences: IPreferences;
  user: IUser;
  runs: IRun[];
  activeRunIndex: number;
  isRunLayerVisible: boolean;
}

export const initialState: IAppState = {
  currentPage: 'tabs',
  preferences: {
    contentScale: 1,
  },
  user: {
    os: null,
    dataSources: [],
  },
  runs: [],
  activeRunIndex: 0,
  isRunLayerVisible: false,
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

export interface ISubRun {
  id: string;
  name: string;
  icon: React.ComponentType;
  description: string;
  extractionMethod: string;
  tasks: ITask[];
}

export interface IRun {
  id: string;
  platformId: string;
  subRunId: string;
  startDate: string;
  endDate?: string;
  status: 'pending' | 'running' | 'success' | 'error' | 'stopped';
  tasks: ITask[];
  url: string;
  exportSize?: string;
  exportDate?: string;
  exportPath?: string;
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
  subRuns: ISubRun[];
  supportedOS: ('mac' | 'windows' | 'linux')[];
}
