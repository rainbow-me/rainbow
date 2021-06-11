import React, { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setOpenFamilyTabs } from '../../redux/openStateSettings';
import { UniqueTokenRow } from '../unique-token';
import TokenFamilyWrap from './TokenFamilyWrap';

const CollectibleTokenFamily = ({
  external,
  familyId,
  familyImage,
  familyName,
  showcase,
  item,
  ...props
}) => {
  const dispatch = useDispatch();

  const isFamilyOpen = useSelector(
    ({ openStateSettings }) =>
      openStateSettings.openFamilyTabs[
        familyName + (showcase ? '-showcase' : '')
      ]
  );

  const handleToggle = useCallback(
    () =>
      dispatch(
        setOpenFamilyTabs({
          index: familyName + (showcase ? '-showcase' : ''),
          state: !isFamilyOpen,
        })
      ),
    [dispatch, familyName, isFamilyOpen, showcase]
  );

  const renderChild = useCallback(
    i => (
      <UniqueTokenRow
        external={external}
        item={item[i]}
        key={`${familyName}_${i}`}
      />
    ),
    [external, familyName, item]
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

export default React.memo(CollectibleTokenFamily);
