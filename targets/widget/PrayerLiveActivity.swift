import ActivityKit
import SwiftUI
import WidgetKit

/// Two phases, and the view can tell them apart on its own: the app sets `isNow` when it is
/// open past the prayer time, and ActivityKit reports `isStale` once the phase's end date has
/// passed, which covers the case where the app was never reopened.
private struct ActivityPhase {
    let hasStarted: Bool
    let label: String
    let kind: String
    let prayerAt: Date
    let progress: ClosedRange<Date>
    let countdownTo: Date

    init(state: PrayerActivityAttributes.ContentState, isStale: Bool) {
        hasStarted = state.isNow || isStale
        label = state.prayerLabel
        kind = state.prayerKind
        prayerAt = state.prayerAt
        progress = PrayerFormat.progressRange(from: state.windowStart, to: state.windowEnd)
        countdownTo = state.windowEnd
    }

    var stateLabel: String { hasStarted ? "Nå" : "Neste" }
}

struct PrayerLiveActivity: Widget {
  var body: some WidgetConfiguration {
    ActivityConfiguration(for: PrayerActivityAttributes.self) { context in
      LockScreenActivityView(
        locationName: context.attributes.locationName,
        phase: ActivityPhase(state: context.state, isStale: context.isStale)
      )
      .activityBackgroundTint(PrayerColor.surface)
      .activitySystemActionForegroundColor(PrayerColor.brand)
    } dynamicIsland: { context in
      let phase = ActivityPhase(state: context.state, isStale: context.isStale)

      return DynamicIsland {
        DynamicIslandExpandedRegion(.leading) {
          VStack(alignment: .leading, spacing: 1) {
            Text(phase.stateLabel)
              .font(.caption2)
              .foregroundStyle(PrayerColor.inkMuted)
            Text(phase.label)
              .font(.headline)
              .foregroundStyle(PrayerColor.brand)
          }
        }

        DynamicIslandExpandedRegion(.trailing) {
          VStack(alignment: .trailing, spacing: 1) {
            Text(PrayerFormat.time(phase.prayerAt))
              .prayerTime(.system(.title3, design: .default).weight(.bold))
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
              timerInterval: phase.progress,
              countsDown: false,
              label: { EmptyView() },
              currentValueLabel: { EmptyView() }
            )
            .tint(PrayerColor.brand)

            HStack {
              Text(phase.hasStarted ? "\(phase.label) har begynt" : "Begynner om")
                .font(.caption)
                .foregroundStyle(PrayerColor.inkSecondary)
              Spacer(minLength: 8)
              PhaseTimer(phase: phase)
                .prayerTime(.caption)
                .foregroundStyle(PrayerColor.inkSecondary)
                .frame(maxWidth: 76, alignment: .trailing)
            }
          }
        }
      } compactLeading: {
        Image(systemName: PrayerFormat.symbol(for: phase.kind))
          .foregroundStyle(PrayerColor.brand)
      } compactTrailing: {
        PhaseTimer(phase: phase)
          .prayerTime(.caption2)
          .foregroundStyle(PrayerColor.brand)
          .frame(maxWidth: 54)
      } minimal: {
        Image(systemName: PrayerFormat.symbol(for: phase.kind))
          .foregroundStyle(PrayerColor.brand)
      }
      .widgetURL(URL(string: "bonnetid://"))
      .keylineTint(PrayerColor.brand)
    }
  }
}

/// Counts down to the prayer, then counts up from it.
private struct PhaseTimer: View {
  let phase: ActivityPhase

  var body: some View {
    if phase.hasStarted {
      Text(
        timerInterval: PrayerFormat.progressRange(from: phase.prayerAt, to: phase.countdownTo),
        countsDown: false
      )
    } else {
      Text(timerInterval: PrayerFormat.countdownRange(to: phase.prayerAt), countsDown: true)
    }
  }
}

private struct LockScreenActivityView: View {
  let locationName: String
  let phase: ActivityPhase

  var body: some View {
    VStack(alignment: .leading, spacing: 8) {
      HStack(alignment: .firstTextBaseline, spacing: 8) {
        Image(systemName: PrayerFormat.symbol(for: phase.kind))
          .font(.subheadline)
          .foregroundStyle(PrayerColor.brand)

        Text(phase.label)
          .font(.title3)
          .fontWeight(.bold)
          .foregroundStyle(PrayerColor.brand)

        if phase.hasStarted {
          Text("har begynt")
            .font(.subheadline)
            .foregroundStyle(PrayerColor.inkSecondary)
        }

        Spacer(minLength: 8)

        Text(PrayerFormat.time(phase.prayerAt))
          .prayerTime(.system(.title, design: .default).weight(.bold))
          .foregroundStyle(PrayerColor.ink)
      }

      ProgressView(
        timerInterval: phase.progress,
        countsDown: false,
        label: { EmptyView() },
        currentValueLabel: { EmptyView() }
      )
      .tint(PrayerColor.brand)

      HStack(spacing: 5) {
        Text(phase.hasStarted ? "Begynte for" : "Begynner om")
          .font(.caption)
          .foregroundStyle(PrayerColor.inkMuted)
        PhaseTimer(phase: phase)
          .prayerTime(.caption)
          .fontWeight(.medium)
          .foregroundStyle(PrayerColor.inkSecondary)
        Spacer(minLength: 8)
        Text(locationName)
          .font(.caption)
          .foregroundStyle(PrayerColor.inkMuted)
          .lineLimit(1)
      }
    }
    .padding(14)
  }
}
