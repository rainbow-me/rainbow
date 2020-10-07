import { get, mapValues, reverse } from 'lodash';
import {
  getAccountCharts,
  saveAccountCharts,
} from '../handlers/localstorage/accountLocal';
import ChartTypes from '../helpers/chartTypes';

// -- Constants --------------------------------------- //
const CHARTS_UPDATE_CHART_TYPE = 'charts/CHARTS_UPDATE_CHART_TYPE';
const CHARTS_LOAD_REQUEST = 'charts/CHARTS_LOAD_REQUEST';
const CHARTS_LOAD_SUCCESS = 'charts/CHARTS_LOAD_SUCCESS';
const CHARTS_LOAD_FAILURE = 'charts/CHARTS_LOAD_FAILURE';
const CHARTS_UPDATE = 'charts/CHARTS_UPDATE';
const CHARTS_CLEAR_STATE = 'charts/CHARTS_CLEAR_STATE';

export const DEFAULT_CHART_TYPE = ChartTypes.day;

// -- Actions ---------------------------------------- //
export const chartsLoadState = () => async (dispatch, getState) => {
  const { accountAddress, network } = getState().settings;
  try {
    dispatch({ type: CHARTS_LOAD_REQUEST });
    const charts = await getAccountCharts(accountAddress, network);
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

export const assetChartsReceived = message => (dispatch, getState) => {
  const chartType = get(message, 'meta.charts_type');
  const { accountAddress, network } = getState().settings;
  const { charts: existingCharts } = getState().charts;
  const assetCharts = get(message, 'payload.charts', {});
  const newChartData = mapValues(assetCharts, (chartData, address) => ({
    ...existingCharts[address],
    [chartType]: reverse(chartData),
  }));
  const updatedCharts = {
    ...existingCharts,
    ...newChartData,
  };
  saveAccountCharts(updatedCharts, accountAddress, network);
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
      return {
        ...state,
        chartType: action.payload,
        fetchingCharts: true,
      };
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
