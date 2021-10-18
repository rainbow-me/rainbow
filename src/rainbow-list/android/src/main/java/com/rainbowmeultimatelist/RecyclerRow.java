package com.rainbowmeultimatelist;

import android.util.Log;
import android.view.ViewParent;
import android.widget.FrameLayout;

import androidx.recyclerview.widget.RecyclerView;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.UIManagerModule;
import com.facebook.react.uimanager.events.Event;
import com.facebook.react.views.view.ReactViewGroup;

import java.util.HashSet;
import java.util.Set;

class RecyclerRow extends ReactViewGroup {
  private ThemedReactContext context;
  private int mPosition = -1;
  public JSValueGetter mCachedValueGetter;
  public String mType;
  private Set<Integer> ultraFastChildren = new HashSet<>();

  public void addUltraFastChildren(int id) {
    ultraFastChildren.add(id);
  }

  private void notifyUltraFastEvents(JSValueGetter valueGetter) {
    for (Integer id : ultraFastChildren) {
      UltraFastAbstractComponentWrapper component = (UltraFastAbstractComponentWrapper) findViewById(id);
      component.setValue(valueGetter.getJSValue(component.mBinding));
    }
  }

  public void renotifyUltraFastEvents() {
    notifyUltraFastEvents(mCachedValueGetter);
  }

  private void notifyReanimatedComponents(int position) {
    WritableMap mExtraData = Arguments.createMap();
    mExtraData.putInt("position", position);
    mExtraData.putInt("previousPosition", mPosition);

    Log.d("onRecycler", "see" + position + " from " + mPosition + "   DDDD   ");
    mPosition = position;
    context.getNativeModule(UIManagerModule.class).getEventDispatcher().dispatchEvent(new Event(context.getSurfaceId(), getId()) {
      @Override
      public String getEventName() {
        return "onRecycle";
      }

      @Override
      protected WritableMap getEventData() {
        return mExtraData;
      }
    });

    WritableMap mExtraData2 = Arguments.createMap();
    mExtraData2.putInt("position", position);
    mExtraData2.putInt("previousPosition", mPosition);


    context.getNativeModule(UIManagerModule.class).getEventDispatcher().dispatchEvent(new Event(context.getSurfaceId(), getId()) {
      @Override
      public String getEventName() {
        return "onRecycleBackup";
      }

      @Override
      protected WritableMap getEventData() {
        return mExtraData2;
      }
    });
  }

  public void recycle(int position, JSValueGetter valueGetter) {
    mCachedValueGetter = valueGetter;
    notifyUltraFastEvents(valueGetter);
    notifyReanimatedComponents(position);
  }

  public void recycle() {
    notifyUltraFastEvents(mCachedValueGetter);
    notifyReanimatedComponents(mPosition);
  }

  @Override
  public void setLayoutParams(LayoutParams params) {
    super.setLayoutParams(params);
    if (getParent() instanceof FrameLayout) {
      ((FrameLayout) getParent()).setLayoutParams(params);
    }
  }

  public int mIgnoreResizing = 2;
  public void tryResizing() {
    if (getParent().getParent() instanceof RecyclerView) {
      if (((FrameLayout) getParent()).getBottom() != ((FrameLayout) getParent()).getTop() + getBottom() - getTop()) {
        ((FrameLayout) getParent()).layout(
                ((FrameLayout) getParent()).getLeft(),
                ((FrameLayout) getParent()).getTop(),
                ((FrameLayout) getParent()).getRight(),
                ((FrameLayout) getParent()).getTop() + getBottom() - getTop());
      };
    }
  }


  @Override
  protected void onLayout(boolean changed, int left, int top, int right, int bottom) {
    super.onLayout(changed, left, top, right, bottom);
    ViewParent maybeStorage = getParent().getParent();
    if (maybeStorage instanceof CellStorage) {
      ((CellStorage) maybeStorage).notifySomeViewIsReady();
    }
    // TODO osdnk
    // tryResizing();
  }

  public RecyclerRow(ThemedReactContext context) {
    super(context);
    this.context = context;
  }

}
