import PropTypes from 'prop-types';
import React from 'react';
import { withProps } from 'recompact';
import isNativeStackAvailable from '../../helpers/isNativeStackAvailable';
import { colors } from '../../styles';
import { TextCycler } from '../animations';
import { Column, ColumnWithMargins } from '../layout';
import { SheetHandle } from '../sheet';
import { Rounded } from '../text';

const SubTitle = withProps({
  align: 'center',
  color: colors.alpha(colors.blueGreyDark, 0.5),
  letterSpacing: 'uppercase',
  size: 'smedium',
  uppercase: true,
  weight: 'semibold',
})(Rounded);

const Title = withProps({
  align: 'center',
  letterSpacing: 'looseyGoosey',
  lineHeight: 'loose',
  size: 'large',
  weight: 'bold',
})(Rounded);

const AddCashHeader = ({ subtitles }) => (
  <Column align="center" paddingVertical={isNativeStackAvailable ? 6 : 8}>
    <SheetHandle />
    <ColumnWithMargins margin={4} paddingTop={7}>
      <Title>Add Cash</Title>
      {subtitles && (
        <TextCycler
          height={17}
          items={subtitles}
          paddingVertical={14}
          renderer={SubTitle}
        />
      )}
    </ColumnWithMargins>
  </Column>
);

AddCashHeader.propTypes = {
  subtitles: PropTypes.arrayOf(PropTypes.string),
};

export default React.memo(AddCashHeader);
