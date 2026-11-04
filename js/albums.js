/**
 * OASIS | Qiuhui & Yan
 * 岁月相簿与照片墙 (采用 USV Lab 管理卡片与媒体相簿规范)
 */

class AlbumsModule {
  constructor() {
    this.currentAlbumId = null;
    this.currentPhotos = [];
    this.activePhotoIndex = -1;
  }

  async render(container) {
    if (!container) return;
    const isMaster = window.spaceAuth.isMaster();

    if (!this.currentAlbumId) {
      await this.renderAlbumsList(container, isMaster);
    } else {
      await this.renderAlbumDetail(container, isMaster);
    }
  }

  // 1. 相簿列表页 (一本一本)
  async renderAlbumsList(container, isMaster) {
    const allAlbums = window.spaceStore.getAlbums();
    const visibleAlbums = allAlbums.filter(a => isMaster || a.visibility === 'living_room');

    container.innerHTML = `
      <div class="admin-card">
        <div class="card-title">
          <div class="card-title-left">
            <span class="badge-icon">
              <svg class="ico" viewBox="0 0 24 24"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
            </span>
            <span>岁月相簿 · 一本一本的时光档案</span>
          </div>
          ${isMaster ? `
            <button class="btn btn-primary btn-sm" id="btn-create-album">
              <svg class="ico" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>
              新建相簿一本
            </button>
          ` : `
            <span class="pill good">🛋️ 客厅模式 · 仅展示主人开放相簿</span>
          `}
        </div>

        <p class="fine" style="margin-bottom: 16px;">
          客厅陈列着公开的美好回忆，卧室珍藏着独属于两人的私密温度。点击相簿封面即可进入翻阅。
        </p>

        <div class="albums-grid">
          ${visibleAlbums.length === 0 ? `
            <div class="empty" style="grid-column: 1/-1;">暂无公开相簿展示</div>
          ` : visibleAlbums.map(album => this.renderAlbumCard(album, isMaster)).join('')}
        </div>
      </div>
    `;

    this.bindAlbumsListEvents(container);
  }

  renderAlbumCard(album, isMaster) {
    const isLiving = album.visibility === 'living_room';
    return `
      <div class="album-entry" data-id="${album.id}">
        <div class="album-thumb-wrap" id="album-cover-box-${album.id}">
          <div class="album-placeholder">📷</div>
          <span class="album-status-badge ${isLiving ? 'living' : 'bedroom'}">
            ${isLiving ? '🛋️ 客厅开放' : '🛏️ 卧室私密'}
          </span>
        </div>
        <div class="album-meta-box">
          <h3>${this.escapeHtml(album.title)}</h3>
          <p>${this.escapeHtml(album.desc || '记录我们的点滴琐碎')}</p>
          <div class="album-footer-line">
            <span>📅 ${album.createdAt}</span>
            <span>🎞️ <strong id="album-count-${album.id}">${album.count || 0}</strong> 张照片</span>
          </div>
          ${isMaster ? `
            <div style="display:flex; justify-content:flex-end; gap:8px; margin-top:10px;">
              <button class="btn-text btn-edit-album" data-id="${album.id}">编辑</button>
              <button class="btn-text btn-del-album" data-id="${album.id}" style="color:#a7464c;">删除</button>
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }

