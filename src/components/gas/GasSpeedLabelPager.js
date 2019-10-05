import PropTypes from 'prop-types';
import React, { useEffect, useState } from 'react';
import { gasUtils } from '../../utils';
import { Row } from '../layout';
import GasSpeedLabelPagerItem from './GasSpeedLabelPagerItem';

const GasSpeedLabelPager = ({ label }) => {
  const [touched, setTouched] = useState(false);
  useEffect(() => setTouched(true), [label]);

  return (
    <Row align="center" height={GasSpeedLabelPagerItem.height} justify="end">
      {gasUtils.GasSpeedOrder.map(speed => (
        <GasSpeedLabelPagerItem
          height={28}
          key={speed}
          label={speed}
          selected={speed === label}
          shouldAnimate={touched}
        />
      ))}
    </Row>
  );
};

GasSpeedLabelPager.propTypes = {
  label: PropTypes.oneOf(gasUtils.GasSpeedOrder),
};

export default React.memo(GasSpeedLabelPager);
