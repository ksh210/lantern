// 마음 쉼터 껍데기 — 인터넷이 없어도 열리도록 껍데기 파일을 기기에 보관해요.
// 앱의 화면과 문장은 Apps Script에서 오니 여기는 거의 고칠 일이 없어요.
// 이 폴더의 파일을 고쳐서 다시 올렸다면 아래 VERSION 숫자를 하나 올려 주세요.
const VERSION = "maeum-shell-v11";
const FILES = [
  "./",
  "./index.html",
  "./config.js",
  "./manifest.webmanifest",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/apple-touch-icon.png"
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  // 글꼴은 한 번 받으면 보관해 두고 다시 써요
  if (url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com") {
    e.respondWith(
      caches.open(VERSION + "-fonts").then((c) =>
        c.match(req).then((hit) => hit || fetch(req).then((res) => { c.put(req, res.clone()); return res; }).catch(() => hit))
      )
    );
    return;
  }
  if (url.origin !== location.origin) return;

  // 앱 파일: 먼저 새 버전을 받아 보고, 인터넷이 없으면 보관한 파일을 써요
  e.respondWith(
    fetch(req)
      .then((res) => {
        const copy = res.clone();
        caches.open(VERSION).then((c) => c.put(req, copy));
        return res;
      })
      .catch(() => caches.match(req).then((hit) => hit || caches.match("./index.html")))
  );
});
