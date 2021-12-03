import {setOpenFamilyTabs} from "@rainbow-me/redux/openStateSettings";
import React from 'react'
import {TokenFamilyHeader} from "../../token-family";
import { useSelector, useDispatch } from 'react-redux';


export default function WrappedTokenFamilyHeader({ name, total, image }) {
  const showcase = (name === 'Showcase')
  const dispatch = useDispatch();

  const isFamilyOpen = useSelector(
    ({ openStateSettings }) =>
      openStateSettings.openFamilyTabs[
      name + (showcase ? '-showcase' : '')
        ]
  );


  const handleToggle = useCallback(
    () =>
      dispatch(
        setOpenFamilyTabs({
          index: name + (showcase ? '-showcase' : ''),
          state: !isFamilyOpen,
        })
      ),
    [dispatch, name, isFamilyOpen, showcase]
  );

  return (
    <TokenFamilyHeader
      title={name}
      isOpen={isFamilyOpen}
      onPress={handleToggle}
      familyImage={image}
      childrenAmount={total}

    />
  )
}
