import { concat, forEach, get } from 'lodash';
import { getCharts, saveCharts } from '../handlers/localstorage/accountLocal';
import ChartTypes from '../helpers/chartTypes';

// -- Constants --------------------------------------- //
const CHARTS_UPDATE_CHART_TYPE = 'charts/CHARTS_UPDATE_CHART_TYPE';
const CHARTS_LOAD_REQUEST = 'charts/CHARTS_LOAD_REQUEST';
const CHARTS_LOAD_SUCCESS = 'charts/CHARTS_LOAD_SUCCESS';
const CHARTS_LOAD_FAILURE = 'charts/CHARTS_LOAD_FAILURE';
const CHARTS_UPDATE = 'charts/CHARTS_UPDATE';
const CHARTS_CLEAR_STATE = 'charts/CHARTS_CLEAR_STATE';

export const DEFAULT_CHART_TYPE = ChartTypes.year;

// -- Actions ---------------------------------------- //
export const chartsLoadState = () => async (dispatch, getState) => {
  const { accountAddress, network } = getState().settings;
  try {
    dispatch({ type: CHARTS_LOAD_REQUEST });
    const charts = await getCharts(accountAddress, network);
    dispatch({
      payload: charts,
      type: CHARTS_LOAD_SUCCESS,
    });
  } catch (error) {
    dispatch({ type: CHARTS_LOAD_FAILURE });
  }
};

export const chartsClearState = () => dispatch =>
  dispatch({ type: CHARTS_CLEAR_STATE });

export const chartsUpdateChartType = chartType => dispatch =>
  dispatch({
    payload: chartType,
    type: CHARTS_UPDATE_CHART_TYPE,
  });

export const addressChartsReceived = (
  message,
  append = false
  // change = false // TODO JIN handle change
) => (dispatch, getState) => {
  const { accountAddress, network } = getState().settings;
  const { chartType } = getState().charts;
  const charts = get(message, 'payload.charts', {}); // or payload.points if append?
  let updatedCharts = charts;
  if (append) {
    const { charts: existingCharts } = getState().charts;
    const appendedChartPoints = get(message, 'payload.points', {});
    updatedCharts = { ...existingCharts };
    forEach(appendedChartPoints, (value, key) => {
      const existingPoints = get(existingCharts, `${key}`, []);
      const updatedPoints = concat(value, existingPoints);
      updatedCharts[key] = updatedPoints;
    });
  }
  if (chartType === DEFAULT_CHART_TYPE) {
    saveCharts(updatedCharts, accountAddress, network);
  }
  dispatch({
    payload: updatedCharts,
    type: CHARTS_UPDATE,
  });
};

// -- Reducer ----------------------------------------- //
const INITIAL_STATE = {
  charts: {},
  chartType: DEFAULT_CHART_TYPE,
  fetchingCharts: false,
};

export default (state = INITIAL_STATE, action) => {
  switch (action.type) {
    case CHARTS_UPDATE_CHART_TYPE:
      return { ...state, chartType: action.payload, fetchingCharts: true };
    case CHARTS_LOAD_REQUEST:
      return {
        ...state,
        fetchingCharts: true,
      };
    case CHARTS_LOAD_SUCCESS:
      return {
        ...state,
        charts: action.payload,
        fetchingCharts: false,
      };
    case CHARTS_LOAD_FAILURE:
      return {
        ...state,
        fetchingCharts: false,
      };
    case CHARTS_UPDATE:
      return {
        ...state,
        charts: action.payload,
        fetchingCharts: false,
      };
    case CHARTS_CLEAR_STATE:
      return {
        ...state,
        ...INITIAL_STATE,
      };
    default:
      return state;
  }
};
