package me.rainbow.NativeModules.RNAnimatedNumbers;

import android.content.Context;
import android.os.Handler;
import android.os.Looper;
import android.text.SpannableStringBuilder;
import android.view.ViewGroup;
import com.facebook.react.ReactPackage;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.uimanager.SimpleViewManager;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.UIManagerModule;
import com.facebook.react.uimanager.ViewManager;
import com.facebook.react.uimanager.annotations.ReactProp;
import com.facebook.react.views.textinput.ReactEditText;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;


class AnimatedNumbersConfig extends ViewGroup {
    String mPrefix = "";
    String mSuffix = "";
    int mMaxDigitsAfterDot = 10;
    int mMaxSignsTotally = 10;
    double mValue = 0.0;
    String mPad = "";

    public AnimatedNumbersConfig(Context context) {
        super(context);
    }

    @Override
    protected void onLayout(boolean changed, int l, int t, int r, int b) {

    }
}

class AnimatedNumbersConfigManager extends SimpleViewManager<AnimatedNumbersConfig> {

    public static final String REACT_CLASS = "AnimatedNumbersConfig";
    ReactApplicationContext mCallerContext;

    @Override
    public String getName() {
        return REACT_CLASS;
    }

    public AnimatedNumbersConfig createViewInstance(ThemedReactContext context) {
        return new AnimatedNumbersConfig(context);
    }

    @ReactProp(name = "prefix")
    public void setPrefix(AnimatedNumbersConfig config, final String prefix) {
        config.mPrefix = prefix;
    }

    @ReactProp(name = "suffix")
    public void setSuffix(AnimatedNumbersConfig config, final String suffix) {
        config.mSuffix = suffix;
    }

    @ReactProp(name = "pad")
    public void setPad(AnimatedNumbersConfig config, final String pad) {
        config.mPad = pad;
    }

    @ReactProp(name = "maxDigitsAfterDot")
    public void setMaxDigitsAfterDot(AnimatedNumbersConfig config, final int maxDigitsAfterDot) {
        config.mMaxDigitsAfterDot = maxDigitsAfterDot;
    }

    @ReactProp(name = "maxSignsTotally")
    public void setMaxSignsTotally(AnimatedNumbersConfig config, final int maxSignsTotally) {
        config.mMaxSignsTotally = maxSignsTotally;
    }

}

class UIUpdater {
    private Handler mHandler = new Handler(Looper.getMainLooper());
    private Runnable mStatusChecker;
    private int mUpdateInterval = 50;
    boolean mStopped = false;

    public UIUpdater(final Runnable uiUpdater) {
        mStatusChecker = new Runnable() {
            @Override
            public void run() {
                if (!mStopped) {
                    uiUpdater.run();
                    mHandler.postDelayed(this, mUpdateInterval);
                }
            }
        };
    }

    public UIUpdater(Runnable uiUpdater, int interval) {
        this(uiUpdater);
        mUpdateInterval = interval;
    }

    public synchronized void startUpdates() {
        mStatusChecker.run();
    }

    public synchronized void stopUpdates() {
        mHandler.removeCallbacks(mStatusChecker);
    }
}

class AnimatedNumbersModule extends ReactContextBaseJavaModule {
    private ReactApplicationContext mContext;
    private final Map<Integer, AnimatedNumbersConfig> configs = new HashMap();
    private final Map<Integer, ReactEditText> textFields = new HashMap();
    private final Map<Integer, UIUpdater> timers = new HashMap();
    public AnimatedNumbersModule(ReactApplicationContext reactContext) {
        mContext = reactContext;
    }

    public static String rightPadZeros(String str, int num) {
        return String.format("%1$-" + num + "s", str).replace(' ', '0');
    }

    @Override
    public String getName() {
        return "AnimatedNumbersManager";
    }


    @ReactMethod
    public void animate(final int viewId, final int configId, ReadableMap config) {
        UIManagerModule uiManager = mContext.getNativeModule(UIManagerModule.class);
        uiManager.addUIBlock(nativeViewHierarchyManager -> {
            ReactEditText view = (ReactEditText) nativeViewHierarchyManager.resolveView(viewId);
            AnimatedNumbersConfig configView = (AnimatedNumbersConfig) nativeViewHierarchyManager.resolveView(configId);
            textFields.put(viewId, view);
            configs.put(viewId, configView);
            final double framesPerSecond = config.hasKey("framesPerSecond") ? config.getDouble("framesPerSecond") : 20;
            final double initialValue = configView.mValue;
            final boolean hasToValue = config.hasKey("toValue");
            final double toValue = hasToValue ? config.getDouble("toValue") : 0;

            final double stepPerSecond = config.getDouble("stepPerSecond") * (hasToValue && toValue < initialValue ? -1 : 1);


            final long startTime = System.currentTimeMillis();
            UIUpdater handler = new UIUpdater(() -> {
                double value = initialValue + ((System.currentTimeMillis() - startTime) * 0.001) * stepPerSecond;
                if (hasToValue) {
                    if (stepPerSecond > 0) {
                        if (value > toValue) {
                            value = toValue;
                        }
                    }
                    if (stepPerSecond < 0) {
                        if (value < toValue) {
                            value = toValue;
                        }
                    }
                }
                String step = String.valueOf(value);
                step = step.substring(0, Math.min(configView.mMaxSignsTotally, step.length()));
                if (step.indexOf('.') != -1) {
                    step = step.substring(0, Math.min(configView.mMaxDigitsAfterDot + 1 + step.indexOf('.'), step.length()));
                }

                if (configView.mPad.equals("right")) {
                    if (step.indexOf('.') == -1) {
                        step = step + '.';
                    }
                    step = rightPadZeros(step, Math.min(step.indexOf('.') + 1 + configView.mMaxDigitsAfterDot, configView.mMaxSignsTotally));
                }

                String resultValue = configView.mPrefix
                        + step
                        + configView.mSuffix;
                SpannableStringBuilder builder = new SpannableStringBuilder();
                builder.append(resultValue);
                view.setText(builder);
                configView.mValue = value;
                if (value == toValue) {
                    stop(viewId);
                }

            }, (int)(1000 / framesPerSecond));
            handler.startUpdates();
            timers.put(viewId, handler);
        });
    }

    @ReactMethod
    public void stop(final int viewId) {
        UIUpdater timer = timers.get(viewId);
        if (timer != null) {
            timer.mStopped = true;
            timer.stopUpdates();
        }
        timers.remove(viewId);
        textFields.remove(viewId);
        configs.remove(viewId);
    }

    @Override
    public void onCatalystInstanceDestroy() {
        for (Object k : timers.keySet()) {
            stop((Integer) k);
        }
    }
}

public class RNAnimatedNumbersPackage implements ReactPackage {
    @Override
    public List<NativeModule> createNativeModules(ReactApplicationContext reactContext) {
        return Arrays.asList(new AnimatedNumbersModule(reactContext));
    }

    @Override
    public List<ViewManager> createViewManagers(ReactApplicationContext reactContext) {
        return Arrays.asList(
                new AnimatedNumbersConfigManager());
    }
}





