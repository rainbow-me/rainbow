import React from 'react';
import { colors, fonts, padding } from '../../styles';
import Divider from '../Divider';
import { Centered, ColumnWithMargins, Row } from '../layout';
import { SheetButton } from '../sheet';
import { GradientText, Text } from '../text';

const TitleStyle = {
  fontSize: parseFloat(fonts.size.big),
  fontWeight: fonts.weight.bold,
};

const Title = p => <Text {...p} style={TitleStyle} />;

const BackupSheetFirstStep = ({ onIcloudBackup, onManualBackup }) => {
  return (
    <Centered direction="column" paddingTop={9} paddingBottom={15}>
      <Row marginBottom={12} marginTop={15}>
        <GradientText
          align="center"
          angle={false}
          letterSpacing="roundedTight"
          weight="bold"
          colors={['#FFB114', '#FF54BB', '#00F0FF']}
          end={{ x: 0, y: 0 }}
          start={{ x: 1, y: 1 }}
          steps={[0, 0.5, 1]}
        >
          <Text size={52}>􀙶</Text>
        </GradientText>
      </Row>
      <Row marginBottom={12}>
        <Title>Back up your wallet </Title>
      </Row>
      <Text
        align="center"
        color={colors.alpha(colors.blueGreyDark, 0.5)}
        lineHeight="looser"
        size="large"
        style={{ paddingBottom: 30, paddingHorizontal: 50 }}
      >
        Don&apos;t lose your wallet! Save an encrypted copy to iCloud.
      </Text>
      <Divider color={colors.rowDividerLight} inset={[0, 42]} />
      <ColumnWithMargins css={padding(19, 15)} margin={19} width="100%">
        <SheetButton
          color={colors.swapPurple}
          label="􀙶 Back up to iCloud"
          onPress={onIcloudBackup}
        />
        <SheetButton
          color={colors.white}
          textColor={colors.blueGreyDark50}
          label="🤓 Back up manually"
          onPress={onManualBackup}
        />
      </ColumnWithMargins>
    </Centered>
  );
};

export default BackupSheetFirstStep;
