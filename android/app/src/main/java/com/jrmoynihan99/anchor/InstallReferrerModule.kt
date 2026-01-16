package com.jrmoynihan99.anchor

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.Promise
import com.android.installreferrer.api.InstallReferrerClient
import com.android.installreferrer.api.InstallReferrerStateListener

class InstallReferrerModule(
  private val reactContext: ReactApplicationContext
) : ReactContextBaseJavaModule(reactContext) {

  override fun getName(): String {
    return "InstallReferrer"
  }

  @ReactMethod
  fun getDeferredOrg(promise: Promise) {
    val referrerClient = InstallReferrerClient
      .newBuilder(reactContext)
      .build()

    referrerClient.startConnection(object : InstallReferrerStateListener {

      override fun onInstallReferrerSetupFinished(responseCode: Int) {
        when (responseCode) {
          InstallReferrerClient.InstallReferrerResponse.OK -> {
            try {
              val referrerDetails = referrerClient.installReferrer
              val referrer = referrerDetails.installReferrer

              // Example referrer: "org=aletheia"
              val org = referrer
                ?.split("&")
                ?.mapNotNull {
                  val parts = it.split("=")
                  if (parts.size == 2 && parts[0] == "org") parts[1] else null
                }
                ?.firstOrNull()

              promise.resolve(org)
            } catch (e: Exception) {
              promise.resolve(null)
            } finally {
              referrerClient.endConnection()
            }
          }

          else -> {
            promise.resolve(null)
            referrerClient.endConnection()
          }
        }
      }

      override fun onInstallReferrerServiceDisconnected() {
        promise.resolve(null)
      }
    })
  }
}
