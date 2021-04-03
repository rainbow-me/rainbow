package me.rainbow.NativeModules.Internals;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;


public class InternalModule extends ReactContextBaseJavaModule {
    private final ReactApplicationContext reactContext;

    public InternalModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
    }

    @Override
    public void initialize() {
        super.initialize();
        // Your module code here

    }

    @Override
    public String getName() {
        return "InternalModule";
    }
}
