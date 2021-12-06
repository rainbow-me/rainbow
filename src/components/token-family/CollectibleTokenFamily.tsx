import React, { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setOpenFamilyTabs } from '../../redux/openStateSettings';
import { UniqueTokenRow } from '../unique-token';
// @ts-expect-error ts-migrate(6142) FIXME: Module './TokenFamilyWrap' was resolved to '/Users... Remove this comment to see the full error message
import TokenFamilyWrap from './TokenFamilyWrap';

const CollectibleTokenFamily = ({
  external,
  familyId,
  familyImage,
  familyName,
  showcase,
  item,
  ...props
}: any) => {
  const dispatch = useDispatch();

  const isFamilyOpen = useSelector(
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'openStateSettings' does not exist on typ... Remove this comment to see the full error message
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
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <UniqueTokenRow
        external={external}
        item={item[i]}
        key={`${familyName}_${i}`}
      />
    ),
    [external, familyName, item]
  );

  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
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
