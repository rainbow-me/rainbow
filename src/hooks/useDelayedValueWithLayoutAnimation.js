import { useEffect, useState } from 'react';
import { LayoutAnimation } from 'react-native';

export default function (value) {
  const [delayedValue, setValue] = useState(value);

  useEffect(() => {
    LayoutAnimation.configureNext(
      LayoutAnimation.create(
        200,
        LayoutAnimation.Types.easeInEaseOut,
        LayoutAnimation.Properties.opacity
      )
    );
    setValue(value);
  }, [setValue, value]);

  return delayedValue;
}
