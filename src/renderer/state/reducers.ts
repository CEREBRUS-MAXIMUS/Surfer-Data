import { combineReducers } from 'redux';
import {
  IAppState,
  IPreferences,
  IUser,
  IRun,
  ITask,
} from '../types/interfaces';
import { initialAppState } from '../config/initialStates';

const currentPageReducer = (state: string = 'tabs', action: any): string => {
  switch (action.type) {
    case 'SET_CURRENT_PAGE':
      return action.payload.page;
    default:
      return state;
  }
};

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

const breadcrumbReducer = (state: { icon: string; text: string; link: string }[] = [], action: any) => {
  switch (action.type) {
    case 'UPDATE_BREADCRUMB':
      return action.payload;
    case 'SET_CURRENT_PAGE':
      return action.payload.breadcrumb;
    default:
      return state;
  }
};

const currentViewReducer = (state = initialAppState.currentView, action: any) => {
  switch (action.type) {
    case 'SET_CURRENT_VIEW':
      return action.payload.view;
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

const appReducer = (state = { currentRoute: '/' }, action) => {
  switch (action.type) {
    case 'SET_CURRENT_ROUTE':
      return { ...state, currentRoute: action.payload };
    default:
      return state;
  }
};

const routingReducer = (state = { currentRoute: '/', params: {} }, action) => {
  switch (action.type) {
    case 'SET_ROUTE':
      return { ...state, currentRoute: action.payload.route, params: action.payload.params };
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
  currentPage: currentPageReducer,
  preferences: preferencesReducer,
  user: userReducer,
  runs: runsReducer,
  activeRunIndex: activeRunIndexReducer,
  isRunLayerVisible: isRunLayerVisibleReducer,
  breadcrumb: breadcrumbReducer,
  currentView: currentViewReducer,
  selectedPlatformId: selectedPlatformIdReducer,
  selectedSubRunId: selectedSubRunIdReducer,
  selectedRunId: selectedRunIdReducer,
  app: appReducer,
  routing: routingReducer,
});

export default rootReducer;
