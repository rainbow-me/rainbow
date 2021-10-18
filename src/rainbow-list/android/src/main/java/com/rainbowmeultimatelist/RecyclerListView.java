package com.rainbowmeultimatelist;

import android.view.View;
import android.widget.FrameLayout;
import android.widget.LinearLayout;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.recyclerview.widget.RecyclerListViewHelper;
import androidx.recyclerview.widget.RecyclerView;
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Dynamic;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.ReadableMapKeySetIterator;
import com.facebook.react.bridge.ReadableType;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.events.RCTEventEmitter;
import com.facebook.react.uimanager.events.RCTModernEventEmitter;
import com.facebook.react.views.swiperefresh.ReactSwipeRefreshLayout;

import java.util.HashMap;
import java.util.Iterator;
import java.util.Map;

class RecyclerListView extends LinearLayout {
  private ThemedReactContext context;
  MyRecyclerViewAdapter adapter;
  SwipeRefreshLayout mRefreshLayout;
  int mCount = -1;
  int mId = -1;
  boolean mIsOnRefreshSet = false;

  public void setIsRefreshing(boolean refreshing) {
    mRefreshLayout.setRefreshing(refreshing);
  }

  public void setIsOnRefreshSet(boolean isOnRefreshSet) {
    mIsOnRefreshSet = isOnRefreshSet;
    mRefreshLayout.setEnabled(mIsOnRefreshSet);
  }

  public void notifyNewData() {
    RecyclerView view = (RecyclerView) adapter.mView;
    MyRecyclerViewAdapter adapter = (MyRecyclerViewAdapter) view.getAdapter();
    view.post(() -> {
      UltimateNativeModule.moveFromPreSet(mId);
      if (adapter != null) {

        int [] removed = UltimateNativeModule.getRemoved(mId);
        int [] added = UltimateNativeModule.getAdded(mId);
        int [] moved = UltimateNativeModule.getMoved(mId);

        int arange = 1;
        for (int i = 0; i< added.length; i++) {
          int r = added[i];
          int r2 = i + 1 == added.length ? 0 : added[i+1];
          if (r2 - r == 1) {
            arange++;
          } else {
            if (arange == 1) {
              adapter.notifyItemInserted(r);
            } else {
              adapter.notifyItemRangeInserted(r - arange + 1, arange);
            }
          }
        }

        int rrange = 1;
        for (int i = 0; i< removed.length; i++) {
          int r = removed[i];
          int r2 = i + 1 == removed.length ? 0 : removed[i+1];
          if (r2 - r == 1) {
            rrange++;
          } else {
            if (rrange == 1) {
              adapter.notifyItemRemoved(r);
            } else {
              adapter.notifyItemRangeRemoved(r - rrange + 1, rrange);
            }
          }
        }

        for (int i = 0; i< moved.length; i+=2) {
          int from = moved[i];
          int to = moved[i+1];
          adapter.notifyItemMoved(from, to);
        }


        RecyclerListViewHelper.____consumePendingUpdateOperations(view);
        int childrenCount = view.getChildCount();
        for (int i = 0 ; i < childrenCount; i++) {
          View child = view.getChildAt(i);
          if (child instanceof FrameLayout) {
            View row = ((FrameLayout) child).getChildAt(0);
            if (row instanceof RecyclerRow) {
              ((RecyclerRow) row).recycle();
            }
          }
        }
      }
    });
  }

  public RecyclerListView(ThemedReactContext context) {
    super(context);
    this.context = context;
    inflate(context, R.layout.activity_main, this);
    RecyclerView recyclerView = findViewById(R.id.rvAnimals);
    mRefreshLayout = findViewById(R.id.swipe_container);
    mRefreshLayout.setOnRefreshListener(() -> {
      //mRefreshLayout.setRefreshing(false);
      context.getJSModule(RCTEventEmitter.class).receiveEvent(getId(), "onRefresh", Arguments.createMap());
    });
    recyclerView.setLayoutManager(new StickyHeadersLinearLayoutManager(context));
    adapter = new MyRecyclerViewAdapter(context, recyclerView, this);
    // TODO osdnk
    // adapter.setHasStableIds(true);
    recyclerView.setAdapter(adapter);
  }
}
