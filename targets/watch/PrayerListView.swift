import SwiftUI

enum WatchColor {
  static let brand = Color(hex: 0x6FBA9D)
  static let brandPlate = Color(hex: 0x27362F)
  static let onBrandPlate = Color(hex: 0xD3EAE0)
  static let ink = Color(hex: 0xF6F8F7)
  static let inkSecondary = Color(hex: 0xC6D0CB)
  static let inkMuted = Color(hex: 0x8C9A93)
}

private extension Color {
  init(hex: UInt32) {
    self.init(
      red: Double((hex >> 16) & 0xFF) / 255,
      green: Double((hex >> 8) & 0xFF) / 255,
      blue: Double(hex & 0xFF) / 255
    )
  }
}

struct PrayerListView: View {
  let snapshot: PrayerSnapshot?

  var body: some View {
    if let snapshot {
      TimelineView(.everyMinute) { context in
        PrayerDayView(snapshot: snapshot, now: context.date)
      }
    } else {
      VStack(spacing: 8) {
        Image(systemName: "moon.stars")
          .font(.title2)
          .foregroundStyle(WatchColor.brand)
        Text("Åpne Bønnetid på iPhone for å hente tidene")
          .font(.footnote)
          .multilineTextAlignment(.center)
          .foregroundStyle(WatchColor.inkSecondary)
      }
      .padding()
    }
  }
}

private struct PrayerDayView: View {
  let snapshot: PrayerSnapshot
  let now: Date

  var body: some View {
    let moment = PrayerMoment.resolve(from: snapshot, at: now)
    let prayers = snapshot.dailyPrayers(for: moment?.next.at ?? now, now: now)

    ScrollView {
      VStack(alignment: .leading, spacing: 6) {
        VStack(alignment: .leading, spacing: 0) {
          Text(snapshot.locationName)
            .font(.footnote)
            .foregroundStyle(WatchColor.inkSecondary)
            .lineLimit(1)
          if let mosqueName = snapshot.mosqueName {
            Text(mosqueName)
              .font(.caption2)
              .foregroundStyle(WatchColor.inkMuted)
              .lineLimit(2)
          }
        }

        if let next = moment?.next {
          NextPrayerCard(prayer: next, now: now)
        }

        ForEach(prayers, id: \.at) { prayer in
          PrayerRow(prayer: prayer, isNext: prayer.at == moment?.next.at)
        }
      }
    }
  }
}

private struct NextPrayerCard: View {
  let prayer: PrayerEntry
  let now: Date

  var body: some View {
    VStack(alignment: .leading, spacing: 2) {
      HStack(spacing: 4) {
        Image(systemName: PrayerFormat.symbol(for: prayer.kind))
          .font(.caption)
        Text("Neste: \(prayer.printedLabel)")
          .font(.headline)
          .lineLimit(1)
      }
      .foregroundStyle(WatchColor.brand)

      Text(timerInterval: PrayerFormat.countdownRange(to: prayer.at, from: now), countsDown: true)
        .prayerTime(.system(.title2).weight(.semibold))
        .foregroundStyle(WatchColor.ink)

      if let jamat = prayer.jamat {
        Text("Jamat \(PrayerFormat.time(jamat))")
          .prayerTime(.caption)
          .foregroundStyle(WatchColor.inkSecondary)
      }
    }
    .padding(.vertical, 4)
  }
}

private struct PrayerRow: View {
  let prayer: PrayerEntry
  let isNext: Bool

  var body: some View {
    HStack(spacing: 6) {
      Image(systemName: PrayerFormat.symbol(for: prayer.kind))
        .font(.caption2)
        .foregroundStyle(isNext ? WatchColor.onBrandPlate : WatchColor.brand)
        .frame(width: 16)
      Text(prayer.printedLabel)
        .font(.body)
        .lineLimit(1)
        .minimumScaleFactor(0.8)
      Spacer(minLength: 4)
      VStack(alignment: .trailing, spacing: 0) {
        Text(PrayerFormat.time(prayer.at))
          .prayerTime(.body.weight(isNext ? .bold : .regular))
        if let jamat = prayer.jamat {
          Text(PrayerFormat.time(jamat))
            .prayerTime(.caption2)
            .foregroundStyle(isNext ? WatchColor.onBrandPlate : WatchColor.brand)
        }
      }
    }
    .foregroundStyle(isNext ? WatchColor.onBrandPlate : WatchColor.ink)
    .padding(.vertical, 5)
    .padding(.horizontal, 8)
    .background(
      RoundedRectangle(cornerRadius: 10, style: .continuous)
        .fill(isNext ? WatchColor.brandPlate : Color.clear)
    )
  }
}

extension View {
  func prayerTime(_ font: Font) -> some View {
    self.font(font).monospacedDigit()
  }
}
