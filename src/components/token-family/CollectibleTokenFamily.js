import PropTypes from 'prop-types';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigation } from 'react-navigation-hooks';
import { UniqueTokenRow } from '../unique-token';
import { setOpenFamilyTabs } from '../../redux/openStateSettings';
import TokenFamilyWrap from './TokenFamilyWrap';

const CollectibleTokenFamily = ({
  familyId,
  familyImage,
  familyName,
  item,
  ...props
}) => {
  const { navigate } = useNavigation();

  const handleItemPress = useCallback(
    asset => navigate('ExpandedAssetScreen', { asset, type: 'unique_token' }),
    [navigate]
  );

  const renderChild = useCallback(
    index => (
      <UniqueTokenRow
        item={item[index]}
        key={`tokenFamily_${familyId}_${index}`}
        onPress={handleItemPress}
      />
    ),
    [familyId, handleItemPress, item]
  );

  return (
    <TokenFamilyWrap
      {...props}
      familyId={familyId}
      familyImage={familyImage}
      item={item}
      renderItem={renderChild}
      title={familyName}
    />
  );
};

CollectibleTokenFamily.propTypes = {
  familyId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  familyImage: PropTypes.string,
  familyName: PropTypes.string,
  item: PropTypes.object,
};

export default React.memo(CollectibleTokenFamily);
