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

    // Animation stages
    // 0 = org + progress ring
    // 1 = checkmark (replaces org text, ring stays)
    // 2 = app icon (ring and checkmark fade out)
    @State private var stage: Int = 0
    @State private var progress: CGFloat = 0
    @State private var didAttemptOpen = false

    var body: some View {
        VStack(spacing: 28) {
            Spacer()

            // MARK: - Animated Header
            ZStack {
                if stage < 2 {
                    // Background ring
                    Circle()
                        .stroke(Color.secondary.opacity(0.2), lineWidth: 2)
                        .frame(width: 140, height: 140)

                    // Progress ring
                    Circle()
                        .trim(from: 0, to: progress)
                        .stroke(
                            Color.primary,
                            style: StrokeStyle(lineWidth: 2, lineCap: .round)
                        )
                        .rotationEffect(.degrees(-90))
                        .frame(width: 140, height: 140)
                }

                if stage == 0 {
                    // Org name
                    HStack(spacing: 6) {
                        Image(systemName: "building.2.fill")
                            .font(.system(size: 14, weight: .semibold))
                            .foregroundColor(.primary)

                        Text(org?.capitalized ?? "Your Church")
                            .font(.system(size: 18, weight: .semibold))
                            .multilineTextAlignment(.leading)
                            .foregroundColor(.primary)
                            .lineLimit(2)
                            .minimumScaleFactor(0.75)
                    }
                    .frame(width: 100)
                    .transition(.opacity)
                }

                if stage == 1 {
                    Image(systemName: "checkmark")
                        .font(.system(size: 36, weight: .semibold))
                        .foregroundColor(.primary)
                        .transition(.opacity)
                }

                if stage == 2 {
                    Image("AppIconImage")
                        .resizable()
                        .aspectRatio(contentMode: .fit)
                        .frame(width: 100, height: 100)
                        .cornerRadius(22)
                        .shadow(
                            color: Color.black.opacity(0.15),
                            radius: 8,
                            x: 0,
                            y: 4
                        )
                        .transition(.scale.combined(with: .opacity))
                }
            }
            .animation(.easeInOut(duration: 0.45), value: stage)

            // MARK: - Title + Copy
            VStack(spacing: 10) {
                Text("Anchor | Quit Porn Together")
                    .font(.system(size: 20, weight: .semibold))
                    .multilineTextAlignment(.center)

                if let org {
                    Text("This link will automatically connect you to ")
                        .font(.system(size: 15))
                        .foregroundColor(.secondary)
                    + Text(org.capitalized)
                        .font(.system(size: 15, weight: .bold))
                        .foregroundColor(.secondary)
                    + Text(" when you install the app.")
                        .font(.system(size: 15))
                        .foregroundColor(.secondary)
                } else {
                    Text("This link will automatically connect you to the right community when you install the app.")
                        .font(.system(size: 15))
                        .foregroundColor(.secondary)
                }
            }
            .multilineTextAlignment(.center)
            .padding(.horizontal, 24)
            .opacity(stage >= 2 ? 1 : 0)
            .animation(.easeInOut(duration: 0.4), value: stage)

            Spacer()

            // MARK: - App Store Button
            Button(action: openAppStore) {
                Text("Get on App Store")
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
            runIntroAnimation()
        }
    }

    // MARK: - Animation Driver
    private func runIntroAnimation() {

        // 1️⃣ Fill progress ring (org confirmation)
        withAnimation(
            .timingCurve(0.4, 0.0, 0.2, 1.0, duration: 1.2)
        ) {
            progress = 1.0
        }

        // 2️⃣ Org name fades out, checkmark fades in (ring stays)
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.4) {
            withAnimation {
                stage = 1
            }
        }

        // 3️⃣ Ring and checkmark fade out, app icon fades in
        DispatchQueue.main.asyncAfter(deadline: .now() + 2.2) {
            withAnimation {
                stage = 2
            }
        }
    }

    // MARK: - Open Main App if Installed
    private func attemptOpenAppIfInstalledOnce() {
        guard !didAttemptOpen else { return }
        didAttemptOpen = true

        let appURL = URL(string: "anchor://join")!
        if UIApplication.shared.canOpenURL(appURL) {
            UIApplication.shared.open(appURL)
        }
    }

    // MARK: - Open App Store
    private func openAppStore() {
        let appStoreURL = URL(
            string: "https://apps.apple.com/app/anchor-quit-porn-together/id6752869901"
        )!
        UIApplication.shared.open(appStoreURL)
    }
}
