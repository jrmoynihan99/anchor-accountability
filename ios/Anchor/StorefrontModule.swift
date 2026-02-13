//
//  StorefrontModule.swift
//  Anchor
//

import Foundation
import React
import StoreKit

@objc(StorefrontModule)
class StorefrontModule: NSObject {

  @objc
  func getCountryCode(
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    if #available(iOS 15.0, *) {
      Task {
        let storefront = await Storefront.current
        resolve(storefront?.countryCode)
      }
    } else {
      resolve(nil)
    }
  }

  @objc
  static func requiresMainQueueSetup() -> Bool {
    return false
  }
}
