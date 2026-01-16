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

  @objc
  func get(_ key: String,
           resolver resolve: @escaping RCTPromiseResolveBlock,
           rejecter reject: @escaping RCTPromiseRejectBlock) {

    guard let defaults = UserDefaults(suiteName: suiteName) else {
      resolve(nil)
      return
    }

    resolve(defaults.string(forKey: key))
  }

  @objc
  func clear(_ key: String,
             resolver resolve: @escaping RCTPromiseResolveBlock,
             rejecter reject: @escaping RCTPromiseRejectBlock) {

    guard let defaults = UserDefaults(suiteName: suiteName) else {
      resolve(nil)
      return
    }

    defaults.removeObject(forKey: key)
    resolve(nil)
  }

  @objc
  static func requiresMainQueueSetup() -> Bool {
    return false
  }
}
