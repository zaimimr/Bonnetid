import AVFoundation
import ExpoModulesCore

private final class PreviewPlayer: NSObject, AVAudioPlayerDelegate {
  static let shared = PreviewPlayer()

  private var player: AVAudioPlayer?

  func play(name: String) {
    guard let url = Bundle.main.url(forResource: name, withExtension: "wav") else {
      return
    }
    stop()
    let session = AVAudioSession.sharedInstance()
    try? session.setCategory(.playback, mode: .default)
    try? session.setActive(true)
    guard let player = try? AVAudioPlayer(contentsOf: url) else {
      return
    }
    player.delegate = self
    self.player = player
    player.play()
  }

  func stop() {
    player?.stop()
    player = nil
    releaseSession()
  }

  func audioPlayerDidFinishPlaying(_ player: AVAudioPlayer, successfully flag: Bool) {
    self.player = nil
    releaseSession()
  }

  private func releaseSession() {
    try? AVAudioSession.sharedInstance().setActive(false, options: .notifyOthersOnDeactivation)
  }
}

public class SoundPreviewModule: Module {
  public func definition() -> ModuleDefinition {
    Name("SoundPreview")

    Function("play") { (name: String) in
      DispatchQueue.main.async {
        PreviewPlayer.shared.play(name: name)
      }
    }

    Function("stop") {
      DispatchQueue.main.async {
        PreviewPlayer.shared.stop()
      }
    }
  }
}
