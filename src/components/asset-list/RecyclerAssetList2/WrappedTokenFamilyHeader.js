import {useOpenFamilies} from "@rainbow-me/hooks";
import {setOpenFamilyTabs} from "@rainbow-me/redux/openStateSettings";
import React, { useCallback } from 'react'
import {TokenFamilyHeader} from "../../token-family";
import { useSelector, useDispatch } from 'react-redux';


export default function WrappedTokenFamilyHeader({ name, total, image }) {
  const showcase = (name === 'Showcase')

  const { openFamilies, updateOpenFamilies } = useOpenFamilies();
  const isFamilyOpen = openFamilies[name + (showcase ? '-showcase' : '')];

  const handleToggle = useCallback(
    () =>
      updateOpenFamilies({
        [name + (showcase ? '-showcase' : '')]: !isFamilyOpen,
      }),
    [name, isFamilyOpen, showcase, updateOpenFamilies]
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
