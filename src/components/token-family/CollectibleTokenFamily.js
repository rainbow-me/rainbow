import React, { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setOpenFamilyTabs } from '../../redux/openStateSettings';
import { UniqueTokenRow } from '../unique-token';
import TokenFamilyWrap from './TokenFamilyWrap';

const CollectibleTokenFamily = ({
  familyId,
  familyImage,
  familyName,
  item,
  forceOpen,
  ...props
}) => {
  const dispatch = useDispatch();

  const isFamilyOpen =
    useSelector(
      ({ openStateSettings }) => openStateSettings.openFamilyTabs[familyName]
    ) || forceOpen;

  const handleToggle = useCallback(
    () =>
      dispatch(setOpenFamilyTabs({ index: familyName, state: !isFamilyOpen })),
    [dispatch, familyName, isFamilyOpen]
  );

  const renderChild = useCallback(
    i => (
      <UniqueTokenRow
        forceOpen={forceOpen}
        item={item[i]}
        key={`${familyName}_${i}`}
      />
    ),
    [familyName, forceOpen, item]
  );

  return (
    <TokenFamilyWrap
      {...props}
      familyId={familyId}
      familyImage={familyImage}
      forceOpen={forceOpen}
      isOpen={isFamilyOpen}
      item={item}
      onToggle={handleToggle}
      renderItem={renderChild}
      title={familyName}
    />
  );
};

export default React.memo(CollectibleTokenFamily);
