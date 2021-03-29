import { get, mapValues, reverse, toLower } from 'lodash';

import ChartTypes from '../helpers/chartTypes';
import currenyTypes from '@rainbow-me/helpers/currencyTypes';
import { ETH_ADDRESS } from '@rainbow-me/references';

// -- Constants --------------------------------------- //
const CHARTS_UPDATE_CHART_TYPE = 'charts/CHARTS_UPDATE_CHART_TYPE';
const CHARTS_UPDATE = 'charts/CHARTS_UPDATE';
const CHARTS_UPDATE_USD = 'charts/CHARTS_UPDATE_USD';

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
  const { nativeCurrency } = getState().settings;
  if (toLower(nativeCurrency) === message?.meta?.currency) {
    const newChartData = mapValues(assetCharts, (chartData, address) => ({
      ...existingCharts[address],
      // .slice to prevent mutation
      [chartType]: reverse(chartData?.slice()),
    }));
    const updatedCharts = {
      ...existingCharts,
      ...newChartData,
    };
    dispatch({
      payload: updatedCharts,
      type: CHARTS_UPDATE,
    });
  }

  if (
    message?.meta?.currency === currenyTypes.usd &&
    assetCharts[ETH_ADDRESS] &&
    message?.meta?.charts_type === 'm'
  ) {
    dispatch({
      payload: reverse(assetCharts[ETH_ADDRESS]),
      type: CHARTS_UPDATE_USD,
    });
  }
};

// -- Reducer ----------------------------------------- //
const INITIAL_STATE = {
  charts: {},
  chartsEthUSDMonth: {},
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
    case CHARTS_UPDATE_USD:
      return {
        ...state,
        chartsEthUSDMonth: action.payload,
      };
    default:
      return state;
  }
};
