package com.swmansion.gesturehandler.react;
import android.content.Context;
import android.view.MotionEvent;
import android.view.animation.Animation;
import android.view.animation.Interpolator;
import android.view.animation.ScaleAnimation;
import androidx.core.view.animation.PathInterpolatorCompat;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.common.MapBuilder;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.annotations.ReactProp;
import com.facebook.react.uimanager.events.RCTEventEmitter;
import java.util.Map;
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

        private boolean mIsActive = false;
        private Timer mLongPressTimer = new Timer();
        private boolean mIsTaskScheduled = false;
        private void animate(boolean in) {
            if (mIsActive == in) {
                return;
            }
            mIsActive = in;
            this.clearAnimation();
            Animation anim = new ScaleAnimation(
                    in ? 1f : mScaleTo, !in ? 1f : mScaleTo,
                    in ? 1f : mScaleTo, !in ? 1f : mScaleTo,
                    this.getMeasuredWidth() * pivotX,
                    this.getMeasuredHeight() * pivotY);
            anim.setFillAfter(true);
            anim.setDuration(mDuration);
            anim.setInterpolator(bezierInterpolator);
            this.startAnimation(anim);
        }


        @Override
        public boolean onTouchEvent(MotionEvent ev){
            if (ev.getAction() == MotionEvent.ACTION_DOWN) {
                this.animate(true);
            }
            if (ev.getAction() == MotionEvent.ACTION_UP) {
                if (mIsTaskScheduled) {
                    onReceivePressEvent(false);
                }
                mLongPressTimer.cancel();
                mLongPressTimer = new Timer();
                mIsTaskScheduled = false;
            }

            return super.onTouchEvent(ev);
        }

        @Override
        public void setPressed(boolean pressed) {
            this.animate(pressed);
            super.setPressed(pressed);

            if (pressed && !mIsTaskScheduled) {
                mIsTaskScheduled = true;
                mLongPressTimer.schedule(new TimerTask() {
                    @Override
                    public void run() {
                        mIsTaskScheduled = false;
                        onReceivePressEvent(true);
                        animate(false);
                    }
                }, mMinLongPressDuration);
            }

            if (!pressed && mIsTaskScheduled) {
                mLongPressTimer.cancel();
                mLongPressTimer = new Timer();
                mIsTaskScheduled = false;
            }
        }

        public void onReceivePressEvent(boolean longPress) {
            WritableMap event = Arguments.createMap();
            event.putString("type", longPress ? "longPress" : "press");
            ReactContext reactContext = (ReactContext)getContext();
            reactContext.getJSModule(RCTEventEmitter.class).receiveEvent(
                    getId(),
                    "topPress",
                    event);
        }
    }

    public Map getExportedCustomBubblingEventTypeConstants() {
        return MapBuilder.builder()
                .put(
                        "topPress",
                        MapBuilder.of(
                                "phasedRegistrationNames",
                                MapBuilder.of("bubbled", "onPress")))
                .build();
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