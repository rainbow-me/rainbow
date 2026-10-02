package com.swmansion.gesturehandler.react;

import android.annotation.SuppressLint;
import android.content.Context;
import android.os.Handler;
import android.os.Looper;
import android.os.SystemClock;
import android.view.InputDevice;
import android.view.MotionEvent;
import android.view.View;
import android.view.ViewConfiguration;
import android.view.accessibility.AccessibilityManager;
import android.view.animation.Animation;
import android.view.animation.AnimationUtils;
import android.view.animation.Interpolator;
import android.view.animation.ScaleAnimation;
import android.view.animation.Transformation;
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
import com.swmansion.gesturehandler.core.NativeViewGestureHandler;
import javax.annotation.Nullable;
import java.util.Map;

@ReactModule(name = "RNZoomableButton")
public class RNZoomableButtonManager extends ViewGroupManager<RNGestureHandlerButtonViewManager.ButtonViewGroup> {

    public static class ZoomableButtonViewGroup extends RNGestureHandlerButtonViewManager.ButtonViewGroup {
        private static final Handler MAIN_HANDLER = new Handler(Looper.getMainLooper());

        private enum LongPressState { NONE, TRIGGERED, HOLDING }

        private float mScaleTo = 0.86f;
        private int mDuration = 160;
        private float pivotX = 0.5f;
        private float pivotY = 0.5f;
        private static final Interpolator bezierInterpolator = PathInterpolatorCompat.create(0.25f, 0.46f, 0.45f, 0.94f);

        private boolean hasPressStartHandler = false;
        private boolean isLongPress = false;
        private boolean shouldLongPressHoldPress = false;
        private int mMinLongPressDuration = 500;

        private boolean mIsActive = false;
        private LongPressState longPressState = LongPressState.NONE;
        private int activePointerId = MotionEvent.INVALID_POINTER_ID;
        private long touchDownTime = -1;
        private NativeViewGestureHandler gestureHandler;
        private boolean touchExploration;
        private float presentationScale = 1f;
        private final AccessibilityManager accessibilityManager;
        private final int touchSlop;

        private Runnable mLongPressRunnable;

        public ZoomableButtonViewGroup(Context context) {
            super(context);
            accessibilityManager = (AccessibilityManager) context.getSystemService(Context.ACCESSIBILITY_SERVICE);
            touchSlop = ViewConfiguration.get(context).getScaledTouchSlop();
        }

        private void animate(boolean in) {
            if (mIsActive == in) {
                return;
            }
            mIsActive = in;
            clearAnimation();
            float fromScale = presentationScale;
            float toScale = in ? mScaleTo : 1f;
            if (fromScale == 1f && toScale == 1f) {
                return;
            }
            Animation anim = new ScaleAnimation(
                    fromScale, toScale,
                    fromScale, toScale,
                    Animation.RELATIVE_TO_SELF, pivotX,
                    Animation.RELATIVE_TO_SELF, pivotY) {
                @Override
                protected void applyTransformation(float time, Transformation transformation) {
                    super.applyTransformation(time, transformation);
                    presentationScale = fromScale + (toScale - fromScale) * time;
                }
            };
            anim.setFillAfter(true);
            anim.setDuration(fromScale == toScale ? 0 : mDuration);
            anim.setInterpolator(bezierInterpolator);
            this.startAnimation(anim);
            anim.setStartTime(AnimationUtils.currentAnimationTimeMillis());
        }

        @Override
        public void onPrepare(NativeViewGestureHandler handler) {
            gestureHandler = handler;
        }

        @Override
        public void onReset(NativeViewGestureHandler handler) {
            if (gestureHandler == handler) {
                gestureHandler = null;
            }
        }

        @Override
        public boolean canBegin(@NonNull MotionEvent event) {
            return activePointerId != MotionEvent.INVALID_POINTER_ID;
        }

        @Override
        public boolean onInterceptTouchEvent(@NonNull MotionEvent event) {
            return !touchExploration && isPressed();
        }

        @Override
        public boolean wantsToHandleEventBeforeActivation() {
            return true;
        }

        @Override
        public void handleEventBeforeActivation(@NonNull MotionEvent event) {
            handleTouchEvent(event);
        }

        @Override
        public boolean dispatchTouchEvent(@NonNull MotionEvent event) {
            if (event.getActionMasked() == MotionEvent.ACTION_DOWN) {
                touchExploration = accessibilityManager.isTouchExplorationEnabled();
            }
            boolean handled = super.dispatchTouchEvent(event);
            return touchExploration ? onTouchEvent(event) || handled : handled;
        }

        @SuppressLint("ClickableViewAccessibility")
        @Override
        public boolean onTouchEvent(@NonNull MotionEvent event) {
            int action = event.getActionMasked();
            if (touchExploration || action == MotionEvent.ACTION_CANCEL) {
                return handleTouchEvent(event);
            }
            return true;
        }

        @Override
        public Boolean sendTouchEvent(@Nullable View view, @NonNull MotionEvent event) {
            return handleTouchEvent(event);
        }

