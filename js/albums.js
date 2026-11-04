/**
 * OASIS | Qiuhui & Yan
 * 相册与照片墙模块 (相册一本一本 + 自主压缩上传 + 客厅/卧室权限隔离 + 灯箱大图浏览)
 */

class AlbumsModule {
  constructor() {
    this.currentAlbumId = null; // null 表示在相册列表页，非 null 表示在某一本相册内部
    this.currentPhotos = [];
    this.activePhotoIndex = -1;
  }

  // 渲染相册板块
  async render(container) {
    if (!container) return;
    const isMaster = window.spaceAuth.isMaster();

    if (!this.currentAlbumId) {
      // 1. 渲染【相册相簿列表页（一本一本）】
      await this.renderAlbumsList(container, isMaster);
    } else {
      // 2. 渲染【某一本相册内部照片列表】
      await this.renderAlbumDetail(container, isMaster);
    }
  }

  // 1. 渲染所有相簿（一本一本）
  async renderAlbumsList(container, isMaster) {
    const allAlbums = window.spaceStore.getAlbums();
    // 权限过滤：来宾只能看客厅开放的相册
    const visibleAlbums = allAlbums.filter(a => isMaster || a.visibility === 'living_room');

    container.innerHTML = `
      <div class="albums-dashboard">
        <!-- 相册顶部引导条 -->
        <div class="albums-header-bar card-glass">
          <div class="albums-header-text">
            <h2>📖 我们的岁月相簿 · 一本一本的时光</h2>
            <p class="text-muted">客厅陈列着公开的美好回忆，卧室珍藏着独属于两人的私密温度。</p>
          </div>
          <div class="albums-header-actions">
            ${isMaster ? `
              <button class="btn btn-primary" id="btn-create-album">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                新建相册一本
              </button>
            ` : `
              <span class="badge badge-guest">🛋️ 客厅模式 · 仅展示主人开放相簿</span>
            `}
          </div>
        </div>

        <!-- 相簿网格列表 -->
        <div class="albums-books-grid">
          ${visibleAlbums.length === 0 ? `
            <div class="empty-state card-glass">
              <span class="empty-icon">📂</span>
              <p>暂无公开相册展示</p>
            </div>
          ` : visibleAlbums.map(album => this.renderAlbumBookCard(album, isMaster)).join('')}
        </div>
      </div>
    `;

    this.bindAlbumsListEvents(container);
  }

  // 单本相册书本卡片渲染
  renderAlbumBookCard(album, isMaster) {
    const isLivingRoom = album.visibility === 'living_room';
    return `
      <div class="album-book-card card-hover" data-id="${album.id}">
        <div class="album-book-cover-wrap">
          <div class="album-book-spine"></div>
          <div class="album-cover-img-box" id="album-cover-${album.id}">
            <!-- 封面图由 JS 异步加载填充，或占位图 -->
            <div class="album-cover-placeholder">
              <span class="placeholder-icon">📷</span>
              <span class="placeholder-title">${this.escapeHtml(album.title)}</span>
            </div>
          </div>
          <div class="album-badge-tag">
            <span class="badge ${isLivingRoom ? 'badge-living' : 'badge-bedroom'}">
              ${isLivingRoom ? '🛋️ 客厅开放' : '🛏️ 卧室私密'}
            </span>
          </div>
        </div>
        <div class="album-book-info">
          <h3 class="album-title">${this.escapeHtml(album.title)}</h3>
          <p class="album-desc">${this.escapeHtml(album.desc || '记录我们的点滴琐碎')}</p>
          <div class="album-meta-row">
            <span class="album-date">📅 ${album.createdAt}</span>
            <span class="album-count">🎞️ <span id="album-count-num-${album.id}">${album.count || 0}</span> 张</span>
          </div>
        </div>
        ${isMaster ? `
          <div class="album-card-admin-actions">
            <button class="btn-text btn-edit-album" data-id="${album.id}" title="修改相册信息">编辑</button>
            <button class="btn-text btn-del-album" data-id="${album.id}" title="删除相册">删除</button>
          </div>
        ` : ''}
      </div>
    `;
  }

