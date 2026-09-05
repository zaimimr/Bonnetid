package no.irn.bonnetid.car

import android.os.Handler
import android.os.Looper
import androidx.lifecycle.DefaultLifecycleObserver
import androidx.lifecycle.LifecycleOwner
import no.irn.bonnetid.widget.PrayerFormat

/**
 * Car templates never tick on their own, so every screen that prints a countdown redraws itself
 * on the minute while it is on screen. Anything finer than a minute is throttled by the host.
 */
class CarMinuteTicker(private val redraw: () -> Unit) : DefaultLifecycleObserver {
  private val handler = Handler(Looper.getMainLooper())

  private val tick = object : Runnable {
    override fun run() {
      redraw()
      schedule()
    }
  }

  override fun onStart(owner: LifecycleOwner) {
    schedule()
  }

  override fun onStop(owner: LifecycleOwner) {
    handler.removeCallbacks(tick)
  }

  private fun schedule() {
    val now = System.currentTimeMillis()
    handler.removeCallbacks(tick)
    handler.postDelayed(tick, (PrayerFormat.startOfNextMinute(now) - now).coerceAtLeast(1000L))
  }
}
