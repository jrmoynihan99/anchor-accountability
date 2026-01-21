//
//  AnchorClipApp.swift
//  AnchorClip
//
//  Created by Jason Moynihan on 1/16/26.
//

import SwiftUI

@main
struct AnchorClipApp: App {

    @State private var org: String? = nil

    var body: some Scene {
        WindowGroup {
            ContentView(org: org)
                .onContinueUserActivity(NSUserActivityTypeBrowsingWeb) { activity in
                    handleInvocation(activity)
                }
        }
    }

    private func handleInvocation(_ activity: NSUserActivity) {
        guard
            let url = activity.webpageURL,
            let components = URLComponents(url: url, resolvingAgainstBaseURL: false)
        else {
            return
        }

        let orgValue = components.queryItems?.first(where: { $0.name == "org" })?.value
        let nameValue = components.queryItems?.first(where: { $0.name == "name" })?.value
        
        // Use display name if provided, otherwise fall back to org ID
        org = nameValue?.replacingOccurrences(of: "_", with: " ") ?? orgValue

        // Still save the org ID (not the display name) to UserDefaults
        if let orgValue = orgValue {
            let defaults = UserDefaults(suiteName: "group.com.jrmoynihan99.anchor")
            defaults?.set(orgValue, forKey: "pendingOrganization")
        }
    }
}
