package com.swmansion.gesturehandler.react;
import android.content.Context;
import android.view.animation.Animation;
import android.view.animation.Interpolator;
import android.view.animation.ScaleAnimation;
import androidx.core.view.animation.PathInterpolatorCompat;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.annotations.ReactProp;
import java.util.Timer;
import java.util.TimerTask;

public class RNZoomableButtonManager extends
        RNGestureHandlerButtonViewManager {
    static class ZoomableButtonViewGroup extends ButtonViewGroup {
        private int mMinLongPressDuration = 500;
        private float mScaleTo = 0.86f;
        private int mDuration = 160;

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
            Animation anim = new ScaleAnimation(
                    in ? 1f : mScaleTo, !in ? 1f : mScaleTo,
                    in ? 1f : mScaleTo, !in ? 1f : mScaleTo,
                    (float)this.getMeasuredWidth() / 2,
                    (float)this.getMeasuredHeight() / 2);
            anim.setFillAfter(true);
            anim.setDuration(mDuration);
            anim.setInterpolator(bezierInterpolator);
            this.startAnimation(anim);
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

        public void setMinLongPressDuration(Integer minLongPressDuration) {
            this.mMinLongPressDuration = minLongPressDuration;
        }

        public void setDuration(Integer duration) {
            this.mDuration = duration;
        }

        public void setScaleTo(float scaleTo) {
            this.mScaleTo = scaleTo;
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
        view.setMinLongPressDuration(minLongPressDuration);
    }

    @ReactProp(name = "scaleTo")
    public void setScaleTo(ZoomableButtonViewGroup view, float scaleTo) {
        view.setScaleTo(scaleTo);
    }

    @ReactProp(name = "duration")
    public void setDuration(ZoomableButtonViewGroup view, Integer duration) {
        view.setDuration(duration);
    }
}