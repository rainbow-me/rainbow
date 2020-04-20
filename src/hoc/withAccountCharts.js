import { connect } from 'react-redux';
import { chartsUpdateChartType } from '../redux/charts';

const mapStateToProps = ({ charts: { charts, fetchingCharts } }) => ({
  charts,
  fetchingCharts,
});

export default Component =>
  connect(mapStateToProps, { chartsUpdateChartType })(Component);
