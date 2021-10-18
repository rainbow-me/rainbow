package com.rainbowmeultimatelist;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.uimanager.ViewGroupManager;
import com.facebook.react.uimanager.annotations.ReactProp;

abstract public class UltraFastAbstractComponentWrapperManager<UltraFastComponentWrapper extends UltraFastAbstractComponentWrapper> extends ViewGroupManager<UltraFastComponentWrapper> {
  protected ReactApplicationContext mCallerContext;

  public UltraFastAbstractComponentWrapperManager(ReactApplicationContext reactContext) {
    mCallerContext = reactContext;
  }

  @ReactProp(name = "binding")
  public void setBinding(UltraFastComponentWrapper view, String binding) {
    view.mBinding = binding;
  }
}
