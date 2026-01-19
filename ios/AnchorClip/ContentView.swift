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
        VStack(spacing: 24) {
            Spacer()
            
            // App Icon
            Image("AppIconImage")
                .resizable()
                .aspectRatio(contentMode: .fit)
                .frame(width: 100, height: 100)
                .cornerRadius(22)
                .shadow(color: Color.black.opacity(0.15), radius: 8, x: 0, y: 4)
            
            VStack(spacing: 8) {
                // App Name with tagline
                Text("Anchor | Quit Porn Together")
                    .font(.system(size: 20, weight: .semibold))
                    .multilineTextAlignment(.center)
                
                // Body text with conditional org
                if let org {
                    Text("You're joining Anchor through ")
                        .font(.system(size: 15))
                        .foregroundColor(.secondary)
                    + Text(org.capitalized)
                        .font(.system(size: 15, weight: .bold))
                        .foregroundColor(.secondary)
                    + Text(", download below.")
                        .font(.system(size: 15))
                        .foregroundColor(.secondary)
                } else {
                    Text("Download below")
                        .font(.system(size: 15))
                        .foregroundColor(.secondary)
                }
            }
            .multilineTextAlignment(.center)
            .padding(.horizontal, 20)
            
            Spacer()
            
            // Download Button
            Button(action: openAppStore) {
                Text("Get")
                    .font(.system(size: 17, weight: .semibold))
                    .frame(maxWidth: .infinity)
                    .frame(height: 50)
                    .background(Color(red: 0.796, green: 0.678, blue: 0.553))
                    .foregroundColor(.white)
                    .cornerRadius(12)
            }
            .padding(.horizontal, 40)
            .padding(.bottom, 50)
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
