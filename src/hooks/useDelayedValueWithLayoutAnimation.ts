import { useEffect, useState } from 'react';
import { LayoutAnimation } from 'react-native';

export default function (value: any, property = LayoutAnimation.Properties.opacity) {
  const [delayedValue, setValue] = useState(value);

  useEffect(() => {
    LayoutAnimation.configureNext(LayoutAnimation.create(200, LayoutAnimation.Types.easeInEaseOut, property));
    setValue(value);
  }, [setValue, value, property]);

  return delayedValue;
}
