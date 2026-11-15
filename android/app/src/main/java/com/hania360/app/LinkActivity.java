package com.hania360.app;

import android.app.Activity;
import android.appwidget.AppWidgetManager;
import android.content.ComponentName;
import android.net.Uri;
import android.os.Bundle;
import android.widget.Toast;

/** Receives hania360://widget?t=<key> from hania360.com/widget/connect and keeps the key for the widget. */
public class LinkActivity extends Activity {
  @Override protected void onCreate(Bundle b) {
    super.onCreate(b);
    Uri u = getIntent().getData();
    String t = u == null ? null : u.getQueryParameter("t");
    if (t != null && t.matches("[A-Za-z0-9_-]{32,48}")) {
      Widget.prefs(this).edit().putString("tok", t).apply();
      int[] ids = AppWidgetManager.getInstance(this).getAppWidgetIds(new ComponentName(this, Widget.class));
      Widget.run(this, ids, null);
      Toast.makeText(this, ids.length > 0 ? "✓ Today מחובר לווידג'ט" : "✓ Today מחובר. עכשיו מוסיפים את הווידג'ט למסך הבית", Toast.LENGTH_LONG).show();
    } else {
      Toast.makeText(this, "הקישור לא תקין. נסו שוב מ-hania360.com/widget/connect", Toast.LENGTH_LONG).show();
    }
    finish();
  }
}
