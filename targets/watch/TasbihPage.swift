import SwiftUI
import WatchKit
import WidgetKit

private let phrases = ["Subhanallah", "Alhamdulillah", "Allahu akbar"]
private let closingPhrase = "La ilaha illallah"

@MainActor
final class TasbihModel: ObservableObject {
  @Published private(set) var state = TasbihState()
  @Published private(set) var offer: TasbihState? = TasbihSave.read()?.resumable(at: Date())

  var visibleOffer: TasbihState? { state.isUntouched ? offer : nil }

  func tap(nextAdhan: Date?) {
    guard !state.done else { return }
    let result = state.advance()
    switch result {
    case .done, .step: WKInterfaceDevice.current().play(.success)
    case .lap: WKInterfaceDevice.current().play(.directionUp)
    case .count: WKInterfaceDevice.current().play(.click)
    }
    offer = nil
    TasbihSave.write(state, nextAdhan: nextAdhan)
    if state.done { reloadComplication() }
  }

  func reset() {
    WKInterfaceDevice.current().play(.click)
    TasbihSave.clear()
    offer = nil
    state = TasbihState(mode: state.mode, goal: state.goal)
    reloadComplication()
  }

  func resume() {
    guard let offer else { return }
    WKInterfaceDevice.current().play(.click)
    state = offer
    self.offer = nil
  }

  func choose(mode: TasbihMode, goal: Int?) {
    state = TasbihState(mode: mode, goal: goal)
  }

  func reloadComplication() {
    WidgetCenter.shared.reloadTimelines(ofKind: tasbihComplicationKind)
  }
}

struct TasbihPage: View {
  @EnvironmentObject private var model: TasbihModel
  let nextAdhan: Date?
  @State private var choosing = false

  var body: some View {
    let state = model.state

    VStack(spacing: 6) {
      ZStack {
        Circle()
          .stroke(WatchColor.track, lineWidth: 8)
        if let target = state.target {
          Circle()
            .trim(from: 0, to: Double(state.count) / Double(target))
            .stroke(WatchColor.brand, style: StrokeStyle(lineWidth: 8, lineCap: .round))
            .rotationEffect(.degrees(-90))
            .animation(.easeOut(duration: 0.15), value: state.count)
        }
        VStack(spacing: 0) {
          Text("\(state.count)")
            .font(.system(size: 40, weight: .semibold, design: .rounded))
            .monospacedDigit()
            .foregroundStyle(WatchColor.ink)
          if let target = state.target {
            Text("av \(target)")
              .font(.caption2)
              .foregroundStyle(WatchColor.inkMuted)
          }
        }
      }
      .padding(.horizontal, 12)
      .frame(maxHeight: .infinity)
      .accessibilityElement(children: .combine)
      .accessibilityAddTraits(.isButton)
      .accessibilityAction { model.tap(nextAdhan: nextAdhan) }

      footer(for: state)
        .frame(minHeight: 36)
    }
    .contentShape(Rectangle())
    .onTapGesture { model.tap(nextAdhan: nextAdhan) }
    .toolbar {
      ToolbarItem(placement: .topBarLeading) {
        Button {
          model.reset()
        } label: {
          Image(systemName: "arrow.counterclockwise")
        }
        .accessibilityLabel("Nullstill")
      }
      ToolbarItem(placement: .topBarTrailing) {
        Button {
          choosing = true
        } label: {
          Image(systemName: "slider.horizontal.3")
        }
        .accessibilityLabel("Velg telling")
      }
    }
    .sheet(isPresented: $choosing) {
      ModePicker { mode, goal in
        model.choose(mode: mode, goal: goal)
        choosing = false
      }
    }
  }

  @ViewBuilder
  private func footer(for state: TasbihState) -> some View {
    if state.done {
      Button("Begynn på nytt") { model.reset() }
        .tint(WatchColor.brand)
    } else if let offer = model.visibleOffer {
      Button(offer.total.map { "Fortsett fra \(offer.progress) av \($0)" } ?? "Fortsett fra \(offer.progress)") {
        model.resume()
      }
      .font(.footnote)
      .tint(WatchColor.brand)
    } else {
      Text(caption(for: state))
        .font(.footnote.weight(.medium))
        .foregroundStyle(WatchColor.inkSecondary)
        .multilineTextAlignment(.center)
        .lineLimit(2)
        .minimumScaleFactor(0.7)
    }
  }

  private func caption(for state: TasbihState) -> String {
    switch state.mode {
    case .free:
      return state.goal == nil ? "Fri telling" : "Fri telling, mål \(state.goal ?? 0)"
    case .sequence:
      if state.isClosing { return closingPhrase }
      return phrases[min(state.step, phrases.count - 1)]
    }
  }
}

private struct ModePicker: View {
  let onPick: (TasbihMode, Int?) -> Void

  var body: some View {
    List {
      Button("Etter bønnen") { onPick(.sequence, 33) }
      Button("Fri telling, 33") { onPick(.free, 33) }
      Button("Fri telling, 100") { onPick(.free, 100) }
      Button("Fri telling, uten mål") { onPick(.free, nil) }
    }
  }
}
