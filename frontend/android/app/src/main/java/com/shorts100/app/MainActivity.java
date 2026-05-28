package com.shorts100.app;

import android.os.Bundle;
import android.webkit.WebSettings;
import com.getcapacitor.BridgeActivity;
import com.codetrixstudio.capacitor.GoogleAuth.GoogleAuth;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        registerPlugin(GoogleAuth.class);
        super.onCreate(savedInstanceState);
        WebSettings settings = this.bridge.getWebView().getSettings();
        String originalUA = settings.getUserAgentString();
        String chromeUA = originalUA.replace("; wv", "").replaceAll("Version/[\\d.]+", "");
        settings.setUserAgentString(chromeUA);
    }
}
