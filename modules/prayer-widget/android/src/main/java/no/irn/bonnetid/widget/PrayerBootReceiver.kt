package no.irn.bonnetid.widget

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

class PrayerBootReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) {
    when (intent.action) {
      Intent.ACTION_BOOT_COMPLETED,
      Intent.ACTION_MY_PACKAGE_REPLACED,
      -> {
        val app = context.applicationContext
        PrayerAppWidget.updateAll(app)
        PrayerDayWidget.updateAll(app)
        PrayerTimelineWidget.updateAll(app)
        PrayerStatusNotifier.sync(app)
      }
    }
  }
}
