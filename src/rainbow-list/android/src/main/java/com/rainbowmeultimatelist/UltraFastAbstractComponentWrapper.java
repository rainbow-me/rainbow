package com.rainbowmeultimatelist;

import android.content.Context;
import android.util.Log;
import android.view.ViewParent;

import com.facebook.react.views.view.ReactViewGroup;

abstract public class UltraFastAbstractComponentWrapper extends ReactViewGroup {
  public String mBinding;

  public UltraFastAbstractComponentWrapper(Context context) {
    super(context);
  }

  abstract public void setValue(String value);

  @Override
  protected void onAttachedToWindow() {
    super.onAttachedToWindow();
    ViewParent parent = getParent();
    while(!(parent instanceof RecyclerRow)) {
      parent = parent.getParent();
    }
    if (parent != null) {
      ((RecyclerRow)parent).addUltraFastChildren(getId());
    } else {
      Log.d("[URLV]", "Error finding parent");
    }
  }
}
