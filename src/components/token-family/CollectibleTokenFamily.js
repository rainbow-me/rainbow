import PropTypes from 'prop-types';
import React, { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
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
  const dispatch = useDispatch();

  const isFamilyOpen = useSelector(
    ({ openStateSettings }) => openStateSettings.openFamilyTabs[familyId]
  );

  const handleToggle = useCallback(
    () =>
      dispatch(setOpenFamilyTabs({ index: familyId, state: !isFamilyOpen })),
    [dispatch, familyId, isFamilyOpen]
  );

  const renderChild = useCallback(
    i => <UniqueTokenRow item={item[i]} key={`${familyName}_${i}`} />,
    [familyName, item]
  );

  return (
    <TokenFamilyWrap
      {...props}
      familyId={familyId}
      familyImage={familyImage}
      isOpen={isFamilyOpen}
      item={item}
      onToggle={handleToggle}
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
