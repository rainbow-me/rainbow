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
        boolean isLongPress = false;
        boolean shouldLongPressHoldPress = false;


        public ZoomableButtonViewGroup(Context context) {
            super(context);
        }

        static Interpolator bezierInterpolator = PathInterpolatorCompat.create(0.25f, 0.46f, 0.45f, 0.94f);

        private boolean mIsActive = false;
        private Timer mLongPressTimer = new Timer();
        private boolean mIsTaskScheduled = false;
        private boolean mIsLongTaskScheduled = false;
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
        public boolean performClick() {
            if (!mIsLongTaskScheduled) {
                onReceivePressEvent(false);
            }
            return super.performClick();
        }

        @Override
        public boolean onTouchEvent(MotionEvent ev){
            if (ev.getAction() == MotionEvent.ACTION_UP) {
                mIsTaskScheduled = false;
                if (mIsLongTaskScheduled && isLongPress && shouldLongPressHoldPress) {
                    onReceivePressEndedEvent();
                }
                mLongPressTimer.cancel();
                mLongPressTimer = new Timer();
            }
            return super.onTouchEvent(ev);
        }

        static ButtonViewGroup sButtonResponder;

        @Override
        public void setPressed(boolean pressed) {
            if (pressed && sButtonResponder == null) {
                // first button to be pressed grabs button responder
                sButtonResponder = this;
            }
            if (!pressed || sButtonResponder == this) {
                // we set pressed state only for current responder
                setPressedInternal(pressed);
            }
            if (!pressed && sButtonResponder == this) {
                // if the responder is no longer pressed we release button responder
                sButtonResponder = null;
            }
        }

        private void setPressedInternal(boolean pressed) {
            this.animate(pressed);
            super.setPressed(pressed);

            if (pressed && !mIsTaskScheduled) {
                mIsTaskScheduled = true;
                mIsLongTaskScheduled = false;
                if (isLongPress) {
                    mLongPressTimer.schedule(new TimerTask() {
                        @Override
                        public void run() {
                            mIsTaskScheduled = false;
                            mIsLongTaskScheduled = true;

                            onReceivePressEvent(true);
                            if (!shouldLongPressHoldPress) {
                                animate(false);
                            }
                        }
                    }, mMinLongPressDuration);
                }
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

        public void onReceivePressEndedEvent() {
            WritableMap event = Arguments.createMap();
            event.putString("type", "longPressEnded");
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

    @Override
    protected void onAfterUpdateTransaction(ButtonViewGroup view) {
        // Ripple effect is broken in GH 1.10.3 on Android 13
        // It appears all the time on press even when the color is transparent
        // So we disable any feedback completely since we have our own animation
        // So this is NOOP
    }
}