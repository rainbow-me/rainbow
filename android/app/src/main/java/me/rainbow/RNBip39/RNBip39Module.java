package me.rainbow.RNBip39;

import android.util.Log;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableMap;
import android.util.Base64;
import io.github.novacrypto.bip39.*;

public class RNBip39Module extends ReactContextBaseJavaModule {
    private final ReactApplicationContext reactContext;

    public RNBip39Module(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
    }

    @Override
    public String getName() {
        return "RNBip39";
    }


    @ReactMethod
    public void mnemonicToSeed(ReadableMap options, final Promise promise) {

        try {
            String passphrase = options.getString("passphrase");
            if(passphrase == null){
                passphrase = "";
            }
            String mnemonic = options.getString("mnemonic");
            byte[] seed = new SeedCalculator().calculateSeed(mnemonic, passphrase);
            String base64String = Base64.encodeToString(seed, Base64.NO_WRAP);
            promise.resolve(base64String);
        } catch(Exception e){
            promise.reject(e);
        }
    }

}
