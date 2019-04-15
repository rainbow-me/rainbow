import PropTypes from 'prop-types';
import React from 'react';
import { pure } from 'recompact';
import { UnderlineField } from '../fields';
import { RowWithMargins } from '../layout';
import { Monospace } from '../text';

const SendAssetFormField = ({
  assetAmount,
  autoFocus,
  format,
  label,
  labelMaxLength,
  onChange,
  onPressButton,
  placeholder,
  value,
  ...props
}) => (
  <RowWithMargins
    align="start"
    flex={0}
    justify="space-between"
    margin={23}
    {...props}
  >
    <UnderlineField
      autoFocus={autoFocus}
      buttonText="Max"
      format={format}
      keyboardType="decimal-pad"
      onChange={onChange}
      onPressButton={onPressButton}
      placeholder={placeholder}
      value={value}
    />
    <Monospace color="blueGreyDark" size="h2">
      {((label.length > labelMaxLength)
        ? label.substring(0, labelMaxLength)
        : label
      )}
    </Monospace>
  </RowWithMargins>
);

SendAssetFormField.propTypes = {
  assetAmount: PropTypes.number,
  autoFocus: PropTypes.bool,
  format: PropTypes.func,
  label: PropTypes.string,
  labelMaxLength: PropTypes.number,
  onChange: PropTypes.func,
  onPressButton: PropTypes.func,
  placeholder: PropTypes.string,
  value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
};

SendAssetFormField.defaultProps = {
  labelMaxLength: 6,
};

export default pure(SendAssetFormField);
