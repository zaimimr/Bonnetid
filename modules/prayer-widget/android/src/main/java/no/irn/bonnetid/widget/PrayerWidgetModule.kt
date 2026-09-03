package no.irn.bonnetid.widget

import android.content.Context
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

const val SNAPSHOT_PREFS = "prayer_widget"
const val SNAPSHOT_KEY = "prayer_snapshot_v1"
const val PRAYER_LOG_KEY = "prayer_log_v1"

class PrayerWidgetModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("PrayerWidget")

    Function("setSnapshot") { json: String ->
      val context = appContext.reactContext ?: return@Function
      context
        .getSharedPreferences(SNAPSHOT_PREFS, Context.MODE_PRIVATE)
        .edit()
        .putString(SNAPSHOT_KEY, json)
        .apply()
      PrayerAppWidget.updateAll(context)
      PrayerStatusNotifier.sync(context)
    }

    Function("getPrayerLog") {
      appContext.reactContext
        ?.getSharedPreferences(SNAPSHOT_PREFS, Context.MODE_PRIVATE)
        ?.getString(PRAYER_LOG_KEY, null)
    }

    Function("setPrayerLog") { json: String ->
      val context = appContext.reactContext ?: return@Function
      context
        .getSharedPreferences(SNAPSHOT_PREFS, Context.MODE_PRIVATE)
        .edit()
        .putString(PRAYER_LOG_KEY, json)
        .apply()
      PrayerAppWidget.updateAll(context)
      PrayerStatusNotifier.refreshPosted(context)
    }

    Function("areLiveActivitiesEnabled") { false }

    AsyncFunction("startOrUpdateActivity") { _: Map<String, Any?> ->
      // Android has no ActivityKit equivalent; the home screen widget carries the same data.
    }

    AsyncFunction("endActivity") {
      // No-op, see startOrUpdateActivity.
    }
  }
}
