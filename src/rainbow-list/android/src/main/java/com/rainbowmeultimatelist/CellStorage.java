package com.rainbowmeultimatelist;

import android.graphics.Canvas;
import android.view.View;
import android.view.ViewGroup;
import android.widget.FrameLayout;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.UIManagerModule;
import com.facebook.react.uimanager.events.Event;
import com.facebook.react.views.view.ReactViewGroup;

import java.util.ArrayDeque;
import java.util.Queue;


class CellStorage extends ReactViewGroup {
  public String mType;
  int mMinWidth;
  int mMinHeight;
  boolean mLayoutSet = false;
  private boolean mWasTripled = false;
  private boolean mWasTryingToTriple = false;
  static class InflationRequests {
    private FrameLayout mView;
    private int mPosition;
    private int mId;



    UltimateNativeModule mModule;
    InflationRequests(FrameLayout view, int position, UltimateNativeModule module, int id) {
      mView = view;
      mPosition = position;
      mModule = module;
      mId = id;
    }

    public void inflate(ViewGroup rowWrapper) {
      if (rowWrapper != null) {
        View viewToRemove = mView.getChildAt(0);
        RecyclerRow row = (RecyclerRow) rowWrapper.getChildAt(0);
        rowWrapper.removeView(row);
        mView.removeView(viewToRemove);
        mView.addView(row);
        row.recycle(mPosition, new JSValueGetter(mPosition, mModule, mId));
      }
    }
  }

  public int mNumberOfCells = 1;
  private ThemedReactContext mContext;
  UltimateNativeModule mModule;


  private void sendMoreCellsEvent() {
    WritableMap mExtraData = Arguments.createMap();
    mExtraData.putInt("cells", mNumberOfCells);
    mContext.getNativeModule(UIManagerModule.class).getEventDispatcher().dispatchEvent(new Event(mContext.getSurfaceId(), getId()) {
      @Override
      public String getEventName() {
        return "onMoreRowsNeeded";
      }

      @Override
      public boolean canCoalesce() {
        return false;
      }

      @Override
      protected WritableMap getEventData() {
        return mExtraData;
      }
    });
    WritableMap mExtraData2 = Arguments.createMap();
    mExtraData2.putInt("cells", mNumberOfCells);
    mContext.getNativeModule(UIManagerModule.class).getEventDispatcher().dispatchEvent(new Event(mContext.getSurfaceId(), getId()) {
      @Override
      public String getEventName() {
        return "onMoreRowsNeededBackup";
      }

      @Override
      public boolean canCoalesce() {
        return false;
      }

      @Override
      protected WritableMap getEventData() {
        return mExtraData2;
      }
    });
  }

  public void increaseNumberOfCells() {
    mNumberOfCells+=1;
    sendMoreCellsEvent();
  }

  @Override
  protected void onLayout(boolean changed, int left, int top, int right, int bottom) {
    super.onLayout(changed, left, top, right, bottom);
    sendMoreCellsEvent();
  }



  private void triple() {
    if (mWasTripled) {
      return;
    }
    mWasTryingToTriple = true;
    if (getChildCount() == mNumberOfCells) {
      mWasTripled = true;
      mNumberOfCells *= 2;
      sendMoreCellsEvent();
    }
  }

  @Override
  protected void dispatchDraw(Canvas canvas) {
    super.dispatchDraw(canvas);
    // TODO osdnk decide if we need
    // triple();
  }



  private Queue<InflationRequests> mViewsNeedingInflating = new ArrayDeque();

  public void registerViewNeedingInflating(FrameLayout view, int position, int id) {
    mViewsNeedingInflating.add(new InflationRequests(view, position, mModule, id));
  }


  @Override
  public void addView(View child, int index, LayoutParams params) {
    super.addView(child, index, params);
  }

  public ViewGroup getFirstNonEmptyChild() {
    int count = getChildCount();
    for (int i = 0; i < count; i++) {
      View child = getChildAt(i);
      if (child instanceof ViewGroup && ((ViewGroup) child).getChildCount() > 0) {
        return (ViewGroup) child;
      }
    }
    return null;
  }

  public void notifySomeViewIsReady() {
    ViewGroup row = getFirstNonEmptyChild();
    if (row != null) {
      notifySomeViewIsReady(row);
    }
  }

  public void notifySomeViewIsReady(ViewGroup row) {
    if (mViewsNeedingInflating.isEmpty()) {
      return;
    }
    if (row == null) {
      return;
    }
    InflationRequests inflationRequests = mViewsNeedingInflating.poll();
    inflationRequests.inflate(row);
  }

  public void setLayout(int width, int height) {
    // TODO osdnk make it reactive
    if (mLayoutSet) {
      return;
    }
    mLayoutSet = true;
    mMinWidth = width;
    mMinHeight = height;
  }

  //  @Override
//  public void addView(View child) {
//    super.addView(child);
//
//    Log.d("[measured]", ":" + mMinWidth + "." + mMinHeight);
//  }

  public CellStorage(ThemedReactContext context) {
    super(context);
    mModule = context.getNativeModule(UltimateNativeModule.class);
    mContext = context;
  }
}
