import ActivityKit
import AppIntents
import SwiftUI
import WidgetKit

/// The activity has two phases and the view can tell them apart without the app: ActivityKit
/// reports `isStale` once the stale date - the end of the prayer's window - has passed, and
/// re-renders the view when it does.
///
/// That re-render is the only one the activity gets for free, so it is spent on the closing
/// line, and the successor lets a later render carry the card one prayer further than the app
/// managed to push. The successor only takes over once it has actually begun: Fajr's window
/// closes at soloppgang and Dhuhr is hours away, so hopping at soloppgang would announce a
/// prayer that has not started. Until then the card stays on the prayer still left unanswered
/// and names the next one as a time, not as the one running now.
private struct ActivityPhase {
  let isoDate: String
  let label: String
  let kind: String
  let prayerAt: Date
  let windowEnd: Date
  let windowOver: Bool
  let showMarkButtons: Bool
  /// Set once this window is over and the next prayer is still ahead of us.
  let upcoming: Successor?

  init(state: PrayerActivityAttributes.ContentState, isStale: Bool) {
    let now = Date()
    let successor = Successor(state: state)
    let successorStarted = successor.map { now >= $0.prayerAt } ?? false

    if isStale, let successor, successorStarted {
      isoDate = successor.isoDate
      label = successor.label
      kind = successor.kind
      prayerAt = successor.prayerAt
      windowEnd = successor.windowEnd
      windowOver = now >= successor.windowEnd
      upcoming = nil
    } else {
      isoDate = state.isoDate
      label = state.prayerLabel
      kind = state.prayerKind
      prayerAt = state.prayerAt
      windowEnd = state.windowEnd
      windowOver = isStale || now >= state.windowEnd
      upcoming = windowOver ? successor : nil
    }

    showMarkButtons = state.showMarkButtons ?? true
  }

  var question: String { "Har du bedt \(label)?" }
  var statusLine: String { windowOver ? "\(label)-tiden er over" : "Går ut om" }
  var upcomingLine: String? {
    guard let upcoming else { return nil }
    return "\(upcoming.label) \(PrayerFormat.time(upcoming.prayerAt))"
  }
  var progress: ClosedRange<Date> { PrayerFormat.progressRange(from: prayerAt, to: windowEnd) }
  var countdown: ClosedRange<Date> { PrayerFormat.countdownRange(to: windowEnd) }
}

private struct Successor {
  let isoDate: String
  let label: String
  let kind: String
  let prayerAt: Date
  let windowEnd: Date

  init?(state: PrayerActivityAttributes.ContentState) {
    guard
      let kind = state.nextKind, !kind.isEmpty,
      let isoDate = state.nextIsoDate,
      let label = state.nextLabel,
      let prayerAt = state.nextAt,
      let windowEnd = state.nextWindowEnd
    else { return nil }

    self.isoDate = isoDate
    self.label = label
    self.kind = kind
    self.prayerAt = prayerAt
    self.windowEnd = windowEnd
  }
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
            Text(phase.windowOver ? "Ubesvart" : "Nå")
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
          VStack(spacing: 8) {
            HStack {
              Text(phase.statusLine)
                .font(.caption)
                .foregroundStyle(PrayerColor.inkSecondary)
              Spacer(minLength: 8)
              if !phase.windowOver {
                Text(timerInterval: phase.countdown, countsDown: true)
                  .prayerTime(.caption)
                  .foregroundStyle(PrayerColor.inkSecondary)
                  .frame(maxWidth: 76, alignment: .trailing)
              } else if let upcoming = phase.upcomingLine {
                Text("Neste: \(upcoming)")
                  .font(.caption)
                  .foregroundStyle(PrayerColor.inkSecondary)
                  .lineLimit(1)
              }
            }

            if phase.showMarkButtons {
              MarkButtons(phase: phase)
            }
          }
        }
      } compactLeading: {
        Image(systemName: PrayerFormat.symbol(for: phase.kind))
          .foregroundStyle(PrayerColor.brand)
      } compactTrailing: {
        CompactStatus(phase: phase)
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

/// A timer range whose end is in the past traps, so the compact view swaps to the prayer's own
/// time once the window has closed.
private struct CompactStatus: View {
  let phase: ActivityPhase

  var body: some View {
    if phase.windowOver {
      Text(PrayerFormat.time(phase.prayerAt))
    } else {
      Text(timerInterval: phase.countdown, countsDown: true)
    }
  }
}

private struct MarkButtons: View {
  let phase: ActivityPhase

  var body: some View {
    HStack(spacing: 8) {
      Button(
        intent: MarkPrayerIntent(isoDate: phase.isoDate, prayer: phase.kind, status: "prayed")
      ) {
        Label("Bedt", systemImage: "checkmark")
          .font(.subheadline.weight(.semibold))
          .frame(maxWidth: .infinity)
      }
      .buttonStyle(.borderedProminent)
      .tint(PrayerColor.brand)

      Button(
        intent: MarkPrayerIntent(isoDate: phase.isoDate, prayer: phase.kind, status: "skipped")
      ) {
        Text("Hopp over")
          .font(.subheadline)
          .frame(maxWidth: .infinity)
      }
      .buttonStyle(.bordered)
      .tint(PrayerColor.inkMuted)
    }
    .foregroundStyle(PrayerColor.ink)
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

        Spacer(minLength: 8)

        Text(PrayerFormat.time(phase.prayerAt))
          .prayerTime(.system(.title, design: .default).weight(.bold))
          .foregroundStyle(PrayerColor.ink)
      }

      if phase.showMarkButtons {
        Text(phase.question)
          .font(.subheadline)
          .foregroundStyle(PrayerColor.inkSecondary)
      }

      if !phase.windowOver {
        ProgressView(
          timerInterval: phase.progress,
          countsDown: false,
          label: { EmptyView() },
          currentValueLabel: { EmptyView() }
        )
        .tint(PrayerColor.brand)
      } else if let upcoming = phase.upcomingLine {
        Text("Neste: \(upcoming)")
          .font(.subheadline)
          .foregroundStyle(PrayerColor.inkSecondary)
          .lineLimit(1)
      }

      HStack(spacing: 5) {
        Text(phase.statusLine)
          .font(.caption)
          .foregroundStyle(PrayerColor.inkMuted)
        if !phase.windowOver {
          Text(timerInterval: phase.countdown, countsDown: true)
            .prayerTime(.caption)
            .fontWeight(.medium)
            .foregroundStyle(PrayerColor.inkSecondary)
        }
        Spacer(minLength: 8)
        Text(locationName)
          .font(.caption)
          .foregroundStyle(PrayerColor.inkMuted)
          .lineLimit(1)
      }

      if phase.showMarkButtons {
        MarkButtons(phase: phase)
          .padding(.top, 2)
      }
    }
    .padding(14)
  }
}