  bindAlbumsListEvents(container) {
    const albums = window.spaceStore.getAlbums();
    albums.forEach(async (album) => {
      const photos = await window.spaceStore.getPhotosByAlbum(album.id);
      const countEl = container.querySelector(`#album-count-${album.id}`);
      if (countEl) countEl.innerText = photos.length;

      const coverBox = container.querySelector(`#album-cover-box-${album.id}`);
      if (coverBox) {
        if (photos.length > 0) {
          coverBox.innerHTML = `
            <img src="${photos[0].dataUrl}" alt="cover" />
            <span class="album-status-badge ${album.visibility === 'living_room' ? 'living' : 'bedroom'}">
              ${album.visibility === 'living_room' ? '🛋️ 客厅开放' : '🛏️ 卧室私密'}
            </span>
          `;
        } else if (album.id === 'album_first_sight') {
          coverBox.innerHTML = `
            <img src="./images/1001_1.jpg" alt="cover" />
            <span class="album-status-badge living">🛋️ 客厅开放</span>
          `;
        }
      }
    });

    container.querySelectorAll('.album-entry').forEach(card => {
      card.addEventListener('click', (e) => {
        if (e.target.closest('.btn-text')) return;
        this.currentAlbumId = card.dataset.id;
        this.render(container);
      });
    });

    container.querySelector('#btn-create-album')?.addEventListener('click', () => {
      this.openAlbumModal();
    });

    container.querySelectorAll('.btn-edit-album').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const a = albums.find(x => x.id === btn.dataset.id);
        if (a) this.openAlbumModal(a);
      });
    });

    container.querySelectorAll('.btn-del-album').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (confirm('确认删除整本相册及所有照片吗？')) {
          let list = window.spaceStore.getAlbums();
          list = list.filter(x => x.id !== btn.dataset.id);
          window.spaceStore.saveAlbums(list);
          this.render(container);
        }
      });
    });
  }

  // 2. 单本相簿详情照片流
  async renderAlbumDetail(container, isMaster) {
    const albums = window.spaceStore.getAlbums();
    const album = albums.find(a => a.id === this.currentAlbumId);
    if (!album) {
      this.currentAlbumId = null;
      return this.render(container);
    }

    this.currentPhotos = await window.spaceStore.getPhotosByAlbum(album.id);
    if (this.currentPhotos.length === 0 && album.id === 'album_first_sight') {
      this.currentPhotos.push({
        id: 'photo_init_01',
        albumId: 'album_first_sight',
        title: '初遇时光 · 满怀欢喜',
        date: '2024-02-14',
        dataUrl: './images/1001_1.jpg'
      });
    }

    container.innerHTML = `
      <div class="admin-card">
        <div class="card-title">
          <div class="card-title-left">
            <button class="btn btn-outline btn-sm" id="btn-back-to-albums">‹ 返回所有相簿</button>
            <span>${this.escapeHtml(album.title)}</span>
            <span class="pill ${album.visibility === 'living_room' ? 'good' : 'off'}">
              ${album.visibility === 'living_room' ? '🛋️ 客厅开放' : '🛏️ 卧室私密'}
            </span>
          </div>
          ${isMaster ? `
            <label class="btn btn-primary btn-sm" style="margin: 0; cursor: pointer;">
              <input type="file" id="input-upload-photos" accept="image/*" multiple style="display:none;">
              <svg class="ico" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              上传照片到本相簿
            </label>
          ` : ''}
        </div>

        <p class="fine">${this.escapeHtml(album.desc || '点滴记录我们的美好时刻')}</p>

        <div class="photos-masonry">
          ${this.currentPhotos.length === 0 ? `
            <div class="empty" style="grid-column: 1/-1;">这本相簿暂无照片，点击上方按钮上传第一张吧！</div>
          ` : this.currentPhotos.map((photo, idx) => `
            <div class="photo-item" data-index="${idx}">
              <img src="${photo.dataUrl}" alt="${this.escapeHtml(photo.title)}" loading="lazy">
              <div class="photo-bar">
                <span class="photo-bar-title">${this.escapeHtml(photo.title || '美好瞬间')}</span>
                ${isMaster ? `
                  <button class="btn-text btn-del-photo" data-id="${photo.id}" style="color:#a7464c; padding:0 4px;" title="删除">🗑️</button>
                ` : ''}
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    this.bindDetailEvents(container, album);
  }

  bindDetailEvents(container, album) {
    container.querySelector('#btn-back-to-albums')?.addEventListener('click', () => {
      this.currentAlbumId = null;
      this.render(container);
    });

    const uploadInput = container.querySelector('#input-upload-photos');
    uploadInput?.addEventListener('change', async (e) => {
      const files = Array.from(e.target.files);
      if (files.length === 0) return;

      window.spaceApp?.showToast(`正在前端轻量视网膜压缩 (${files.length} 张)...`);

      for (const file of files) {
        try {
          const compressed = await this.compressImage(file);
          const photoData = {
            id: 'photo_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
            albumId: album.id,
            title: file.name.replace(/\.[^/.]+$/, ''),
            date: new Date().toISOString().split('T')[0],
            dataUrl: compressed.dataUrl
          };
          await window.spaceStore.savePhoto(photoData);
        } catch (err) {
          console.error('压缩失败:', err);
        }
      }

      const updated = await window.spaceStore.getPhotosByAlbum(album.id);
      album.count = updated.length;
      const all = window.spaceStore.getAlbums();
      const found = all.find(x => x.id === album.id);
      if (found) found.count = updated.length;
      window.spaceStore.saveAlbums(all);

      window.spaceApp?.showToast('照片已上传并持久化保存！', 'good');
      this.render(container);
    });

    container.querySelectorAll('.photo-item').forEach(card => {
      card.addEventListener('click', (e) => {
        if (e.target.closest('.btn-del-photo')) return;
        this.openLightbox(parseInt(card.dataset.index, 10));
      });
    });

    container.querySelectorAll('.btn-del-photo').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        if (confirm('确认删除这张照片吗？')) {
          await window.spaceStore.deletePhoto(btn.dataset.id);
          this.render(container);
        }
      });
    });
  }

  // 纯前端 Canvas 视网膜级轻量压缩
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

          let dataUrl = canvas.toDataURL('image/webp', quality);
          if (!dataUrl.startsWith('data:image/webp')) {
            dataUrl = canvas.toDataURL('image/jpeg', quality);
          }
          resolve({ dataUrl });
        };
        img.onerror = reject;
        img.src = e.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  openAlbumModal(album = null) {
    const isEdit = !!album;
    const modalHtml = `
      <div class="overlay" id="album-modal">
        <div class="sheet">
          <div class="sheet-head">
            <h3>${isEdit ? '编辑相簿信息' : '创建新岁月相簿'}</h3>
            <button class="logout" id="album-modal-close" style="font-size:18px;">×</button>
          </div>
          <form id="album-form" class="login-form">
            <div>
              <label class="form-label">相簿名称 *</label>
              <input type="text" name="title" class="input" placeholder="输入相册名称" value="${album ? this.escapeHtml(album.title) : ''}" required>
            </div>
            <div>
              <label class="form-label">权限空间设定</label>
              <select name="visibility" class="select">
                <option value="living_room" ${album?.visibility === 'living_room' ? 'selected' : ''}>🛋️ 客厅开放 (来宾密码可见)</option>
                <option value="bedroom" ${album?.visibility === 'bedroom' ? 'selected' : ''}>🛏️ 卧室私密 (仅主人密码可见)</option>
              </select>
            </div>
            <div>
              <label class="form-label">相簿寄语 / 描述</label>
              <textarea name="desc" class="textarea" rows="3" placeholder="写下一两句时光箴言...">${album ? this.escapeHtml(album.desc || '') : ''}</textarea>
            </div>
            <div style="display:flex; justify-content:flex-end; gap:10px; margin-top:10px;">
              <button type="button" class="btn btn-outline" id="album-modal-cancel">取消</button>
              <button type="submit" class="btn btn-primary">保存相簿</button>
            </div>
          </form>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);
    const modalEl = document.getElementById('album-modal');
    const close = () => modalEl && modalEl.remove();

    modalEl.querySelector('#album-modal-close').addEventListener('click', close);
    modalEl.querySelector('#album-modal-cancel').addEventListener('click', close);

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
        list.push({
          id: 'album_' + Date.now(),
          title: fd.get('title'),
          visibility: fd.get('visibility'),
          desc: fd.get('desc'),
          createdAt: new Date().toISOString().split('T')[0],
          count: 0
        });
      }

      window.spaceStore.saveAlbums(list);
      close();
      const container = document.getElementById('content-albums');
      if (container) this.render(container);
    });
  }

  // 大图全屏灯箱
  openLightbox(index) {
    if (!this.currentPhotos[index]) return;
    this.activePhotoIndex = index;
    const photo = this.currentPhotos[index];

    const lbHtml = `
      <div class="overlay" id="lightbox-modal" style="background: rgba(11, 39, 58, 0.94);">
        <button class="logout" id="lb-close" style="position:absolute; top:20px; right:20px; font-size:28px; color:#fff;">×</button>
        <button class="btn btn-outline" id="lb-prev" style="position:absolute; left:20px; top:50%; transform:translateY(-50%);">‹</button>
        <button class="btn btn-outline" id="lb-next" style="position:absolute; right:20px; top:50%; transform:translateY(-50%);">›</button>
        <div style="text-align:center; max-width:90vw;">
          <img src="${photo.dataUrl}" id="lb-img" style="max-width:100%; max-height:80vh; border-radius:12px; box-shadow:0 12px 35px rgba(0,0,0,0.5);">
          <div style="color:#fff; margin-top:12px; font-size:14px; font-weight:700;" id="lb-caption">${this.escapeHtml(photo.title)}</div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', lbHtml);
    const modalEl = document.getElementById('lightbox-modal');

    const update = (newIdx) => {
      this.activePhotoIndex = newIdx;
      const p = this.currentPhotos[newIdx];
      modalEl.querySelector('#lb-img').src = p.dataUrl;
      modalEl.querySelector('#lb-caption').innerText = p.title || '美好瞬间';
    };

    modalEl.querySelector('#lb-close').addEventListener('click', () => modalEl.remove());
    modalEl.querySelector('#lb-prev').addEventListener('click', (e) => {
      e.stopPropagation();
      const prev = (this.activePhotoIndex - 1 + this.currentPhotos.length) % this.currentPhotos.length;
      update(prev);
    });
    modalEl.querySelector('#lb-next').addEventListener('click', (e) => {
      e.stopPropagation();
      const next = (this.activePhotoIndex + 1) % this.currentPhotos.length;
      update(next);
    });
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