        private boolean handleTouchEvent(MotionEvent event) {
            int action = event.getActionMasked();
            if (action == MotionEvent.ACTION_DOWN) {
                if (activePointerId != MotionEvent.INVALID_POINTER_ID && touchDownTime == event.getDownTime()) {
                    return true;
                }
                if (activePointerId != MotionEvent.INVALID_POINTER_ID) {
                    finishTouch(event, false);
                }
                touchExploration = accessibilityManager.isTouchExplorationEnabled();
                int pointerId = event.getPointerId(event.getActionIndex());
                if (!isEnabled() || !super.canBegin(event)) {
                    return false;
                }
                if (event.isFromSource(InputDevice.SOURCE_MOUSE)
                        && (event.getButtonState() & MotionEvent.BUTTON_SECONDARY) != 0) {
                    super.afterGestureEnd(event);
                    return showContextMenu(event.getX(), event.getY());
                }
                activePointerId = pointerId;
                touchDownTime = event.getDownTime();
                longPressState = LongPressState.NONE;
                if (!touchExploration) {
                    gestureHandler.activate();
                    if (activePointerId == MotionEvent.INVALID_POINTER_ID) {
                        return false;
                    }
                }
                setPressed(true);
                if (hasPressStartHandler) {
                    sendPressEvent("pressStart");
                }
                if (isLongPress) {
                    if (mLongPressRunnable == null) {
                        mLongPressRunnable = this::handleLongPressTimeout;
                    }
                    MAIN_HANDLER.postDelayed(mLongPressRunnable, mMinLongPressDuration);
                }
                return true;
            }

            if (activePointerId == MotionEvent.INVALID_POINTER_ID) {
                return false;
            }
            switch (action) {
                case MotionEvent.ACTION_MOVE:
                    int index = event.findPointerIndex(activePointerId);
                    if (index < 0 || !containsTouch(event.getX(index), event.getY(index))) {
                        finishTouch(event, false);
                    }
                    break;
                case MotionEvent.ACTION_POINTER_UP:
                    if (event.getPointerId(event.getActionIndex()) == activePointerId) {
                        finishTouch(event, false);
                    }
                    break;
                case MotionEvent.ACTION_UP:
                    int pointerIndex = event.findPointerIndex(activePointerId);
                    if (pointerIndex < 0 || !containsTouch(event.getX(pointerIndex), event.getY(pointerIndex))) {
                        finishTouch(event, false);
                    } else {
                        cancelLongPress();
                        // Touch exploration bypasses RNGH's end hook.
                        if (touchExploration) {
                            finishTouch(event, true);
                        }
                    }
                    break;
                case MotionEvent.ACTION_CANCEL:
                    finishTouch(event, false);
                    break;
            }
            return true;
        }

        @Override
        public void afterGestureEnd(@NonNull MotionEvent event) {
            if (activePointerId != MotionEvent.INVALID_POINTER_ID) {
                finishTouch(event, true);
            } else {
                super.afterGestureEnd(event);
            }
        }

        private boolean containsTouch(float x, float y) {
            if (!touchExploration) {
                return gestureHandler != null && gestureHandler.isWithinBounds(this, x, y);
            }
            return x >= -touchSlop && y >= -touchSlop && x < getWidth() + touchSlop && y < getHeight() + touchSlop;
        }

        private void finishTouch(MotionEvent event, boolean releasedInside) {
            LongPressState completedLongPress = longPressState;
            activePointerId = MotionEvent.INVALID_POINTER_ID;
            longPressState = LongPressState.NONE;
            cancelLongPress();
            super.afterGestureEnd(event);
            setPressed(false);
            if (completedLongPress == LongPressState.HOLDING) {
                sendPressEvent("longPressEnded");
            } else if (completedLongPress == LongPressState.NONE && releasedInside) {
                performClick();
            }
        }

        @Override
        public void setPressed(boolean pressed) {
            super.setPressed(pressed);
            animate(isPressed());
        }

        @Override
        public void cancelLongPress() {
            super.cancelLongPress();
            if (mLongPressRunnable != null) {
                MAIN_HANDLER.removeCallbacks(mLongPressRunnable);
            }
        }

        private void handleLongPressTimeout() {
            if (activePointerId == MotionEvent.INVALID_POINTER_ID) {
                return;
            }
            onLongPress();
            if (longPressState == LongPressState.TRIGGERED) {
                setPressed(false);
            }
        }

        private void cancelTouch() {
            if (activePointerId == MotionEvent.INVALID_POINTER_ID) {
                return;
            }
            long now = SystemClock.uptimeMillis();
            MotionEvent cancel = MotionEvent.obtain(touchDownTime, now, MotionEvent.ACTION_CANCEL, 0, 0, 0);
            finishTouch(cancel, false);
            cancel.recycle();
        }

        @Override
        public void onCancelPendingInputEvents() {
            cancelTouch();
            super.onCancelPendingInputEvents();
        }

        @Override
        public void onWindowFocusChanged(boolean hasWindowFocus) {
            if (!hasWindowFocus) {
                cancelTouch();
            }
            super.onWindowFocusChanged(hasWindowFocus);
        }

        @Override
        protected void onDetachedFromWindow() {
            cancelTouch();
            cancelLongPress();
            clearAnimation();
            presentationScale = 1f;
            mIsActive = false;
            super.onDetachedFromWindow();
        }

        @Override
        public boolean performClick() {
            super.performClick();
            sendPressEvent("press");
            return true;
        }

        private void onLongPress() {
            longPressState = shouldLongPressHoldPress ? LongPressState.HOLDING : LongPressState.TRIGGERED;
            sendPressEvent("longPress");
        }

        private void sendPressEvent(String type) {
            ReactContext reactContext = (ReactContext) getContext();
            WritableMap event = Arguments.createMap();
            event.putString("type", type);
            reactContext.getJSModule(RCTEventEmitter.class).receiveEvent(getId(), "topPress", event);
        }
    }

    @Override
    public Map<String, Object> getExportedCustomDirectEventTypeConstants() {
        return MapBuilder.of("topPress", MapBuilder.of("registrationName", "onPress"));
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

    @ReactProp(name = "hasPressStartHandler")
    public void setHasPressStartHandler(ZoomableButtonViewGroup view, boolean hasPressStartHandler) {
        view.hasPressStartHandler = hasPressStartHandler;
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
