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
            let components = URLComponents(url: url, resolvingAgainstBaseURL: false),
            let orgValue = components.queryItems?.first(where: { $0.name == "org" })?.value
        else {
            return
        }

        org = orgValue

        let defaults = UserDefaults(suiteName: "group.com.jrmoynihan99.anchor")
        defaults?.set(orgValue, forKey: "pendingOrganization")
    }
}
