export function buildYouTubeDeepLink(videoId: string) {
  return {
    app: `vnd.youtube://shorts/${videoId}`,
    web: `https://www.youtube.com/shorts/${videoId}`,
  };
}

export function openDeepLink({ app, web }: { app: string; web: string }) {
  const iframe = document.createElement("iframe");
  iframe.style.display = "none";
  iframe.src = app;
  document.body.appendChild(iframe);
  setTimeout(() => {
    document.body.removeChild(iframe);
    window.location.href = web;
  }, 1500);
}
