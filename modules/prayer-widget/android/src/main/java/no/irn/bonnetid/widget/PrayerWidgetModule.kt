package no.irn.bonnetid.widget

import android.content.Context
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

const val SNAPSHOT_PREFS = "prayer_widget"
const val SNAPSHOT_KEY = "prayer_snapshot_v1"

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
