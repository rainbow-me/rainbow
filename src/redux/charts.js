import { get, mapValues, reverse } from 'lodash';
import ChartTypes from '../helpers/chartTypes';

// -- Constants --------------------------------------- //
const CHARTS_UPDATE_CHART_TYPE = 'charts/CHARTS_UPDATE_CHART_TYPE';
const CHARTS_UPDATE = 'charts/CHARTS_UPDATE';

export const DEFAULT_CHART_TYPE = ChartTypes.day;

// -- Actions ---------------------------------------- //
export const chartsUpdateChartType = (chartType, dpi) => dispatch =>
  dispatch({
    dpi,
    payload: chartType,
    type: CHARTS_UPDATE_CHART_TYPE,
  });

export const assetChartsReceived = message => (dispatch, getState) => {
  const chartType = get(message, 'meta.charts_type');
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
  dispatch({
    payload: updatedCharts,
    type: CHARTS_UPDATE,
  });
};

// -- Reducer ----------------------------------------- //
const INITIAL_STATE = {
  charts: {},
  chartType: DEFAULT_CHART_TYPE,
  chartTypeDPI: DEFAULT_CHART_TYPE,
  fetchingCharts: false,
  fetchingChartsDPI: false,
};

export default (state = INITIAL_STATE, action) => {
  switch (action.type) {
    case CHARTS_UPDATE_CHART_TYPE:
      return {
        ...state,
        [action.dpi ? 'chartTypeDPI' : 'chartType']: action.payload,
        [action.dpi ? 'fetchingChartsDPI' : 'fetchingCharts']: true,
      };
    case CHARTS_UPDATE:
      return {
        ...state,
        charts: action.payload,
        fetchingCharts: false,
        fetchingChartsDPI: false,
      };
    default:
      return state;
  }
};
