package me.rainbow
import android.content.res.Configuration
import expo.modules.ApplicationLifecycleDispatcher
import expo.modules.ReactNativeHostWrapper

import android.app.Application
import android.content.Context
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactNativeHost
import com.facebook.react.ReactPackage
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.load
import com.facebook.react.defaults.DefaultReactNativeHost
import com.facebook.soloader.SoLoader
import com.oblador.keychain.KeychainModuleBuilder
import com.oblador.keychain.KeychainPackage
import io.branch.rnbranch.RNBranchModule
import me.rainbow.NativeModules.Haptics.RNHapticsPackage
import me.rainbow.NativeModules.Internals.InternalPackage
import me.rainbow.NativeModules.RNBackHandler.RNBackHandlerPackage
import me.rainbow.NativeModules.RNBip39.RNBip39Package
import me.rainbow.NativeModules.RNStartTime.RNStartTimePackage
import me.rainbow.NativeModules.RNTextAnimatorPackage.RNTextAnimatorPackage
import me.rainbow.NativeModules.RNZoomableButton.RNZoomableButtonPackage
import me.rainbow.NativeModules.SystemNavigationBar.SystemNavigationBarPackage
import me.rainbow.NativeModules.NavbarHeight.NavbarHeightPackage

class MainApplication : Application(), ReactApplication {
    override val reactNativeHost: ReactNativeHost = ReactNativeHostWrapper(this, object : DefaultReactNativeHost(this) {
        override fun getUseDeveloperSupport(): Boolean {
            return BuildConfig.DEBUG
        }

        override fun getPackages(): List<ReactPackage> {
            val packages: MutableList<ReactPackage> = PackageList(this).packages
            // Packages that cannot be autolinked yet can be added manually here, for example:
            packages.add(RNBip39Package())
            packages.add(SystemNavigationBarPackage())
            packages.add(RNBackHandlerPackage())
            packages.add(RNTextAnimatorPackage())
            packages.add(RNZoomableButtonPackage())
            packages.add(InternalPackage())
            packages.add(KeychainPackage(KeychainModuleBuilder().withoutWarmUp()))
            packages.add(RNStartTimePackage(START_MARK))
            packages.add(RNHapticsPackage())
            packages.add(NavbarHeightPackage())
            return packages
        }

        override fun getJSMainModuleName(): String {
            return ".expo/.virtual-metro-entry"
        }

        override val isNewArchEnabled: Boolean
            get() = BuildConfig.IS_NEW_ARCHITECTURE_ENABLED
        override val isHermesEnabled: Boolean
            get() = BuildConfig.IS_HERMES_ENABLED
    })

    override fun onCreate() {
        super.onCreate()
        appContext = this
        SoLoader.init(this,  /* native exopackage */false)
        if (BuildConfig.IS_NEW_ARCHITECTURE_ENABLED) {
            // If you opted-in for the New Architecture, we load the native entry point for this app.
            load()
        }
        // Branch logging for debugging
        RNBranchModule.enableLogging()
        RNBranchModule.getAutoInstance(this)
      ApplicationLifecycleDispatcher.onApplicationCreate(this)
  }

    companion object {
        private val START_MARK = System.currentTimeMillis()
        private lateinit var appContext: Context

        fun getAppContext(): Context = appContext
    }

  override fun onConfigurationChanged(newConfig: Configuration) {
    super.onConfigurationChanged(newConfig)
    ApplicationLifecycleDispatcher.onConfigurationChanged(this, newConfig)
  }
}