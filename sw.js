/**
 * iqiuqiu | Qiuhui & Yan PWA Service Worker
 * 策略：网络优先 (Network-First)，离线回退到缓存；排除所有后端云同步接口
 */

const CACHE_NAME = 'iqiuqiu-cache-v20261107-meal-filter';

const PRECACHE_RESOURCES = [
  './',
  './index.html',
  './manifest.json',
  './css/style.css',
  './css/resume.css',
  './css/albums.css',
  './css/todo.css',
  './css/responsive.css',
  './css/meals.css',
  './js/store.js',
  './js/auth.js',
  './js/timetable.js',
  './js/albums.js',
  './js/todo.js',
  './js/resume.js',
  './js/meals.js',
  './js/app.js',
  './images/logo.svg',
  './images/logo.png',
  './images/icon-192.png',
  './images/icon-512.png',
  './images/icon-maskable-512.png',
  './images/apple-touch-icon.png'
];

// 安装时预缓存基础核心资源
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // 容错预缓存，即使单个资源失败也不影响整个 SW 激活
      return Promise.allSettled(
        PRECACHE_RESOURCES.map((url) =>
          cache.add(url).catch((err) => {
            console.warn('[SW] Pre-cache item failed:', url, err);
          })
        )
      );
    }).then(() => self.skipWaiting())
  );
});

// 激活时清理旧版本缓存
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[SW] Purging outdated cache:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 请求拦截分发
self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // 1. 严格跳过非 GET 请求以及所有后端云端同步接口
  if (
    req.method !== 'GET' ||
    url.hostname.includes('api.iqiuqiu.me') ||
    url.hostname.includes('workers.dev') ||
    url.pathname.includes('/api/')
  ) {
    return; // 直接走真实网络，不拦截
  }

  // 2. 核心网络优先 (Network-First) 策略
  event.respondWith(
    fetch(req)
      .then((networkRes) => {
        // 如果网络请求成功，克隆一份同步更新本地缓存
        if (networkRes && networkRes.status === 200) {
          const resClone = networkRes.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(req, resClone);
          });
        }
        return networkRes;
      })
      .catch(async () => {
        // 网络不可用时，优雅回退到本地缓存
        const cachedRes = await caches.match(req);
        if (cachedRes) {
          return cachedRes;
        }
        // 如果是页面主文档导航请求，回退到主页
        if (req.mode === 'navigate') {
          const fallbackPage = await caches.match('./index.html');
          if (fallbackPage) return fallbackPage;
        }
        return new Response('Network error (Offline)', {
          status: 503,
          headers: { 'Content-Type': 'text/plain; charset=utf-8' }
        });
      })
  );
});
