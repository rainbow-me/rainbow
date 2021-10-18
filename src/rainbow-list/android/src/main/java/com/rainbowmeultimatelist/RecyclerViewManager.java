package com.rainbowmeultimatelist;

import static com.rainbowmeultimatelist.UltimateNativeModule.sLists;

import androidx.annotation.Nullable;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.common.MapBuilder;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.ViewGroupManager;
import com.facebook.react.uimanager.annotations.ReactProp;

import java.util.Map;

public class RecyclerViewManager extends ViewGroupManager<RecyclerListView> {

  public static final String REACT_CLASS = "RecyclerListView";
  ReactApplicationContext mCallerContext;

  public RecyclerViewManager(ReactApplicationContext reactContext) {
    mCallerContext = reactContext;
  }

  @ReactProp(name = "isRefreshing")
  public void setIsRefreshing(RecyclerListView view, boolean isRefreshing) {
    view.setIsRefreshing(isRefreshing);
  }

  @ReactProp(name = "onRefresh")
  public void setOnRefresh(RecyclerListView view, boolean isOnRefreshSet) {
    view.setIsOnRefreshSet(isOnRefreshSet);
  }

  @ReactProp(name = "id")
  public void setId(RecyclerListView view, int id) {
    view.mId = id;
    // TODO osdnk also removing
    sLists.put(id, view);
  }

  @Override
  public String getName() {
    return REACT_CLASS;
  }

  @Override
  public RecyclerListView createViewInstance(ThemedReactContext context) {
    return new RecyclerListView(context);
  }

  public static Map<String, Object> createExportedCustomDirectEventTypeConstants() {
    return MapBuilder.<String, Object>builder()
      .put(
        "onRefresh",
        MapBuilder.of("registrationName", "onRefresh"))
      .build();
  }

  @Nullable
  @Override
  public Map<String, Object> getExportedCustomDirectEventTypeConstants() {
    return createExportedCustomDirectEventTypeConstants();
  }
}
