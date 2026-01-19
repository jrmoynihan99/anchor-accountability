//
//  AppGroupStorage.swift
//  Anchor
//
//  Created by Jason Moynihan on 1/16/26.
//

import Foundation
import React

@objc(AppGroupStorage)
class AppGroupStorage: NSObject {

  private let suiteName = "group.com.jrmoynihan99.anchor"
  private let orgKey = "pendingOrganization"

  @objc
  func getDeferredOrg(
    _ resolve: RCTPromiseResolveBlock,
    rejecter reject: RCTPromiseRejectBlock
  ) {
    let defaults = UserDefaults(suiteName: suiteName)
    let org = defaults?.string(forKey: orgKey)

    // Clear it after reading (so it only works once)
    if org != nil {
      defaults?.removeObject(forKey: orgKey)
    }
    
    resolve(org)
  }

  @objc
  func setDeferredOrg(
    _ org: String,
    resolver resolve: RCTPromiseResolveBlock,
    rejecter reject: RCTPromiseRejectBlock
  ) {
    let defaults = UserDefaults(suiteName: suiteName)
    defaults?.set(org, forKey: orgKey)
    resolve(true)
  }

  @objc
  static func requiresMainQueueSetup() -> Bool {
    return false
  }
}