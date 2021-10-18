package com.rainbowmeultimatelist;


import android.graphics.Color;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.FrameLayout;

import androidx.recyclerview.widget.RecyclerView;

import com.facebook.react.uimanager.ThemedReactContext;

import java.util.HashMap;
import java.util.Map;


class JSValueGetter {
  private int mPosition;
  private int mId;
  private UltimateNativeModule mModule;
  public String getJSValue(String name) {
    return mModule.stringValueAtIndexByKey(mPosition, name, mId);
  }

  public JSValueGetter(int position, UltimateNativeModule module, int id) {
    mModule = module;
    mPosition = position;
    mId = id;
  }
}

public class MyRecyclerViewAdapter extends RecyclerView.Adapter<MyRecyclerViewAdapter.ViewHolder> implements StickyHeaders {
    private DragDropHelper dragDropHelper = new DragDropHelper();
    private DragAndDropCallback dragDropHelperCallback = new DragAndDropCallback();
    private LayoutInflater mInflater;
    private ThemedReactContext mContext;
    private RecyclerListView mRecyclerViewList;
    private UltimateNativeModule mModule;
    public View mView;

    @Override
    public long getItemId(int position) {
        return mModule.hashAtIndex(position, mRecyclerViewList.mId).hashCode();
    }

    MyRecyclerViewAdapter(ThemedReactContext context, View view, RecyclerListView list) {
        mView = view;
        mRecyclerViewList = list;
        this.mInflater = LayoutInflater.from(context);
        mContext = context;
        mModule = context.getNativeModule(UltimateNativeModule.class);
    }

    private CellStorage findStorageByType(ViewGroup parent, String type) {
      int childrenCount = parent.getChildCount();
      for (int i = 0 ; i < childrenCount; i++) {
          CellStorage child = (CellStorage) parent.getChildAt(i);
          if (child.mType.equals(type)) {
              return child;
          }
      }
      return null;
    }

    private Map<String, Integer> typeNamesToInt = new HashMap<>();
    private Map<Integer, String> IntToTypeName = new HashMap<>();

    // TODO osdnk
//    @Override
//    public void onAttachedToRecyclerView(@NonNull RecyclerView recyclerView) {
//        dragDropHelper.attach(recyclerView, dragDropHelperCallback);
//    }

    @Override
    public int getItemViewType(int position) {


        String type = mModule.typeAtIndex(position, mRecyclerViewList.mId);
        if (typeNamesToInt.containsKey(type)) {
            return typeNamesToInt.get(type);
        }
        int newId = typeNamesToInt.size();
        typeNamesToInt.put(type, newId);
        IntToTypeName.put(newId, type);
        // Just as an example, return 0 or 2 depending on position
        // Note that unlike in ListView adapters, types don't have to be contiguous
        return newId;
    }

    @Override
    public ViewHolder onCreateViewHolder(ViewGroup parent, int viewType) {
        String type = IntToTypeName.get(viewType);
        ViewGroup vg = ((ViewGroup) mView.getParent().getParent().getParent().getParent());
        CellStorage storage = findStorageByType(vg, type);
        FrameLayout view = new FrameLayout(mContext);
        ViewGroup.LayoutParams params = new FrameLayout.LayoutParams(storage.mMinWidth, storage.mMinHeight);
        view.setLayoutParams(params);
        storage.increaseNumberOfCells();
        return new ViewHolder(view);
    }


    @Override
    public void onBindViewHolder(ViewHolder holder, int position) {
        int viewType = holder.getItemViewType();
        holder.mLayout.setBackgroundColor(position  % 2 == 0 ? Color.MAGENTA : Color.RED);
        String type = IntToTypeName.get(viewType);
        ViewGroup recyclerRow = (ViewGroup) holder.mLayout.getChildAt(0);
        JSValueGetter valueGetter = new JSValueGetter(position, mModule, mRecyclerViewList.mId);
        if (recyclerRow instanceof RecyclerRow) {
            ((RecyclerRow)recyclerRow).recycle(position, valueGetter);
      } else {
          ViewGroup vg = ((ViewGroup) mView.getParent().getParent().getParent().getParent());
          CellStorage vgv = findStorageByType(vg, type);
          ViewGroup rowWrapper = (ViewGroup) vgv.getFirstNonEmptyChild();
          if (rowWrapper != null) {
              RecyclerRow row = (RecyclerRow) rowWrapper.getChildAt(0);
                ((RecyclerRow)row).recycle(position, valueGetter);
              row.mIgnoreResizing = 5;
              rowWrapper.removeView(row);
              holder.mLayout.removeView(recyclerRow);
              holder.mLayout.addView(row);
          } else {
              if (!holder.mRegisteredForInflating) {
                  vgv.registerViewNeedingInflating(holder.mLayout, position, mRecyclerViewList.mId);
                  holder.mRegisteredForInflating = true;
              }
          }
      }
    }

    @Override
    public int getItemCount() {
        return mModule.length(mRecyclerViewList.mId);
    }

    @Override
    public boolean isStickyHeader(int position) {
        return mModule.isHeaderAtIndex(position, mRecyclerViewList.mId);
    }


    public class ViewHolder extends RecyclerView.ViewHolder implements View.OnLongClickListener {
        public boolean mRegisteredForInflating = false;
        FrameLayout mLayout;

        ViewHolder(FrameLayout itemView) {
            super(itemView);
            mLayout = itemView;
            itemView.setOnLongClickListener(this);
        }



        // TODO osdnk - move to JS
        @Override
        public boolean onLongClick(View v) {
            mRecyclerViewList.adapter.dragDropHelper.start(getBindingAdapterPosition());
            return false;
        }
    }
}
