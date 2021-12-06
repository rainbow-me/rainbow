// @ts-expect-error ts-migrate(2305) FIXME: Module '"prop-types"' has no exported member 'Prop... Remove this comment to see the full error message
import { PropTypes } from 'prop-types';
import React, { createElement, PureComponent } from 'react';
import { List } from '../list';
// @ts-expect-error ts-migrate(6142) FIXME: Module './RadioListItem' was resolved to '/Users/n... Remove this comment to see the full error message
import RadioListItem from './RadioListItem';

export default class RadioList extends PureComponent {
  static propTypes = {
    items: PropTypes.arrayOf(
      PropTypes.shape({
        value: PropTypes.oneOfType([PropTypes.number, PropTypes.string])
          .isRequired,
      })
    ),
    onChange: PropTypes.func,
    renderItem: PropTypes.func,
    value: PropTypes.string,
  };

  static defaultProps = {
    renderItem: RadioListItem,
  };

  // @ts-expect-error ts-migrate(2339) FIXME: Property 'value' does not exist on type 'Readonly<... Remove this comment to see the full error message
  state = { selected: this.props.value };

  handleChange = (selected: any) => {
    this.setState({ selected }, () => {
      // @ts-expect-error ts-migrate(2339) FIXME: Property 'onChange' does not exist on type 'Readon... Remove this comment to see the full error message
      if (this.props.onChange) {
        // @ts-expect-error ts-migrate(2339) FIXME: Property 'onChange' does not exist on type 'Readon... Remove this comment to see the full error message
        this.props.onChange(selected);
      }
    });
  };

  renderItem = ({ item }: any) =>
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'renderItem' does not exist on type 'Read... Remove this comment to see the full error message
    createElement(this.props.renderItem, {
      ...item,
      onPress: this.handleChange,
      selected: item.forceSelected || item.value === this.state.selected,
    });

  // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
  render = () => <List {...this.props} renderItem={this.renderItem} />;
}
