import { combineReducers } from 'redux';
import {
  IAppState,
  IPreferences,
  IUser,
  IRun,
  ITask,
} from '../types/interfaces';
import { initialAppState } from '../config/initialStates';

const preferencesReducer = (
  state: IPreferences = initialAppState.preferences,
  action: any,
): IPreferences => {
  switch (action.type) {
    case 'SET_APPLICATION_FONT':
      return { ...state, applicationFont: action.payload };
    case 'SET_CONTENT_SCALE':
      return { ...state, contentScale: action.payload }; // Add this case for contentScale
    default:
      return state;
  }
};

const userReducer = (state: IUser = initialAppState.user, action: any): IUser => {
  switch (action.type) {
    case 'SET_USER_OS':
      return { ...state, os: action.payload };
    case 'SET_DATA_SOURCE_IMPORT_STATUS':
      return {
        ...state,
        dataSources: state.dataSources.map(source =>
          source.id === action.payload.sourceId
            ? { ...source, status: action.payload.status }
            : source
        ),
      };
    default:
      return state;
  }
};

const runsReducer = (state: IRun[] = initialAppState.runs, action: any): IRun[] => {
  switch (action.type) {
    case 'START_RUN':
      return [...state, action.payload];
    case 'UPDATE_RUN_STATUS':
      return state.map(run =>
        run.id === action.payload.runId
          ? { ...run, status: action.payload.status, endDate: action.payload.endDate }
          : run
      );
    case 'UPDATE_STEP_STATUS':
      return state.map(run =>
        run.id === action.payload.runId
          ? {
              ...run,
              tasks: run.tasks.map(task =>
                task.id === action.payload.taskId
                  ? {
                      ...task,
                      steps: task.steps.map(step =>
                        step.id === action.payload.stepId
                          ? {
                              ...step,
                              status: action.payload.status,
                              startTime: action.payload.startTime,
                              endTime: action.payload.endTime,
                              logs: action.payload.logs || step.logs
                            }
                          : step
                      )
                    }
                  : task
              )
            }
          : run
      );
    case 'UPDATE_TASK_STATUS':
      return state.map(run =>
        run.id === action.payload.runId
          ? {
              ...run,
              tasks: run.tasks.map(task =>
                task.id === action.payload.taskId
                  ? {
                      ...task,
                      status: action.payload.status,
                      startTime: action.payload.startTime,
                      endTime: action.payload.endTime,
                      logs: action.payload.logs || task.logs
                    }
                  : task
              )
            }
          : run
      );
    case 'STOP_RUN':
      return state.map(run =>
        run.id === action.payload
          ? { ...run, status: 'stopped', endDate: new Date().toISOString() }
          : run
      );
    case 'CLOSE_RUN':
      return state.filter(run => run.id !== action.payload);
    case 'UPDATE_EXPORT_STATUS':
      return state.map(run =>
        run.id === action.payload.runID
          ? { ...run, status: 'success', exportPath: action.payload.exportPath }
          : run
      );
    case 'SET_EXPORT_RUNNING':
      return state.map(run =>
        run.platformId === action.payload.platformId
          ? { ...run, status: action.payload.isRunning ? 'running' : 'pending' }
          : run
      );
    case 'STOP_ALL_JOBS':
      return state.map(run => ({
        ...run,
        status: run.status === 'running' ? 'stopped' : run.status,
        endDate: run.status === 'running' ? new Date().toISOString() : run.endDate,
        tasks: run.tasks.map(task => ({
          ...task,
          status: task.status === 'running' ? 'stopped' : task.status,
          endTime: task.status === 'running' ? new Date().toISOString() : task.endTime,
          steps: task.steps.map(step => ({
            ...step,
            status: step.status === 'running' ? 'stopped' : step.status,
            endTime: step.status === 'running' ? new Date().toISOString() : step.endTime,
          })),
        })),
      }));
    case 'UPDATE_RUN_URL':
      return state.map(run =>
        run.id === action.payload.runId
          ? { ...run, url: action.payload.newUrl }
          : run
      );
    default:
      return state;
  }
};

const activeRunIndexReducer = (state: number = initialAppState.activeRunIndex, action: any, runs: IRun[]): number => {
  switch (action.type) {
    case 'SET_ACTIVE_RUN_INDEX':
      return Math.min(Math.max(0, action.payload), runs.length - 1);
    case 'START_RUN':
      return runs.length; // Set to the index of the new run
    case 'CLOSE_RUN':
    case 'STOP_RUN':
    case 'ADJUST_ACTIVE_RUN_INDEX':
      return Math.min(state, Math.max(0, runs.length - 1));
    default:
      return state;
  }
};

const isRunLayerVisibleReducer = (state = initialAppState.isRunLayerVisible, action) => {
  switch (action.type) {
    case 'TOGGLE_RUN_VISIBILITY':
      return !state;
    case 'START_RUN':
      return true;
    case 'CLOSE_RUN':
      return state.length > 1; // Keep visible if there are still runs
    default:
      return state;
  }
};

const breadcrumbReducer = (state: { text: string; link: string }[] = [], action: any) => {
  switch (action.type) {
    case 'UPDATE_BREADCRUMB':
      return action.payload;
    case 'UPDATE_BREADCRUMB_TO_INDEX':
      return state.slice(0, action.payload + 1);
    default:
      return state;
  }
};

const selectedPlatformIdReducer = (state = initialAppState.selectedPlatformId, action: any) => {
  switch (action.type) {
    case 'SET_CURRENT_VIEW':
      return action.payload.platformId || null;
    default:
      return state;
  }
};

const selectedSubRunIdReducer = (state = initialAppState.selectedSubRunId, action: any) => {
  switch (action.type) {
    case 'SET_CURRENT_VIEW':
      return action.payload.subRunId || null;
    default:
      return state;
  }
};

const selectedRunIdReducer = (state = initialAppState.selectedRunId, action: any) => {
  switch (action.type) {
    case 'SET_CURRENT_VIEW':
      return action.payload.runId || null;
    default:
      return state;
  }
};

const appReducer = (state = { }, action) => {
  switch (action.type) {
    case 'SET_CURRENT_ROUTE':
      return { ...state, ...action.payload };
    default:
      return state;
  }
};

const isFullScreenReducer = (state = false, action: any) => {
  switch (action.type) {
    case 'SET_IS_FULL_SCREEN':
      return action.payload;
    default:
      return state;
  }
};

const isMacReducer = (state = false, action: any) => {
  switch (action.type) {
    case 'SET_IS_MAC':
      return action.payload;
    default:
      return state;
  }
};

// Custom combineReducers function
const customCombineReducers = (reducers: { [key: string]: any }) => {
  return (state: IAppState = initialAppState, action: any) => {
    const newState: any = {};
    for (const key in reducers) {
      if (key === 'activeRunIndex') {
        newState[key] = reducers[key](state[key], action, state.runs);
      } else {
        newState[key] = reducers[key](state[key], action);
      }
    }
    return newState as IAppState;
  };
};


const rootReducer = customCombineReducers({
  preferences: preferencesReducer,
  user: userReducer,
  runs: runsReducer,
  activeRunIndex: activeRunIndexReducer,
  isRunLayerVisible: isRunLayerVisibleReducer,
  breadcrumb: breadcrumbReducer,
  selectedPlatformId: selectedPlatformIdReducer,
  selectedSubRunId: selectedSubRunIdReducer,
  selectedRunId: selectedRunIdReducer,
  app: appReducer,
  isFullScreen: isFullScreenReducer,
  isMac: isMacReducer,
});

export default rootReducer;
