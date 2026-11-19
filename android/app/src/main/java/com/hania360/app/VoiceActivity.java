package com.hania360.app;

import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.speech.RecognizerIntent;
import android.widget.Toast;
import java.util.ArrayList;

/** The widget's mic: the phone's own speech recognition (Hebrew), then Hania opens with the question already asked. */
public class VoiceActivity extends Activity {
  @Override protected void onCreate(Bundle b) {
    super.onCreate(b);
    Intent i = new Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH);
    i.putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM);
    i.putExtra(RecognizerIntent.EXTRA_LANGUAGE, "he-IL");
    i.putExtra(RecognizerIntent.EXTRA_PROMPT, "מה לבקש מ־Hania?");
    try { startActivityForResult(i, 1); }
    catch (ActivityNotFoundException e) { go("https://ai.hania360.com/?mic=1"); }
  }
  @Override protected void onActivityResult(int code, int res, Intent data) {
    super.onActivityResult(code, res, data);
    ArrayList<String> r = data == null ? null : data.getStringArrayListExtra(RecognizerIntent.EXTRA_RESULTS);
    if (res == RESULT_OK && r != null && !r.isEmpty()) go("https://ai.hania360.com/?q=" + Uri.encode(r.get(0)));
    else finish();
  }
  void go(String url) {
    try { Intent v = new Intent(Intent.ACTION_VIEW, Uri.parse(url)); v.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK); startActivity(v); }
    catch (Exception e) { Toast.makeText(this, "לא הצלחנו לפתוח את Hania", Toast.LENGTH_LONG).show(); }
    finish();
  }
}
