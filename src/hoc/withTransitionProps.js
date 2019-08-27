import { connect } from 'react-redux';

const mapStateToProps = ({
  navigation: {
    stackTransitionProps,
    tabsTransitionProps,
  },
}) => ({
  stackTransitionProps,
  tabsTransitionProps,
});

const withTransitionProps = Component => connect(mapStateToProps)(Component);

export default withTransitionProps;
