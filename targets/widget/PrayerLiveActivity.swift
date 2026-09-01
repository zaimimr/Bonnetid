import ActivityKit
import SwiftUI
import WidgetKit

struct PrayerLiveActivity: Widget {
  var body: some WidgetConfiguration {
    ActivityConfiguration(for: PrayerActivityAttributes.self) { context in
      LockScreenActivityView(attributes: context.attributes, state: context.state)
        .activityBackgroundTint(PrayerColor.surface)
        .activitySystemActionForegroundColor(PrayerColor.brand)
    } dynamicIsland: { context in
      DynamicIsland {
        DynamicIslandExpandedRegion(.leading) {
          VStack(alignment: .leading, spacing: 1) {
            Text(context.state.isNow ? "Nå" : "Neste")
              .font(.caption2)
              .foregroundStyle(PrayerColor.inkMuted)
            Text(context.state.prayerLabel)
              .font(.headline)
              .foregroundStyle(PrayerColor.brand)
          }
        }

        DynamicIslandExpandedRegion(.trailing) {
          VStack(alignment: .trailing, spacing: 1) {
            Text(PrayerFormat.time(context.state.prayerAt))
              .prayerTime(.system(size: 20, weight: .bold))
              .foregroundStyle(PrayerColor.ink)
            Text(context.attributes.locationName)
              .font(.caption2)
              .foregroundStyle(PrayerColor.inkMuted)
              .lineLimit(1)
          }
        }

        DynamicIslandExpandedRegion(.bottom) {
          VStack(spacing: 5) {
            ProgressView(
              timerInterval: context.state.windowStart...context.state.windowEnd,
              countsDown: false,
              label: { EmptyView() },
              currentValueLabel: { EmptyView() }
            )
            .tint(PrayerColor.brand)

            HStack {
              Text(context.state.isNow ? "\(context.state.prayerLabel) har begynt" : "Til \(context.state.prayerLabel)")
                .font(.caption)
                .foregroundStyle(PrayerColor.inkSecondary)
              Spacer(minLength: 8)
              Text(timerInterval: Date()...context.state.windowEnd, countsDown: true)
                .prayerTime(.caption)
                .foregroundStyle(PrayerColor.inkSecondary)
                .frame(maxWidth: 76, alignment: .trailing)
            }
          }
        }
      } compactLeading: {
        Image(systemName: PrayerFormat.symbol(for: context.state.prayerKind))
          .foregroundStyle(PrayerColor.brand)
      } compactTrailing: {
        Text(timerInterval: Date()...context.state.windowEnd, countsDown: true)
          .prayerTime(.caption2)
          .foregroundStyle(PrayerColor.brand)
          .frame(maxWidth: 54)
      } minimal: {
        Image(systemName: PrayerFormat.symbol(for: context.state.prayerKind))
          .foregroundStyle(PrayerColor.brand)
      }
      .widgetURL(URL(string: "bonnetid://"))
      .keylineTint(PrayerColor.brand)
    }
  }
}

private struct LockScreenActivityView: View {
  let attributes: PrayerActivityAttributes
  let state: PrayerActivityAttributes.ContentState

  var body: some View {
    VStack(alignment: .leading, spacing: 8) {
      HStack(alignment: .firstTextBaseline, spacing: 8) {
        Image(systemName: PrayerFormat.symbol(for: state.prayerKind))
          .font(.subheadline)
          .foregroundStyle(PrayerColor.brand)

        Text(state.prayerLabel)
          .font(.title3)
          .fontWeight(.bold)
          .foregroundStyle(PrayerColor.brand)

        Text(state.isNow ? "har begynt" : "")
          .font(.subheadline)
          .foregroundStyle(PrayerColor.inkSecondary)

        Spacer(minLength: 8)

        Text(PrayerFormat.time(state.prayerAt))
          .prayerTime(.system(size: 26, weight: .bold))
          .foregroundStyle(PrayerColor.ink)
      }

      ProgressView(
        timerInterval: state.windowStart...state.windowEnd,
        countsDown: false,
        label: { EmptyView() },
        currentValueLabel: { EmptyView() }
      )
      .tint(PrayerColor.brand)

      HStack {
        Text(state.isNow ? "\(state.nextLabel) om" : "Begynner om")
          .font(.caption)
          .foregroundStyle(PrayerColor.inkMuted)
        Text(timerInterval: Date()...state.windowEnd, countsDown: true)
          .prayerTime(.caption)
          .fontWeight(.medium)
          .foregroundStyle(PrayerColor.inkSecondary)
        Spacer(minLength: 8)
        Text(attributes.locationName)
          .font(.caption)
          .foregroundStyle(PrayerColor.inkMuted)
          .lineLimit(1)
      }
    }
    .padding(14)
  }
}
