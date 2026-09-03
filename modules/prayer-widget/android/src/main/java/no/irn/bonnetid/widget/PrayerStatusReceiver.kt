package no.irn.bonnetid.widget

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

class PrayerStatusReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) {
    PrayerStatusNotifier.handle(context.applicationContext, intent)
  }
}
