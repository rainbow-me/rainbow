package com.rainbowmeultimatelist;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;

class DragAndDropCallback implements DragDropHelper.Callback {

    @Override
    public void onDragStarted(@NonNull RecyclerView.ViewHolder holder, boolean create) {
    }

    @Override
    public void onDragMoved(@NonNull RecyclerView.ViewHolder holder, int x, int y) {

    }

    @Override
    public int onDragTo(@NonNull RecyclerView.ViewHolder holder, int to) {
        return 0;
    }

    @Override
    public void onDragStopped(@NonNull RecyclerView.ViewHolder holder, boolean destroy) {

    }
}
