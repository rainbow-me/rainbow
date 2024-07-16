package com.swmansion.gesturehandler.react;

import android.annotation.SuppressLint;
import android.content.Context;
import android.os.Handler;
import android.os.Looper;
import android.view.MotionEvent;
import android.view.animation.Animation;
import android.view.animation.Interpolator;
import android.view.animation.ScaleAnimation;
import androidx.annotation.NonNull;
import androidx.core.view.animation.PathInterpolatorCompat;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.common.MapBuilder;
import com.facebook.react.module.annotations.ReactModule;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.ViewGroupManager;
import com.facebook.react.uimanager.annotations.ReactProp;
import com.facebook.react.uimanager.events.RCTEventEmitter;
import javax.annotation.Nullable;
import java.util.Map;

@ReactModule(name = "RNZoomableButton")
public class RNZoomableButtonManager extends ViewGroupManager<RNGestureHandlerButtonViewManager.ButtonViewGroup> {

    public static class ZoomableButtonViewGroup extends RNGestureHandlerButtonViewManager.ButtonViewGroup {
        private float mScaleTo = 0.86f;
        private int mDuration = 160;
        private float pivotX = 0.5f;
        private float pivotY = 0.5f;
        private static final Interpolator bezierInterpolator = PathInterpolatorCompat.create(0.25f, 0.46f, 0.45f, 0.94f);

        private boolean isLongPress = false;
        private boolean shouldLongPressHoldPress = false;
        private int mMinLongPressDuration = 500;

        private boolean mIsActive = false;
        private boolean mIsTaskScheduled = false;
        private boolean didLongPressFire = false;
        private boolean mIsLongTaskScheduled = false;

        private final Handler mHandler = new Handler(Looper.getMainLooper());
        private Runnable mLongPressRunnable;

        public ZoomableButtonViewGroup(Context context) {
            super(context);
        }

        private void animate(boolean in) {
            if (mIsActive == in) {
                return;
            }
            mIsActive = in;
            clearAnimation();
            float fromScale = in ? 1f : mScaleTo;
            float toScale = in ? mScaleTo : 1f;
            Animation anim = new ScaleAnimation(
                    fromScale, toScale,
                    fromScale, toScale,
                    Animation.RELATIVE_TO_SELF, pivotX,
                    Animation.RELATIVE_TO_SELF, pivotY);
            anim.setFillAfter(true);
            anim.setDuration(mDuration);
            anim.setInterpolator(bezierInterpolator);
            this.startAnimation(anim);
        }

        @SuppressLint("ClickableViewAccessibility")
        @Override
        public boolean onTouchEvent(@NonNull MotionEvent event) {
            int action = event.getActionMasked();

            switch (action) {
                case MotionEvent.ACTION_DOWN:
                    animate(true);
                    startLongPressTimer();
                    break;
                case MotionEvent.ACTION_UP:
                    mIsTaskScheduled = false;
                    cancelLongPress();
                    if (didLongPressFire && shouldLongPressHoldPress) {
                        didLongPressFire = false;
                        onLongPressEnded();
                        return true;
                    }
                    break;
                case MotionEvent.ACTION_CANCEL:
                    cancelLongPress();
                    if (didLongPressFire) {
                        didLongPressFire = false;
                    }
                    break;
            }

            return super.onTouchEvent(event);
        }

        @Override
        public void setPressed(boolean pressed) {
            animate(pressed);
            super.setPressed(pressed);
        }

        @Override
        public void cancelLongPress() {
            if (mLongPressRunnable != null) {
                mHandler.removeCallbacks(mLongPressRunnable);
            }
            mIsLongTaskScheduled = false;
            mIsTaskScheduled = false;
        }

        private void startLongPressTimer() {
            if (!mIsTaskScheduled) {
                mIsTaskScheduled = true;
                mIsLongTaskScheduled = false;
                if (isLongPress) {
                    mLongPressRunnable = () -> {
                        mIsTaskScheduled = false;
                        mIsLongTaskScheduled = true;
                        onLongPress();
                        if (!shouldLongPressHoldPress) {
                            animate(false);
                            setPressed(false);
                            didLongPressFire = false;
                        }
                    };
                    mHandler.postDelayed(mLongPressRunnable, mMinLongPressDuration);
                }
            }
        }

        @Override
        public boolean performClick() {
            if (!mIsTaskScheduled && !mIsLongTaskScheduled && !didLongPressFire) {
                boolean result = super.performClick();
                ReactContext reactContext = (ReactContext) getContext();
                WritableMap event = Arguments.createMap();
                event.putString("type", "press");
                reactContext.getJSModule(RCTEventEmitter.class).receiveEvent(
                        getId(),
                        "topPress",
                        event);
                return result;
            }
            return false;
        }

        private void onLongPress() {
            didLongPressFire = true;
            mIsLongTaskScheduled = false;
            ReactContext reactContext = (ReactContext) getContext();
            WritableMap event = Arguments.createMap();
            event.putString("type", "longPress");
            reactContext.getJSModule(RCTEventEmitter.class).receiveEvent(
                    getId(),
                    "topPress",
                    event);
        }

        private void onLongPressEnded() {
            WritableMap event = Arguments.createMap();
            event.putString("type", "longPressEnded");
            ReactContext reactContext = (ReactContext) getContext();
            reactContext.getJSModule(RCTEventEmitter.class).receiveEvent(
                    getId(),
                    "topPress",
                    event);
        }
    }

    @Override
    public Map getExportedCustomBubblingEventTypeConstants() {
        return MapBuilder.builder()
                .put(
                        "topPress",
                        MapBuilder.of(
                                "phasedRegistrationNames",
                                MapBuilder.of("bubbled", "onPress")))
                .build();
    }

    @NonNull
    @Override
    public RNGestureHandlerButtonViewManager.ButtonViewGroup createViewInstance(@NonNull ThemedReactContext context) {
        return new ZoomableButtonViewGroup(context);
    }

    @NonNull
    @Override
    public String getName() {
        return "RNZoomableButton";
    }

    @ReactProp(name = "scaleTo")
    public void setScaleTo(ZoomableButtonViewGroup view, float scaleTo) {
        view.mScaleTo = scaleTo;
    }

    @ReactProp(name = "minLongPressDuration")
    public void setMinLongPressDuration(ZoomableButtonViewGroup view, Integer minLongPressDuration) {
        view.mMinLongPressDuration = minLongPressDuration;
    }

    @ReactProp(name = "isLongPress")
    public void setIsLongPress(ZoomableButtonViewGroup view, boolean isLongPress) {
        view.isLongPress = isLongPress;
    }

    @ReactProp(name = "shouldLongPressHoldPress")
    public void setShouldLongPressHoldPress(ZoomableButtonViewGroup view, boolean shouldLongPressHoldPress) {
        view.shouldLongPressHoldPress = shouldLongPressHoldPress;
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