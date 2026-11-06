/**
 * OASIS | Qiuhui & Yan - Cloudflare Cloud Backend
 * 专为双人空间打造的高性能无服务器云端存储与实时同步服务
 */

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': '*',
  'Access-Control-Max-Age': '86400',
};

function jsonResponse(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
      'Pragma': 'no-cache',
      'Expires': '0',
      ...CORS_HEADERS,
      ...extraHeaders,
    },
  });
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    // 处理跨域 Preflight 请求
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: CORS_HEADERS,
      });
    }

    try {
      // 1. 健康检查
      if (path === '/api/health' || path === '/api') {
        return jsonResponse({
          status: 'ok',
          service: 'OASIS Cloud Sync (Cloudflare Worker + KV)',
          time: new Date().toISOString(),
          version: '1.0.0',
        });
      }

      // 2. 数据读取 (GET /api/sync)
      if (path === '/api/sync' && (request.method === 'GET' || request.method === 'HEAD')) {
        const globalData = await env.OASIS_KV.get('oasis_global_data', 'json');
        if (!globalData) {
          return jsonResponse({
            exists: false,
            message: '云端暂未初始化数据，等待首次上传同步',
            data: null,
          });
        }
        return jsonResponse({
          exists: true,
          data: globalData,
        });
      }

      // 3. 数据保存 / 同步更新 (POST /api/sync)
      if (path === '/api/sync' && request.method === 'POST') {
        const body = await request.json();
        if (!body || typeof body !== 'object') {
          return jsonResponse({ error: '无效的数据载荷 (Invalid payload)' }, 400);
        }

        const now = Date.now();
        body.savedAt = now;
        body.savedAtIso = new Date(now).toISOString();

        // 智能合并：获取当前云端已有数据，防止老旧客户端或浮窗挂起时推空覆盖他人最新三餐
        try {
          const existing = await env.OASIS_KV.get('oasis_global_data', 'json');
          if (existing && typeof existing === 'object') {
            // 合并三餐照片（新增不覆盖，双向补全）
            if (Array.isArray(existing.meals) && Array.isArray(body.meals)) {
              const mealMap = new Map();
              existing.meals.forEach(m => { if (m && m.id) mealMap.set(m.id, m); });
              body.meals.forEach(m => {
                if (m && m.id) {
                  const prev = mealMap.get(m.id);
                  mealMap.set(m.id, prev ? { ...prev, ...m } : m);
                }
              });
              body.meals = Array.from(mealMap.values()).sort((a, b) => {
                const tA = new Date(a.time || a.createdAt || 0).getTime();
                const tB = new Date(b.time || b.createdAt || 0).getTime();
                return tB - tA;
              });
            }

            // 合并 deleted_todo_ids（两端的已删 ID 取并集，防止遗漏）
            if (Array.isArray(existing.deleted_todo_ids) || Array.isArray(body.deleted_todo_ids)) {
              const existingDeleted = Array.isArray(existing.deleted_todo_ids) ? existing.deleted_todo_ids : [];
              const bodyDeleted = Array.isArray(body.deleted_todo_ids) ? body.deleted_todo_ids : [];
              const mergedDeleted = [...new Set([...existingDeleted, ...bodyDeleted])].slice(0, 500);
              body.deleted_todo_ids = mergedDeleted;
              // 用合并后的 deleted list 再次过滤 todos，确保云端不残留已删条目
              if (Array.isArray(body.todos) && mergedDeleted.length > 0) {
                const deletedSet = new Set(mergedDeleted);
                body.todos = body.todos.filter(t => t && t.id && !deletedSet.has(t.id));
              }
            }

            // 合并 deleted_note_ids
            if (Array.isArray(existing.deleted_note_ids) || Array.isArray(body.deleted_note_ids)) {
              const existingDeleted = Array.isArray(existing.deleted_note_ids) ? existing.deleted_note_ids : [];
              const bodyDeleted = Array.isArray(body.deleted_note_ids) ? body.deleted_note_ids : [];
              body.deleted_note_ids = [...new Set([...existingDeleted, ...bodyDeleted])].slice(0, 500);
            }
          }
        } catch (_) {}

        // 写入主键
        await env.OASIS_KV.put('oasis_global_data', JSON.stringify(body));

        // 异步保留一份滚动快照（不阻塞返回）
        ctx.waitUntil(
          env.OASIS_KV.put('oasis_backup_latest', JSON.stringify(body))
        );

        return jsonResponse({
          success: true,
          message: '数据已安全同步至 Cloudflare 云端',
          savedAt: now,
        });
      }

      // 4. 图片/照片上传 (POST /api/upload)
      if (path === '/api/upload' && request.method === 'POST') {
        const contentType = request.headers.get('content-type') || '';
        let photoBuffer = null;
        let mimeType = 'image/jpeg';
        let originalName = 'photo.jpg';
        let albumId = '';

        if (contentType.includes('application/json')) {
          const jsonBody = await request.json();
          if (!jsonBody.base64) {
            return jsonResponse({ error: '缺少 base64 图片数据' }, 400);
          }
          const base64Str = jsonBody.base64;
          const matches = base64Str.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
          if (matches && matches.length === 3) {
            mimeType = matches[1];
            const binary = atob(matches[2]);
            const bytes = new Uint8Array(binary.length);
            for (let i = 0; i < binary.length; i++) {
              bytes[i] = binary.charCodeAt(i);
            }
            photoBuffer = bytes.buffer;
          } else {
            return jsonResponse({ error: '非法的 base64 格式' }, 400);
          }
          originalName = jsonBody.name || originalName;
          albumId = jsonBody.albumId || '';
        } else if (contentType.includes('multipart/form-data')) {
          const formData = await request.formData();
          const file = formData.get('file');
          if (!file || !(file instanceof File)) {
            return jsonResponse({ error: '未找到上传的图片文件' }, 400);
          }
          photoBuffer = await file.arrayBuffer();
          mimeType = file.type || mimeType;
          originalName = file.name || originalName;
          albumId = formData.get('albumId') || '';
        } else {
          photoBuffer = await request.arrayBuffer();
          mimeType = contentType || mimeType;
        }

        if (!photoBuffer || photoBuffer.byteLength === 0) {
          return jsonResponse({ error: '空图片数据' }, 400);
        }

        const photoId = 'img_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);
        const kvKey = 'photo:' + photoId;

        await env.OASIS_KV.put(kvKey, photoBuffer, {
          metadata: {
            mimeType,
            originalName,
            albumId,
            size: photoBuffer.byteLength,
            uploadedAt: Date.now(),
          },
        });

        const photoUrl = `/api/photo/${photoId}`;
        return jsonResponse({
          success: true,
          photoId,
          url: photoUrl,
          size: photoBuffer.byteLength,
          mimeType,
        });
      }

      // 5. 图片/照片读取 (GET /api/photo/:id)
      if (path.startsWith('/api/photo/') && request.method === 'GET') {
        const photoId = path.replace('/api/photo/', '').trim();
        if (!photoId) {
          return jsonResponse({ error: '无效的照片 ID' }, 400);
        }

        const kvKey = 'photo:' + photoId;
        const res = await env.OASIS_KV.getWithMetadata(kvKey, { type: 'arrayBuffer' });

        if (!res.value) {
          return jsonResponse({ error: '照片不存在或已移除' }, 404);
        }

        const mime = res.metadata?.mimeType || 'image/jpeg';
        return new Response(res.value, {
          status: 200,
          headers: {
            'Content-Type': mime,
            'Cache-Control': 'public, max-age=31536000, immutable',
            ...CORS_HEADERS,
          },
        });
      }

      // 6. 图片/照片删除 (DELETE /api/photo/:id)
      if (path.startsWith('/api/photo/') && request.method === 'DELETE') {
        const photoId = path.replace('/api/photo/', '').trim();
        if (!photoId) {
          return jsonResponse({ error: '无效的照片 ID' }, 400);
        }
        await env.OASIS_KV.delete('photo:' + photoId);
        return jsonResponse({ success: true, message: '照片已从云端删除' });
      }

      return jsonResponse({ error: 'Not Found', path }, 404);
    } catch (err) {
      return jsonResponse(
        {
          error: '服务器内部错误',
          details: err.message || String(err),
        },
        500
      );
    }
  },
};
