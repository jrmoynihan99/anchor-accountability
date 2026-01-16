//
//  ContentView.swift
//  AnchorClip
//
//  Created by Jason Moynihan on 1/16/26.
//

import SwiftUI
import UIKit

struct ContentView: View {

    let org: String?
    @State private var didAttemptOpen = false

    var body: some View {
        VStack(spacing: 16) {
            Spacer()

            Text("Anchor")
                .font(.largeTitle)
                .fontWeight(.bold)

            if let org {
                Text("Join \(org.capitalized)")
                    .font(.headline)
            }

            Button(action: openAppStore) {
                Text("Download Anchor")
                    .font(.headline)
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(Color.black)
                    .foregroundColor(.white)
                    .cornerRadius(12)
            }
            .padding(.horizontal)

            Spacer()
        }
        .padding()
        .onAppear {
            attemptOpenAppIfInstalledOnce()
        }
    }

    private func attemptOpenAppIfInstalledOnce() {
        guard !didAttemptOpen else { return }
        didAttemptOpen = true

        let appURL = URL(string: "anchor://join")!
        if UIApplication.shared.canOpenURL(appURL) {
            UIApplication.shared.open(appURL)
        }
    }

    private func openAppStore() {
        let appStoreURL = URL(string: "https://apps.apple.com/app/anchor-quit-porn-together/id6752869901")!
        UIApplication.shared.open(appStoreURL)
    }
}
