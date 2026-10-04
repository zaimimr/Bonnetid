package no.irn.bonnetid.wear

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import com.google.android.gms.wearable.PutDataMapRequest
import com.google.android.gms.wearable.Wearable
import no.irn.bonnetid.widget.SNAPSHOT_KEY
import no.irn.bonnetid.widget.SNAPSHOT_PREFS
import no.irn.bonnetid.widget.WearSnapshot

class WearSnapshotReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) {
    if (intent.action != WearSnapshot.ACTION_WRITTEN) return
    val raw = context
      .getSharedPreferences(SNAPSHOT_PREFS, Context.MODE_PRIVATE)
      .getString(SNAPSHOT_KEY, null)
      ?: return

    val pending = goAsync()
    try {
      val request = PutDataMapRequest.create(WearSnapshot.PATH)
        .apply { dataMap.putByteArray(WearSnapshot.KEY, WearSnapshot.encode(raw)) }
        .asPutDataRequest()
        .setUrgent()
      Wearable.getDataClient(context).putDataItem(request).addOnCompleteListener { pending.finish() }
    } catch (_: Exception) {
      pending.finish()
    }
  }
}
