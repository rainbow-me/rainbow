package com.rainbowmeultimatelist;

import com.facebook.react.ReactPackage;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.uimanager.ViewManager;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;


public class UltimateListPackage implements ReactPackage {

  @Override
  public List<NativeModule> createNativeModules(ReactApplicationContext reactContext) {
    return Collections.singletonList(new UltimateNativeModule(reactContext));
  }

  @Override
  public List<ViewManager> createViewManagers(ReactApplicationContext reactContext) {
    return Arrays.asList(
      new RecyclerRowManager(reactContext),
      new RecyclerViewManager(reactContext),
      new UltraFastTextWrapperManager(reactContext),
      new CellStorageManager(reactContext),
      new RecyclerRowWrapperManager(reactContext)
    );
  }
}


