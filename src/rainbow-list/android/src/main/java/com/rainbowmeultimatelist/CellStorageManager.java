package com.rainbowmeultimatelist;

import androidx.annotation.Nullable;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.common.MapBuilder;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.ViewGroupManager;
import com.facebook.react.uimanager.annotations.ReactProp;

import java.util.Map;

class CellStorageManager extends ViewGroupManager<CellStorage> {
  public static final String REACT_CLASS = "CellStorage";
  private ReactApplicationContext mCallerContext;

  public CellStorageManager(ReactApplicationContext reactContext) {
    mCallerContext = reactContext;
  }

  @Override
  public String getName() {
    return REACT_CLASS;
  }

  @Override
  public CellStorage createViewInstance(ThemedReactContext context) {
    return new CellStorage(context);
  }

  @ReactProp(name = "type")
  public void setType(CellStorage view, String type) {
    view.mType = type;
  }

  @Override
  public @Nullable
  Map<String, Object> getExportedCustomDirectEventTypeConstants() {
    return createExportedCustomDirectEventTypeConstants();
  }

  public static Map<String, Object> createExportedCustomDirectEventTypeConstants() {
    return MapBuilder.<String, Object>builder()
      .put(
        "onMoreRowsNeeded",
        MapBuilder.of("registrationName", "onMoreRowsNeeded"))
      .put(
        "onMoreRowsNeededBackup",
        MapBuilder.of("registrationName", "onMoreRowsNeededBackup"))
      .build();
  }
}
