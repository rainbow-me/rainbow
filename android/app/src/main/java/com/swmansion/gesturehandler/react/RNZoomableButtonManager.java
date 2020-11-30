package com.swmansion.gesturehandler.react;
import android.content.Context;
import android.view.animation.Animation;
import android.view.animation.Interpolator;
import android.view.animation.ScaleAnimation;
import androidx.core.view.animation.PathInterpolatorCompat;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.annotations.ReactProp;
import java.util.Timer;
import java.util.TimerTask;
import javax.annotation.Nullable;

public class RNZoomableButtonManager extends
        RNGestureHandlerButtonViewManager {
    static class ZoomableButtonViewGroup extends ButtonViewGroup {
        int mMinLongPressDuration = 500;
        float mScaleTo = 0.86f;
        int mDuration = 160;
        float pivotX = 0.5f;
        float pivotY = 0.5f;

        public ZoomableButtonViewGroup(Context context) {
            super(context);
        }

        static Interpolator bezierInterpolator = PathInterpolatorCompat.create(0.25f, 0.46f, 0.45f, 0.94f);

        private boolean isActive = false;
        private void animate(boolean in) {
            if (isActive == in) {
                return;
            }
            isActive = in;
            this.clearAnimation();
            this.postOnAnimation(() -> {
                Animation anim = new ScaleAnimation(
                        in ? 1f : mScaleTo, !in ? 1f : mScaleTo,
                        in ? 1f : mScaleTo, !in ? 1f : mScaleTo,
                        this.getMeasuredWidth() * pivotX,
                        this.getMeasuredHeight() * pivotY);
                anim.setFillAfter(true);
                anim.setDuration(mDuration);
                anim.setInterpolator(bezierInterpolator);
                this.startAnimation(anim);
            });
        }

        @Override
        public void setPressed(boolean pressed) {

            this.animate(pressed);
            super.setPressed(pressed);

            if (pressed) {
                new Timer().schedule(new TimerTask() {
                    @Override
                    public void run() {
                        animate(false);
                    }
                }, mMinLongPressDuration);
            }
        }
    }
    @Override
    public ButtonViewGroup createViewInstance(ThemedReactContext context) {
        return new ZoomableButtonViewGroup(context);
    }

    @Override
    public String getName() {
        return "RNZoomableButton";
    }

    @ReactProp(name = "minLongPressDuration")
    public void setMinLongPressDuration(ZoomableButtonViewGroup view, Integer minLongPressDuration) {
        view.mMinLongPressDuration = minLongPressDuration;
    }

    @ReactProp(name = "scaleTo")
    public void setScaleTo(ZoomableButtonViewGroup view, float scaleTo) {
        view.mScaleTo = scaleTo;
    }

    @ReactProp(name = "duration")
    public void setDuration(ZoomableButtonViewGroup view, Integer duration) {
        view.mDuration = duration;
    }

    @ReactProp(name = "transformOrigin")
    public void setTransformOrigin(ZoomableButtonViewGroup view, @Nullable ReadableArray transformOrigin) {
        if (transformOrigin == null) {
            view.pivotX = 0.5f;
            view.pivotY = 0.5f;
        } else {
            view.pivotX = (float) transformOrigin.getDouble(0);
            view.pivotY = (float) transformOrigin.getDouble(1);
        }
    }
}