package no.irn.bonnetid.sound

import android.content.Context
import android.media.MediaPlayer
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class SoundPreviewModule : Module() {
  private var player: MediaPlayer? = null

  override fun definition() = ModuleDefinition {
    Name("SoundPreview")

    Function("play") { name: String ->
      val context = appContext.reactContext ?: return@Function
      start(context, name)
    }

    Function("stop") {
      stopPlayback()
    }

    OnDestroy {
      stopPlayback()
    }
  }

  private fun start(context: Context, name: String) {
    stopPlayback()
    val resourceId = context.resources.getIdentifier(name, "raw", context.packageName)
    if (resourceId == 0) {
      return
    }
    val created = MediaPlayer.create(context, resourceId) ?: return
    created.setOnCompletionListener { stopPlayback() }
    player = created
    created.start()
  }

  private fun stopPlayback() {
    val current = player ?: return
    player = null
    current.setOnCompletionListener(null)
    current.stop()
    current.release()
  }
}
