package com.rainbowmeultimatelist;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.uimanager.ThemedReactContext;


class UltraFastTextWrapperManager extends UltraFastAbstractComponentWrapperManager<UltraFastTextWrapper> {
  public static final String REACT_CLASS = "UltraFastTextWrapper";

  public UltraFastTextWrapperManager(ReactApplicationContext reactContext) {
    super(reactContext);
  }

  @Override
  public String getName() {
    return REACT_CLASS;
  }

  @Override
  public UltraFastTextWrapper createViewInstance(ThemedReactContext context) {
    return new UltraFastTextWrapper(context);
  }
}
