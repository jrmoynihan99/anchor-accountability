//
//  AppGroupStorage.swift
//  Anchor
//
//  Created by Jason Moynihan on 1/16/26.
//

import Foundation
import React
import WidgetKit

@objc(AppGroupStorage)
class AppGroupStorage: NSObject {

  private let suiteName = "group.com.jrmoynihan99.anchor"
  private let orgKey = "pendingOrganization"

  // Widget data keys
  private let widgetOrgIdKey = "widget_orgId"
  private let widgetOrgNameKey = "widget_orgName"
  private let widgetDeepLinkKey = "widget_deepLink"
  private let widgetUserIdKey = "widget_userId"
  private let widgetTokenKey = "widget_token"

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
  func setWidgetData(
    _ data: NSDictionary,
    resolver resolve: RCTPromiseResolveBlock,
    rejecter reject: RCTPromiseRejectBlock
  ) {
    let defaults = UserDefaults(suiteName: suiteName)
    if let orgId = data["orgId"] as? String {
      defaults?.set(orgId, forKey: widgetOrgIdKey)
    }
    if let orgName = data["orgName"] as? String {
      defaults?.set(orgName, forKey: widgetOrgNameKey)
    }
    if let deepLink = data["deepLink"] as? String {
      defaults?.set(deepLink, forKey: widgetDeepLinkKey)
    }
    if let userId = data["userId"] as? String {
      defaults?.set(userId, forKey: widgetUserIdKey)
    }
    if let widgetToken = data["widgetToken"] as? String {
      defaults?.set(widgetToken, forKey: widgetTokenKey)
    }
    resolve(true)
  }

  @objc
  func clearWidgetData(
    _ resolve: RCTPromiseResolveBlock,
    rejecter reject: RCTPromiseRejectBlock
  ) {
    let defaults = UserDefaults(suiteName: suiteName)
    [widgetOrgIdKey, widgetOrgNameKey, widgetDeepLinkKey,
     widgetUserIdKey, widgetTokenKey].forEach {
      defaults?.removeObject(forKey: $0)
    }
    resolve(true)
  }

  @objc
  func reloadWidgetTimelines(
    _ resolve: RCTPromiseResolveBlock,
    rejecter reject: RCTPromiseRejectBlock
  ) {
    if #available(iOS 14.0, *) {
      WidgetCenter.shared.reloadAllTimelines()
    }
    resolve(true)
  }

  @objc
  static func requiresMainQueueSetup() -> Bool {
    return false
  }
}