  // 绑定相册列表交互事件
  bindAlbumsListEvents(container) {
    // 异步加载各相册的封面图与数量
    const albums = window.spaceStore.getAlbums();
    albums.forEach(async (album) => {
      const photos = await window.spaceStore.getPhotosByAlbum(album.id);
      const countEl = container.querySelector(`#album-count-num-${album.id}`);
      if (countEl) countEl.innerText = photos.length;

      const coverBox = container.querySelector(`#album-cover-${album.id}`);
      if (coverBox) {
        if (photos.length > 0) {
          coverBox.innerHTML = `<img src="${photos[0].dataUrl}" class="album-cover-real-img" alt="cover" />`;
        } else if (album.id === 'album_first_sight') {
          // 初建时使用现存的 1001_1.jpg 预热
          coverBox.innerHTML = `<img src="./images/1001_1.jpg" class="album-cover-real-img" alt="cover" />`;
        }
      }
    });

    // 点击某一本相册进入详情
    container.querySelectorAll('.album-book-card').forEach(card => {
      card.addEventListener('click', (e) => {
        // 避免点击编辑/删除按钮触发进入相册
        if (e.target.closest('.album-card-admin-actions')) return;
        this.currentAlbumId = card.dataset.id;
        this.render(container);
      });
    });

    // 新建相册按钮
    const btnCreate = container.querySelector('#btn-create-album');
    if (btnCreate) {
      btnCreate.addEventListener('click', () => {
        this.openAlbumModal();
      });
    }

    // 编辑相册
    container.querySelectorAll('.btn-edit-album').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const album = albums.find(a => a.id === btn.dataset.id);
        if (album) this.openAlbumModal(album);
      });
    });

    // 删除相册
    container.querySelectorAll('.btn-del-album').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        if (confirm('确认删除整本相册及其包含的所有照片吗？此操作不可逆！')) {
          let list = window.spaceStore.getAlbums();
          list = list.filter(a => a.id !== btn.dataset.id);
          window.spaceStore.saveAlbums(list);
          this.render(container);
        }
      });
    });
  }

  // 2. 渲染【某一本相册的内部照片】
  async renderAlbumDetail(container, isMaster) {
    const albums = window.spaceStore.getAlbums();
    const album = albums.find(a => a.id === this.currentAlbumId);
    if (!album) {
      this.currentAlbumId = null;
      return this.render(container);
    }

    // 获取当前相册的照片列表
    this.currentPhotos = await window.spaceStore.getPhotosByAlbum(album.id);
    
    // 如果是首个相册且还没存入照片，将 1001_1.jpg 自动注册一张
    if (this.currentPhotos.length === 0 && album.id === 'album_first_sight') {
      const initPhoto = {
        id: 'photo_init_01',
        albumId: 'album_first_sight',
        title: '初遇时光 · 满怀欢喜',
        date: '2024-02-14',
        dataUrl: './images/1001_1.jpg',
        size: '轻量视网膜压缩'
      };
      this.currentPhotos.push(initPhoto);
    }

    const isLivingRoom = album.visibility === 'living_room';

    container.innerHTML = `
      <div class="album-detail-view">
        <!-- 顶部面包屑与相册信息 -->
        <div class="album-detail-top-nav card-glass">
          <div class="detail-nav-left">
            <button class="btn btn-sm btn-outline" id="btn-back-to-albums">
              ‹ 返回所有相册
            </button>
            <div class="detail-album-title-group">
              <h2>${this.escapeHtml(album.title)}</h2>
              <span class="badge ${isLivingRoom ? 'badge-living' : 'badge-bedroom'}">
                ${isLivingRoom ? '🛋️ 客厅开放相册' : '🛏️ 卧室私密相册'}
              </span>
            </div>
          </div>
          <div class="detail-nav-actions">
            ${isMaster ? `
              <label class="btn btn-primary btn-upload-wrap">
                <input type="file" id="input-upload-photos" accept="image/*" multiple style="display:none;">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                📸 上传照片到本相册
              </label>
            ` : ''}
          </div>
        </div>

        <p class="album-detail-desc">${this.escapeHtml(album.desc || '')}</p>

        <!-- 照片网格瀑布流 -->
        <div class="photos-masonry-grid" id="photos-grid">
          ${this.currentPhotos.length === 0 ? `
            <div class="empty-state card-glass flex-full">
              <span class="empty-icon">🖼️</span>
              <p>这本相册里还没有照片，快点击上方上传第一张吧！</p>
            </div>
          ` : this.currentPhotos.map((photo, idx) => `
            <div class="photo-polaroid-card card-hover" data-index="${idx}">
              <div class="photo-img-wrapper">
                <img src="${photo.dataUrl}" alt="${this.escapeHtml(photo.title)}" loading="lazy" />
                <div class="photo-overlay-mask">
                  <span class="zoom-hint">🔍 点击放大浏览</span>
                </div>
              </div>
              <div class="photo-caption">
                <div class="photo-caption-title">${this.escapeHtml(photo.title || '无题微光')}</div>
                <div class="photo-caption-meta">
                  <span>${photo.date || '美好记忆'}</span>
                  ${isMaster ? `
                    <button class="btn-icon-del-photo" data-id="${photo.id}" title="删除照片">🗑️</button>
                  ` : ''}
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    this.bindAlbumDetailEvents(container, album);
  }

  // 绑定相册内部事件
  bindAlbumDetailEvents(container, album) {
    // 返回相簿列表
    container.querySelector('#btn-back-to-albums').addEventListener('click', () => {
      this.currentAlbumId = null;
      this.render(container);
    });

    // 监听上传照片
    const uploadInput = container.querySelector('#input-upload-photos');
    if (uploadInput) {
      uploadInput.addEventListener('change', async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        const loadingTip = document.createElement('div');
        loadingTip.className = 'upload-toast card-glass animate-pop';
        loadingTip.innerHTML = `<span>⏳ 正在前端轻量视网膜压缩 (${files.length} 张)...</span>`;
        document.body.appendChild(loadingTip);

        for (const file of files) {
          try {
            const compressed = await this.compressImage(file);
            const photoId = 'photo_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
            const photoData = {
              id: photoId,
              albumId: album.id,
              title: file.name.replace(/\.[^/.]+$/, ''),
              date: new Date().toISOString().split('T')[0],
              dataUrl: compressed.dataUrl,
              size: `${Math.round(compressed.size / 1024)} KB`
            };
            await window.spaceStore.savePhoto(photoData);
          } catch (err) {
            console.error('照片压缩上传失败:', err);
          }
        }

        loadingTip.remove();
        // 更新相册计数
        const updatedPhotos = await window.spaceStore.getPhotosByAlbum(album.id);
        album.count = updatedPhotos.length;
        const allAlbums = window.spaceStore.getAlbums();
        const found = allAlbums.find(a => a.id === album.id);
        if (found) found.count = updatedPhotos.length;
        window.spaceStore.saveAlbums(allAlbums);

        this.render(container);
      });
    }

    // 点击照片查看灯箱
    container.querySelectorAll('.photo-polaroid-card').forEach(card => {
      card.addEventListener('click', (e) => {
        if (e.target.closest('.btn-icon-del-photo')) return;
        const idx = parseInt(card.dataset.index, 10);
        this.openLightbox(idx);
      });
    });

    // 删除单张照片
    container.querySelectorAll('.btn-icon-del-photo').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        if (confirm('确认删除这张照片吗？')) {
          await window.spaceStore.deletePhoto(btn.dataset.id);
          this.render(container);
        }
      });
    });
  }

  // 纯前端 Canvas 视网膜级轻量压缩 (将 5~10MB 压至 ~100KB，同时保持高清晰度)
  compressImage(file, maxDimension = 1600, quality = 0.82) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxDimension) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            }
          } else {
            if (height > maxDimension) {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          // 优先尝试导出 webp，若浏览器不支持自动降级 jpeg
          let dataUrl = canvas.toDataURL('image/webp', quality);
          if (!dataUrl.startsWith('data:image/webp')) {
            dataUrl = canvas.toDataURL('image/jpeg', quality);
          }

          // 粗略估算数据体积
          const head = 'data:image/webp;base64,';
          const size = Math.round((dataUrl.length - head.length) * 3 / 4);

          resolve({ dataUrl, size });
        };
        img.onerror = reject;
        img.src = e.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  // 相册创建/编辑弹窗
  openAlbumModal(album = null) {
    const isEdit = !!album;
    const modalHtml = `
      <div class="modal-overlay" id="album-modal">
        <div class="modal-card card-glass animate-pop">
          <div class="modal-header">
            <h3>${isEdit ? '编辑相册信息' : '创建新岁月相簿'}</h3>
            <button class="btn-close" id="album-modal-close">×</button>
          </div>
          <form id="album-form" class="modal-body">
            <div class="form-group">
              <label>相册名称 *</label>
              <input type="text" name="title" class="input" placeholder="例如：2026云南自驾、校园初见记..." value="${album ? this.escapeHtml(album.title) : ''}" required>
            </div>

            <div class="form-group">
              <label>权限空间设定 *</label>
              <select name="visibility" class="input">
                <option value="living_room" ${album?.visibility === 'living_room' ? 'selected' : ''}>🛋️ 客厅开放 (输入来宾密码的朋友可见)</option>
                <option value="bedroom" ${album?.visibility === 'bedroom' ? 'selected' : ''}>🛏️ 卧室私密 (仅空间主人密码可见)</option>
              </select>
              <span class="form-tip">提示：设置为“客厅开放”的相册，凭来宾密码进入客厅的访客也能翻阅查看。</span>
            </div>

            <div class="form-group">
              <label>相册寄语 / 描述</label>
              <textarea name="desc" class="input textarea" rows="3" placeholder="写一句送给这本相簿的箴言或拍摄背景...">${album ? this.escapeHtml(album.desc || '') : ''}</textarea>
            </div>

            <div class="modal-footer">
              <button type="button" class="btn btn-outline" id="album-modal-cancel">取消</button>
              <button type="submit" class="btn btn-primary">保存相簿</button>
            </div>
          </form>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);
    const modalEl = document.getElementById('album-modal');
    const closeModal = () => modalEl && modalEl.remove();

    modalEl.querySelector('#album-modal-close').addEventListener('click', closeModal);
    modalEl.querySelector('#album-modal-cancel').addEventListener('click', closeModal);

    modalEl.querySelector('#album-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const list = window.spaceStore.getAlbums();

      if (isEdit) {
        const found = list.find(a => a.id === album.id);
        if (found) {
          found.title = fd.get('title');
          found.visibility = fd.get('visibility');
          found.desc = fd.get('desc');
        }
      } else {
        const newAlbum = {
          id: 'album_' + Date.now(),
          title: fd.get('title'),
          visibility: fd.get('visibility'),
          desc: fd.get('desc'),
          createdAt: new Date().toISOString().split('T')[0],
          count: 0
        };
        list.push(newAlbum);
      }

      window.spaceStore.saveAlbums(list);
      closeModal();
      const container = document.getElementById('content-albums');
      if (container) this.render(container);
    });
  }

  // 大图灯箱浏览
  openLightbox(index) {
    if (!this.currentPhotos[index]) return;
    this.activePhotoIndex = index;
    const photo = this.currentPhotos[index];

    const lbHtml = `
      <div class="lightbox-overlay animate-fade" id="lightbox-modal">
        <button class="lightbox-btn-close" id="lb-btn-close">×</button>
        <button class="lightbox-arrow arrow-left" id="lb-btn-prev">‹</button>
        <button class="lightbox-arrow arrow-right" id="lb-btn-next">›</button>
        
        <div class="lightbox-content">
          <img src="${photo.dataUrl}" class="lightbox-img" id="lb-main-img" alt="${this.escapeHtml(photo.title)}" />
          <div class="lightbox-info">
            <h4 id="lb-title">${this.escapeHtml(photo.title || '美好瞬间')}</h4>
            <span id="lb-date">${photo.date} · 第 ${index + 1} / ${this.currentPhotos.length} 张</span>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', lbHtml);
    const lbModal = document.getElementById('lightbox-modal');

    const updatePhoto = (newIdx) => {
      this.activePhotoIndex = newIdx;
      const p = this.currentPhotos[newIdx];
      lbModal.querySelector('#lb-main-img').src = p.dataUrl;
      lbModal.querySelector('#lb-title').innerText = p.title || '美好瞬间';
      lbModal.querySelector('#lb-date').innerText = `${p.date} · 第 ${newIdx + 1} / ${this.currentPhotos.length} 张`;
    };

    lbModal.querySelector('#lb-btn-close').addEventListener('click', () => lbModal.remove());
    lbModal.querySelector('#lb-btn-prev').addEventListener('click', (e) => {
      e.stopPropagation();
      const prevIdx = (this.activePhotoIndex - 1 + this.currentPhotos.length) % this.currentPhotos.length;
      updatePhoto(prevIdx);
    });
    lbModal.querySelector('#lb-btn-next').addEventListener('click', (e) => {
      e.stopPropagation();
      const nextIdx = (this.activePhotoIndex + 1) % this.currentPhotos.length;
      updatePhoto(nextIdx);
    });

    // 键盘左右箭头支持
    const handleKeydown = (e) => {
      if (e.key === 'Escape') {
        lbModal.remove();
        document.removeEventListener('keydown', handleKeydown);
      } else if (e.key === 'ArrowLeft') {
        const prevIdx = (this.activePhotoIndex - 1 + this.currentPhotos.length) % this.currentPhotos.length;
        updatePhoto(prevIdx);
      } else if (e.key === 'ArrowRight') {
        const nextIdx = (this.activePhotoIndex + 1) % this.currentPhotos.length;
        updatePhoto(nextIdx);
      }
    };
    document.addEventListener('keydown', handleKeydown);
  }

  escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}

window.albumsModule = new AlbumsModule();
