//
//  AppGroupStorage.m
//  Anchor
//
//  Created by Jason Moynihan on 1/16/26.
//

#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(AppGroupStorage, NSObject)

RCT_EXTERN_METHOD(
  getDeferredOrg:
  (RCTPromiseResolveBlock)resolve
  rejecter:
  (RCTPromiseRejectBlock)reject
)

RCT_EXTERN_METHOD(
  setDeferredOrg:
  (NSString *)org
  resolver:
  (RCTPromiseResolveBlock)resolve
  rejecter:
  (RCTPromiseRejectBlock)reject
)

RCT_EXTERN_METHOD(
  setWidgetData:
  (NSDictionary *)data
  resolver:
  (RCTPromiseResolveBlock)resolve
  rejecter:
  (RCTPromiseRejectBlock)reject
)

RCT_EXTERN_METHOD(
  clearWidgetData:
  (RCTPromiseResolveBlock)resolve
  rejecter:
  (RCTPromiseRejectBlock)reject
)

RCT_EXTERN_METHOD(
  reloadWidgetTimelines:
  (RCTPromiseResolveBlock)resolve
  rejecter:
  (RCTPromiseRejectBlock)reject
)

@end