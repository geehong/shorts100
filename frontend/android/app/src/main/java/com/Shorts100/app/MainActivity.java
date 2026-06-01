package com.Shorts100.app;

import android.app.DownloadManager;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.database.Cursor;
import android.net.Uri;
import android.os.Bundle;
import android.os.Environment;
import android.webkit.DownloadListener;
import android.webkit.URLUtil;
import android.webkit.WebSettings;
import android.widget.Toast;
import com.getcapacitor.BridgeActivity;
import com.codetrixstudio.capacitor.GoogleAuth.GoogleAuth;

public class MainActivity extends BridgeActivity {
    private BroadcastReceiver onDownloadCompleteReceiver;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        registerPlugin(GoogleAuth.class);
        super.onCreate(savedInstanceState);
        
        // User-agent modification to bypass Google OAuth WebView security block
        WebSettings settings = this.bridge.getWebView().getSettings();
        String originalUA = settings.getUserAgentString();
        String chromeUA = originalUA.replace("; wv", "").replaceAll("Version/[\\d.]+", "");
        settings.setUserAgentString(chromeUA);

        // Native DownloadManager integration to download files in the background without opening browser
        this.bridge.getWebView().setDownloadListener(new DownloadListener() {
            @Override
            public void onDownloadStart(String url, String userAgent, String contentDisposition, String mimetype, long contentLength) {
                try {
                    DownloadManager.Request request = new DownloadManager.Request(Uri.parse(url));
                    
                    // Manually parse the filename from Content-Disposition to prevent URLUtil.guessFileName from overriding it to .bin when mimetype is application/octet-stream
                    String filename = null;
                    if (contentDisposition != null) {
                        int index = contentDisposition.indexOf("filename=");
                        if (index > 0) {
                            filename = contentDisposition.substring(index + 9);
                            if (filename.startsWith("\"")) {
                                filename = filename.substring(1);
                                int endIndex = filename.indexOf("\"");
                                if (endIndex > 0) {
                                    filename = filename.substring(0, endIndex);
                                }
                            } else {
                                int endIndex = filename.indexOf(";");
                                if (endIndex > 0) {
                                    filename = filename.substring(0, endIndex);
                                }
                            }
                            filename = filename.trim();
                        }
                    }
                    if (filename == null || filename.isEmpty()) {
                        filename = URLUtil.guessFileName(url, contentDisposition, mimetype);
                    }

                    request.setTitle(filename);
                    request.setDescription("Downloading video...");
                    
                    // Force video/mp4 MIME type if filename ends with .mp4 to make sure Android handles and scans it correctly as a video
                    if (filename.endsWith(".mp4")) {
                        request.setMimeType("video/mp4");
                    } else {
                        request.setMimeType(mimetype);
                    }
                    
                    request.allowScanningByMediaScanner();
                    request.setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED);
                    request.setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS, filename);
                    
                    DownloadManager dm = (DownloadManager) getSystemService(DOWNLOAD_SERVICE);
                    dm.enqueue(request);
                    
                    Toast.makeText(getApplicationContext(), "다운로드를 시작합니다...", Toast.LENGTH_SHORT).show();
                } catch (Exception e) {
                    Toast.makeText(getApplicationContext(), "다운로드 실패: " + e.getMessage(), Toast.LENGTH_LONG).show();
                }
            }
        });

        // BroadcastReceiver to notify user when a download completes and show where it was saved
        onDownloadCompleteReceiver = new BroadcastReceiver() {
            @Override
            public void onReceive(Context context, Intent intent) {
                try {
                    long referenceId = intent.getLongExtra(DownloadManager.EXTRA_DOWNLOAD_ID, -1);
                    if (referenceId == -1) return;

                    DownloadManager.Query query = new DownloadManager.Query();
                    query.setFilterById(referenceId);
                    
                    DownloadManager dm = (DownloadManager) getSystemService(DOWNLOAD_SERVICE);
                    Cursor cursor = dm.query(query);
                    
                    if (cursor != null) {
                        if (cursor.moveToFirst()) {
                            int statusColumn = cursor.getColumnIndex(DownloadManager.COLUMN_STATUS);
                            if (statusColumn != -1) {
                                int status = cursor.getInt(statusColumn);
                                if (status == DownloadManager.STATUS_SUCCESSFUL) {
                                    String title = "";
                                    int titleColumn = cursor.getColumnIndex(DownloadManager.COLUMN_TITLE);
                                    if (titleColumn != -1) {
                                        title = cursor.getString(titleColumn);
                                    }

                                    String localUri = "";
                                    int localUriColumn = cursor.getColumnIndex(DownloadManager.COLUMN_LOCAL_URI);
                                    if (localUriColumn != -1) {
                                        localUri = cursor.getString(localUriColumn);
                                    }

                                    String pathDisplay = "Download 폴더";
                                    if (localUri != null && !localUri.isEmpty()) {
                                        Uri uri = Uri.parse(localUri);
                                        String path = uri.getPath();
                                        if (path != null) {
                                            int downloadIdx = path.indexOf("Download");
                                            if (downloadIdx >= 0) {
                                                pathDisplay = "내장 메모리 > " + path.substring(downloadIdx);
                                            } else {
                                                pathDisplay = path;
                                            }
                                        }
                                    }

                                    Toast.makeText(getApplicationContext(), 
                                        "다운로드 완료!\n파일명: " + title + "\n저장 위치: " + pathDisplay, 
                                        Toast.LENGTH_LONG).show();
                                }
                            }
                        }
                        cursor.close();
                    }
                } catch (Exception e) {
                    e.printStackTrace();
                }
            }
        };

        if (android.os.Build.VERSION.SDK_INT >= 34) {
            registerReceiver(onDownloadCompleteReceiver, new IntentFilter(DownloadManager.ACTION_DOWNLOAD_COMPLETE), Context.RECEIVER_EXPORTED);
        } else {
            registerReceiver(onDownloadCompleteReceiver, new IntentFilter(DownloadManager.ACTION_DOWNLOAD_COMPLETE));
        }
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        if (onDownloadCompleteReceiver != null) {
            try {
                unregisterReceiver(onDownloadCompleteReceiver);
            } catch (Exception e) {
                e.printStackTrace();
            }
        }
    }
}
