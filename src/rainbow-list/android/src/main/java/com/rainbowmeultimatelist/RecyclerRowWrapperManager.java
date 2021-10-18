package com.rainbowmeultimatelist;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.ViewGroupManager;

class RecyclerRowWrapperManager extends ViewGroupManager<RecyclerRowWrapper> {
  public static final String REACT_CLASS = "RecyclerRowWrapper";
  ReactApplicationContext mCallerContext;

  public RecyclerRowWrapperManager(ReactApplicationContext reactContext) {
    mCallerContext = reactContext;
  }

  @Override
  public String getName() {
    return REACT_CLASS;
  }

  @Override
  public RecyclerRowWrapper createViewInstance(ThemedReactContext context) {
    return new RecyclerRowWrapper(context);
  }
}
