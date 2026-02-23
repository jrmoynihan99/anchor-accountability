import SwiftUI
import WidgetKit
import AppIntents

struct ReachOutWidgetView: View {
    let entry: ReachOutEntry

    // Brand colors (Warm & Earthy palette)
    private let brandTan = Color(red: 0.796, green: 0.678, blue: 0.553)       // #CBAD8D
    private let brandBrown = Color(red: 0.227, green: 0.176, blue: 0.157)     // #3A2D28
    private let brandRosewood = Color(red: 0.643, green: 0.514, blue: 0.455)  // #A48374

    var body: some View {
        if !entry.isConfigured {
            unconfiguredView
        } else if entry.lastPleaSentAt != nil {
            confirmationView
        } else if entry.isRateLimited {
            rateLimitedView
        } else {
            buttonView
        }
    }

    // MARK: - States

    private var buttonView: some View {
        Button(intent: ReachOutIntent()) {
            VStack(spacing: 8) {
                Image(systemName: "hand.raised.fill")
                    .font(.system(size: 32))
                    .foregroundStyle(brandTan)
                Text("Reach Out")
                    .font(.headline)
                    .fontWeight(.bold)
                    .foregroundStyle(.primary)
                Text("Get support now")
                    .font(.caption2)
                    .foregroundStyle(.secondary)
            }
        }
        .buttonStyle(.plain)
        .containerBackground(.fill.tertiary, for: .widget)
    }

    private var confirmationView: some View {
        VStack(spacing: 8) {
            Image(systemName: "checkmark.circle.fill")
                .font(.system(size: 40))
                .foregroundStyle(.green)
            Text("Sent")
                .font(.headline)
                .fontWeight(.bold)
                .foregroundStyle(.primary)
            Text("Your community is praying")
                .font(.caption2)
                .foregroundStyle(.secondary)
        }
        .containerBackground(.fill.tertiary, for: .widget)
    }

    private var rateLimitedView: some View {
        VStack(spacing: 8) {
            Image(systemName: "clock.fill")
                .font(.system(size: 28))
                .foregroundStyle(brandRosewood)
            Text("Please wait")
                .font(.subheadline)
                .fontWeight(.medium)
                .foregroundStyle(.primary)
            Text("Try again in a few minutes")
                .font(.caption2)
                .foregroundStyle(.secondary)
        }
        .containerBackground(.fill.tertiary, for: .widget)
    }

    private var unconfiguredView: some View {
        VStack(spacing: 8) {
            Image(systemName: "hand.raised.fill")
                .font(.title)
                .foregroundStyle(brandTan)
            Text("Open Anchor to set up")
                .font(.caption)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
        }
        .padding()
        .containerBackground(.fill.tertiary, for: .widget)
    }
}
