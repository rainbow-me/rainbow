package me.rainbow.NativeModules.RNAnimatedNumbers;

import android.content.Context;
import android.view.ViewGroup;

import com.facebook.react.ReactPackage;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.uimanager.SimpleViewManager;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.ViewManager;

import java.util.Arrays;
import java.util.List;


class AnimatedNumbersConfig extends ViewGroup {

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
}

class AnimatedNumbersModule extends ReactContextBaseJavaModule {
    @Override
    public String getName() {
        return "AnimatedNumbersManager";
    }


    @ReactMethod
    public void start(final int viewId, ReadableMap config) {

    }

    @ReactMethod
    public void stop(final int viewId) {

    }

    @Override
    public void onCatalystInstanceDestroy() {
    }
}

public class RNAnimatedNumbersPackage implements ReactPackage {
    @Override
    public List<NativeModule> createNativeModules(ReactApplicationContext reactContext) {
        return Arrays.asList(new AnimatedNumbersModule() {

        });
    }

    @Override
    public List<ViewManager> createViewManagers(ReactApplicationContext reactContext) {
        return Arrays.<ViewManager>asList(
                new AnimatedNumbersConfigManager());
    }
}





