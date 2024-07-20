package me.rainbow

import android.content.Intent
import android.content.res.Configuration
import android.os.Bundle
import android.webkit.WebView
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.modules.network.OkHttpClientProvider
import com.zoontek.rnbootsplash.RNBootSplash
import io.branch.rnbranch.RNBranchModule
import me.rainbow.NativeModules.Internals.CustomNetworkModule
import me.rainbow.NativeModules.RNBackHandler.RNBackHandlerPackage

class MainActivity : ReactActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        RNBootSplash.init(this, R.style.BootTheme) // Initialize the splash screen
        super.onCreate(null) // Pass null here as required by react-native-screens
        OkHttpClientProvider.setOkHttpClientFactory(CustomNetworkModule())
        WebView.setWebContentsDebuggingEnabled(false)
    }

    /**
     * Returns the name of the main component registered from JavaScript. This is used to schedule
     * rendering of the component.
     */
    override fun getMainComponentName(): String {
        return "Rainbow"
    }

    override fun onStart() {
        super.onStart()
        RNBranchModule.initSession(intent.data, this)
    }

    override fun onBackPressed() {
        if (!RNBackHandlerPackage.sBlockBack) {
            super.onBackPressed()
        }
    }

    override fun onConfigurationChanged(newConfig: Configuration) {
        super.onConfigurationChanged(newConfig)
        reactInstanceManager.onConfigurationChanged(this, newConfig)
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        RNBranchModule.onNewIntent(intent)
    }

    override fun createReactActivityDelegate(): ReactActivityDelegate =
        ReactActivityDelegate(this, mainComponentName)
}