import { Component, createElement } from 'react';
import { AppState } from 'react-native';

export default ComponentToWrap => (
  class AppStateWrapper extends Component {
    state = { appState: AppState.currentState }

    componentDidMount = () => AppState.addEventListener('change', this.handleChange)

    componentWillUnmount = () => AppState.removeEventListener('change', this.handleChange)

    handleChange = appState => this.setState({ appState })

    render = () => createElement(ComponentToWrap, { ...this.props, ...this.state })
  }
);
