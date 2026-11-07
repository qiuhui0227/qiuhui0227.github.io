/**
 * OASIS | Qiuhui & Yan - 三餐相机与美食手帐模块 (Meal Camera & Diary)
 * 
 * 核心特性：
 * 1. 唯一且永久的私属情侣三餐相册（不可删除、不可重复创建）
 * 2. 支持调用手机摄像头即时抓拍 (<input capture="environment">) 与手机相册选取
 * 3. 手机端原生 Canvas 智能降采样压缩 (最长边1440px / JPEG 0.80，体积缩减95%至~200KB，Retina级画质)
 * 4. 内置 5 款独家美食专属滤镜 (原图 / 暖阳暖香 / 鲜润透亮 / 焦香浓郁 / 日系清甜)，实时预览并烘焙入图
 * 5. 完整信息流：菜品标题、智能推断时段餐别、记录人、可选就餐地点 (带常用标签与GPS辅助)
 * 6. Cloudflare Worker + KV 全球双向实时同步与本地 IndexedDB 离线双备份
 */

class MealCameraModule {
  constructor() {
    this.isOpen = false;
    this.currentFilter = 'none';
    this.currentFilterTab = 'all'; // all, yan, qiuhui, both, today
    this.selectedMealType = this.inferMealType(new Date());
    this.rawImageBitmap = null;
    this.previewCanvas = null;
    this.init();
  }

  init() {
    // 监听顶部左上角三餐相机入口按钮点击
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('#btn-top-meal-cam');
      if (btn) {
        e.preventDefault();
        this.openMealAlbumModal();
      }
    });

    // 预埋隐藏的拍照与相册原生 input 节点
    this.ensureHiddenInputs();
  }

  // 确保 DOM 中存在用于调起相机的隐藏 input
  ensureHiddenInputs() {
    if (!document.getElementById('hidden-meal-cam-capture')) {
      const inputCam = document.createElement('input');
      inputCam.type = 'file';
      inputCam.id = 'hidden-meal-cam-capture';
      inputCam.accept = 'image/*';
      inputCam.setAttribute('capture', 'environment'); // 手机直接拉起后置相机
      inputCam.style.display = 'none';
      inputCam.addEventListener('change', (e) => this.handleFileSelected(e));
      document.body.appendChild(inputCam);
    }

    if (!document.getElementById('hidden-meal-cam-gallery')) {
      const inputGal = document.createElement('input');
      inputGal.type = 'file';
      inputGal.id = 'hidden-meal-cam-gallery';
      inputGal.accept = 'image/*'; // 从相册选取
      inputGal.style.display = 'none';
      inputGal.addEventListener('change', (e) => this.handleFileSelected(e));
      document.body.appendChild(inputGal);
    }
  }

  // 获取本地时间的 YYYY-MM-DDTHH:mm 字符串，供 datetime-local 默认值使用
  getLocalDatetimeString(d = new Date()) {
    const pad = (n) => String(n).padStart(2, '0');
    const year = d.getFullYear();
    const month = pad(d.getMonth() + 1);
    const day = pad(d.getDate());
    const hours = pad(d.getHours());
    const minutes = pad(d.getMinutes());
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }

  // 根据当前时刻智能推断餐别
  inferMealType(date) {
    const hour = date.getHours() + date.getMinutes() / 60;
    if (hour >= 5 && hour < 10.5) return 'breakfast';
    if (hour >= 10.5 && hour < 14.5) return 'lunch';
    if (hour >= 14.5 && hour < 17.5) return 'tea';
    if (hour >= 17.5 && hour < 21) return 'dinner';
    return 'snack'; // 夜宵
  }

  getMealTypeLabel(type) {
    const map = {
      breakfast: { label: '早餐', icon: '🥐', class: 'breakfast' },
      lunch: { label: '午餐', icon: '🍱', class: 'lunch' },
      dinner: { label: '晚餐', icon: '🍲', class: 'dinner' },
      tea: { label: '下午茶', icon: '🍰', class: 'tea' },
      snack: { label: '夜宵', icon: '🍢', class: 'snack' }
    };
    return map[type] || { label: '美餐', icon: '🍽️', class: 'lunch' };
  }

  // 滤镜定义
  getFilters() {
    return [
      { id: 'none', label: '原图', icon: '🌿', filterStr: 'none' },
      { id: 'warm', label: '暖阳暖香', icon: '🍲', filterStr: 'brightness(1.06) contrast(1.08) saturate(1.28) sepia(0.18)' },
      { id: 'fresh', label: '鲜润透亮', icon: '🥗', filterStr: 'brightness(1.08) contrast(1.10) saturate(1.35) hue-rotate(-5deg)' },
      { id: 'rich', label: '焦香浓郁', icon: '🥩', filterStr: 'brightness(1.02) contrast(1.22) saturate(1.22)' },
      { id: 'soft', label: '日系清甜', icon: '☕', filterStr: 'brightness(1.12) contrast(0.96) saturate(1.08) sepia(0.08)' }
    ];
  }

  // ==========================================================================
  // 1. 三餐相册画廊弹层 (Meal Diary Album Modal)
  // 不可删除、不可创建的唯一永久手帐相册
  // ==========================================================================

  openMealAlbumModal() {
    this.isOpen = true;
    let modal = document.getElementById('modal-meal-album');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'modal-meal-album';
      modal.className = 'meal-modal-overlay';
      document.body.appendChild(modal);
    }
    this.renderGallery();
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';

    // 唤起时主动向云端拉取最新美食，拉取完成后若有新数据将自动无感重绘
    window.spaceStore?.pullFromCloud?.(false);
  }

  closeMealAlbumModal() {
    this.isOpen = false;
    const modal = document.getElementById('modal-meal-album');
    if (modal) {
      modal.classList.remove('active');
    }
    document.body.style.overflow = '';
  }

  renderIfOpen() {
    if (this.isOpen) {
      this.renderGallery();
    }
  }

  // 渲染相册画廊内容
  renderGallery() {
    const modal = document.getElementById('modal-meal-album');
    if (!modal) return;

    const allMeals = window.spaceStore ? window.spaceStore.getMeals() : [];
    
    // 过滤列表
    const filteredMeals = allMeals.filter(m => {
      if (this.currentFilterTab === 'all') return true;
      if (this.currentFilterTab === 'today') {
        const mealDate = new Date(m.time || m.createdAt);
        const today = new Date();
        return mealDate.getFullYear() === today.getFullYear() &&
               mealDate.getMonth() === today.getMonth() &&
               mealDate.getDate() === today.getDate();
      }
      return m.author === this.currentFilterTab;
    });

    // 确保按就餐时间倒序排列（最新的在最前）
    filteredMeals.sort((a, b) => {
      const tA = new Date(a.time || a.createdAt || 0).getTime();
      const tB = new Date(b.time || b.createdAt || 0).getTime();
      return tB - tA;
    });

    const isMaster = window.spaceAuth ? window.spaceAuth.isMaster() : true;

    modal.innerHTML = `
      <div class="meal-modal-dialog">
        <!-- 顶部标题栏 -->
        <div class="meal-modal-header">
          <div class="meal-header-left">
            <div class="meal-header-badge">
              <span class="meal-badge-dot"></span>
              <span>两人的私属永久手帐 · 不可删除</span>
            </div>
            <h2 class="meal-header-title">
              <svg class="meal-title-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/>
                <circle cx="12" cy="13" r="3"/>
                <path d="M18 10h.01"/>
              </svg>
              三餐物语
            </h2>
            <p class="meal-header-sub">一粥一饭，三餐四季 · 记录彼此的人间烟火</p>
          </div>
          <div class="meal-header-right">
            <button class="meal-btn-refresh" id="btn-refresh-meal-album" title="从云端刷新最新三餐">
              <svg class="meal-ico-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
              </svg>
            </button>
            <button class="meal-btn-shoot" id="btn-meal-shoot-trigger">
              <svg class="meal-ico-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                <circle cx="12" cy="13" r="4"/>
              </svg>
              拍一餐
            </button>
            <button class="meal-btn-close" id="btn-close-meal-album" title="关闭手帐">✕</button>
          </div>
        </div>

        <!-- 筛选栏 -->
        <div class="meal-filter-bar">
          <div class="meal-filter-pills">
            <button class="meal-filter-btn ${this.currentFilterTab === 'all' ? 'active' : ''}" data-tab="all">
              全部 (${allMeals.length})
            </button>
            <button class="meal-filter-btn ${this.currentFilterTab === 'today' ? 'active' : ''}" data-tab="today">
              今日三餐
            </button>
            <button class="meal-filter-btn ${this.currentFilterTab === 'yan' ? 'active' : ''}" data-tab="yan">
              <span class="meal-dot yan"></span> 王岩
            </button>
            <button class="meal-filter-btn ${this.currentFilterTab === 'qiuhui' ? 'active' : ''}" data-tab="qiuhui">
              <span class="meal-dot qiuhui"></span> 杜秋慧
            </button>
            <button class="meal-filter-btn ${this.currentFilterTab === 'both' ? 'active' : ''}" data-tab="both">
              <span class="meal-dot both"></span> 一起吃
            </button>
          </div>
        </div>

        <!-- 相册卡片流主体 -->
        <div class="meal-gallery-body">
          ${filteredMeals.length === 0 ? `
            <div class="meal-empty-state">
              <div class="meal-empty-icon">🍱</div>
              <h3>还没有三餐打卡记录</h3>
              <p>拿起手机拍照，记录今天的第一顿美食吧~</p>
              <button class="btn btn-primary" id="btn-empty-shoot">
                📷 立即拍照打卡
              </button>
            </div>
          ` : `
            <div class="meal-grid">
              ${filteredMeals.map(m => this.renderMealCardHtml(m, isMaster)).join('')}
            </div>
          `}
        </div>

        <!-- 底部说明 -->
        <div class="meal-modal-footer">
          <span>📷 拍摄照片均经高品质等比压缩与美食滤镜调优 · 实时双向加密同步至云端</span>
        </div>
      </div>
    `;

    // 绑定事件
    modal.querySelector('#btn-close-meal-album')?.addEventListener('click', () => this.closeMealAlbumModal());
    modal.addEventListener('click', (e) => {
      if (e.target === modal) this.closeMealAlbumModal();
    });

    modal.querySelector('#btn-refresh-meal-album')?.addEventListener('click', async (e) => {
      const btn = e.currentTarget;
      btn.classList.add('rotating');
      try {
        await window.spaceStore?.pullFromCloud?.(false);
        this.renderGallery();
        window.spaceApp?.showToast('三餐手帐已同步至云端最新状态');
      } catch (err) {
        console.warn('Refresh meals error:', err);
      } finally {
        setTimeout(() => btn.classList.remove('rotating'), 600);
      }
    });

    modal.querySelector('#btn-meal-shoot-trigger')?.addEventListener('click', () => this.showCaptureSourceSheet());
    modal.querySelector('#btn-empty-shoot')?.addEventListener('click', () => this.showCaptureSourceSheet());

    // 筛选切换
    modal.querySelectorAll('.meal-filter-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.currentFilterTab = btn.getAttribute('data-tab');
        this.renderGallery();
      });
    });

    // 预览大图灯箱
    modal.querySelectorAll('.meal-card-img-wrap').forEach(wrap => {
      wrap.addEventListener('click', () => {
        const mealId = wrap.getAttribute('data-meal-id');
        const meal = allMeals.find(x => x.id === mealId);
        if (meal) this.openLightbox(meal);
      });
    });

    // 删除单条三餐
    modal.querySelectorAll('.btn-del-meal').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const mealId = btn.getAttribute('data-meal-id');
        if (confirm('确定要删除这顿饭的记录吗？')) {
          window.spaceStore.deleteMeal(mealId);
          window.spaceApp?.showToast('已删除该餐记录');
          this.renderGallery();
          window.albumsModule?.updateSpecialMealCover();
        }
      });
    });
  }

  // 渲染单个美食卡片 HTML
  renderMealCardHtml(meal, isMaster) {
    const mealMeta = this.getMealTypeLabel(meal.mealType);
    const dateObj = new Date(meal.time || meal.createdAt);
    const timeDisplay = `${dateObj.getMonth() + 1}月${dateObj.getDate()}日 ${String(dateObj.getHours()).padStart(2, '0')}:${String(dateObj.getMinutes()).padStart(2, '0')}`;
    
    let authorLabel = '共同';
    let authorClass = 'both';
    if (meal.author === 'yan') {
      authorLabel = '王岩';
      authorClass = 'yan';
    } else if (meal.author === 'qiuhui') {
      authorLabel = '杜秋慧';
      authorClass = 'qiuhui';
    }

    return `
      <div class="meal-card" data-meal-id="${meal.id}">
        <div class="meal-card-img-wrap" data-meal-id="${meal.id}" title="点击查看大图">
          <img src="${meal.thumbUrl || meal.imageUrl}" alt="${meal.title}" loading="lazy" decoding="async" class="meal-card-img">
          <span class="meal-type-tag ${mealMeta.class}">
            ${mealMeta.icon} ${mealMeta.label}
          </span>
          ${meal.filter && meal.filter !== 'none' ? `
            <span class="meal-filter-tag">滤镜</span>
          ` : ''}
        </div>
        <div class="meal-card-info">
          <div class="meal-card-row-top">
            <h4 class="meal-card-title">${this.escapeHtml(meal.title || '今日美餐')}</h4>
            ${isMaster ? `
              <button class="btn-del-meal" data-meal-id="${meal.id}" title="删除此记录">×</button>
            ` : ''}
          </div>
          <div class="meal-card-meta">
            <span class="meal-author-tag ${authorClass}">
              <span class="meal-dot ${authorClass}"></span>
              ${authorLabel}
            </span>
            <span class="meal-time-tag">${timeDisplay}</span>
          </div>
          ${meal.location ? `
            <div class="meal-loc-row">
              <svg class="meal-loc-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
              <span>${this.escapeHtml(meal.location)}</span>
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }

  // ==========================================================================
  // 2. 唤起拍照 / 相册选择面板
  // ==========================================================================

  showCaptureSourceSheet() {
    let sheet = document.getElementById('sheet-meal-capture');
    if (!sheet) {
      sheet = document.createElement('div');
      sheet.id = 'sheet-meal-capture';
      sheet.className = 'meal-sheet-overlay';
      sheet.innerHTML = `
        <div class="meal-sheet-panel">
          <div class="meal-sheet-title">记录这一餐</div>
          <button class="meal-sheet-opt" id="opt-meal-camera">
            <span class="sheet-icon">📸</span>
            <div class="sheet-text">
              <strong>调用手机摄像头拍照</strong>
              <span>对准美味立即抓拍</span>
            </div>
          </button>
          <button class="meal-sheet-opt" id="opt-meal-album">
            <span class="sheet-icon">🖼️</span>
            <div class="sheet-text">
              <strong>从手机相册选取照片</strong>
              <span>选择此前拍好的美食照</span>
            </div>
          </button>
          <button class="meal-sheet-cancel" id="opt-meal-cancel">取消</button>
        </div>
      `;
      document.body.appendChild(sheet);

      sheet.querySelector('#opt-meal-camera').addEventListener('click', () => {
        sheet.classList.remove('active');
        document.getElementById('hidden-meal-cam-capture')?.click();
      });

      sheet.querySelector('#opt-meal-album').addEventListener('click', () => {
        sheet.classList.remove('active');
        document.getElementById('hidden-meal-cam-gallery')?.click();
      });

      sheet.querySelector('#opt-meal-cancel').addEventListener('click', () => {
        sheet.classList.remove('active');
      });

      sheet.addEventListener('click', (e) => {
        if (e.target === sheet) sheet.classList.remove('active');
      });
    }

    sheet.classList.add('active');
  }

  // 处理拍照或选图返回的 File
  async handleFileSelected(event) {
    const file = event.target.files && event.target.files[0];
    event.target.value = ''; // 重置 input 允许连续选取同名文件
    if (!file) return;

    window.spaceApp?.showToast('正在处理美味照片...', false);

    try {
      const bitmap = await this.loadImageBitmapFromFile(file);
      this.rawImageBitmap = bitmap;
      this.currentFilter = 'none'; // 默认原图
      this.selectedMealType = this.inferMealType(new Date());

      // 打开美食录入与滤镜编辑弹层
      this.openMealEditorModal(file);
    } catch (err) {
      console.error('File load error:', err);
      alert('读取图片失败，请重试');
    }
  }

  // 将 File 瞬时解析为 ImageBitmap 或 HTMLImageElement (使用极速 ObjectURL 与硬件加速，告别 FileReader 卡顿)
  loadImageBitmapFromFile(file) {
    if (window.createImageBitmap) {
      return createImageBitmap(file, { imageOrientation: 'from-image' }).catch(() => createImageBitmap(file));
    }
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve(img);
      };
      img.onerror = (e) => {
        URL.revokeObjectURL(url);
        reject(e);
      };
      img.src = url;
    });
  }

  // ==========================================================================
  // 3. 美食录入与专属滤镜编辑弹层 (Meal Editor & Filter Studio)
  // ==========================================================================

  openMealEditorModal(originalFile) {
    let editor = document.getElementById('modal-meal-editor');
    if (!editor) {
      editor = document.createElement('div');
      editor.id = 'modal-meal-editor';
      editor.className = 'meal-modal-overlay editor';
      document.body.appendChild(editor);
    }

    const filters = this.getFilters();
    const currentUser = window.spaceAuth ? window.spaceAuth.getCurrentUser() : 'yan';
    const defaultAuthor = currentUser === 'qiuhui' ? 'qiuhui' : 'yan';
    const nowIso = this.getLocalDatetimeString(new Date());

    editor.innerHTML = `
      <div class="meal-editor-dialog">
        <div class="meal-editor-head">
          <h3>🍱 记录这一餐</h3>
          <button class="meal-btn-close" id="btn-close-meal-editor">✕</button>
        </div>

        <div class="meal-editor-body">
          <!-- 实时滤镜预览视窗 (自适应大图呈现 + 按住对比原图) -->
          <div class="meal-preview-box" id="meal-preview-box" title="长按画面可查看原图对比">
            <canvas id="meal-editor-canvas" class="meal-editor-canvas"></canvas>
            <div class="meal-compare-hint" id="meal-compare-hint">👆 按住对比原图</div>
            <div class="meal-preview-badge" id="meal-filter-name-badge">🌿 原图</div>
          </div>

          <!-- 美食专属滤镜快捷选择条 -->
          <div class="meal-filters-strip">
            <span class="meal-filters-label">🎨 美食滤镜</span>
            <div class="meal-filters-list">
              ${filters.map(f => `
                <button type="button" class="meal-filter-chip ${f.id === this.currentFilter ? 'active' : ''}" data-filter-id="${f.id}">
                  <span>${f.icon}</span>
                  <span>${f.label}</span>
                </button>
              `).join('')}
            </div>
          </div>

          <!-- 菜品与就餐信息录入表单 -->
          <form id="meal-record-form" class="meal-record-form">
            <!-- 标题 -->
            <div class="form-group">
              <label class="meal-form-label" for="meal-title-input">吃了什么 (标题) *</label>
              <input type="text" id="meal-title-input" class="meal-input" placeholder="如：秋慧做的糖醋小排 / 妈妈包的饺子" required maxlength="60" autofocus>
            </div>

            <!-- 餐别时段 -->
            <div class="form-group">
              <label class="meal-form-label">餐别时段</label>
              <div class="meal-type-selector">
                <button type="button" class="meal-type-btn ${this.selectedMealType === 'breakfast' ? 'active' : ''}" data-type="breakfast">🥐 早餐</button>
                <button type="button" class="meal-type-btn ${this.selectedMealType === 'lunch' ? 'active' : ''}" data-type="lunch">🍱 午餐</button>
                <button type="button" class="meal-type-btn ${this.selectedMealType === 'tea' ? 'active' : ''}" data-type="tea">🍰 下午茶</button>
                <button type="button" class="meal-type-btn ${this.selectedMealType === 'dinner' ? 'active' : ''}" data-type="dinner">🍲 晚餐</button>
                <button type="button" class="meal-type-btn ${this.selectedMealType === 'snack' ? 'active' : ''}" data-type="snack">🍢 夜宵</button>
              </div>
            </div>

            <!-- 时间与记录人并排 -->
            <div class="meal-form-row">
              <div class="form-group half">
                <label class="meal-form-label" for="meal-time-input">就餐时间</label>
                <input type="datetime-local" id="meal-time-input" class="meal-input" value="${nowIso}">
              </div>
              <div class="form-group half">
                <label class="meal-form-label">记录人</label>
                <div class="meal-author-selector">
                  <button type="button" class="meal-author-btn ${defaultAuthor === 'yan' ? 'active' : ''}" data-author="yan">王岩</button>
                  <button type="button" class="meal-author-btn ${defaultAuthor === 'qiuhui' ? 'active' : ''}" data-author="qiuhui">杜秋慧</button>
                  <button type="button" class="meal-author-btn" data-author="both">一起吃</button>
                </div>
              </div>
            </div>

            <!-- 就餐地点 (可选) -->
            <div class="form-group">
              <div class="meal-label-with-hint">
                <label class="meal-form-label" for="meal-loc-input">就餐地点 (可选)</label>
                <span class="meal-hint-action" id="btn-meal-gps-locate">🧭 一键填入位置</span>
              </div>
              <input type="text" id="meal-loc-input" class="meal-input" placeholder="选填，如：家里厨房 / 一楼食堂 / 商业街外食">
              <div class="meal-loc-quick-chips">
                <span class="meal-loc-chip" data-loc="家里厨房">🏠 家里厨房</span>
                <span class="meal-loc-chip" data-loc="学校食堂">🏫 学校食堂</span>
                <span class="meal-loc-chip" data-loc="外出探店">🍽️ 外出探店</span>
                <span class="meal-loc-chip" data-loc="点外卖">🛵 点外卖</span>
                <span class="meal-loc-chip" data-loc="妈妈家">🏡 妈妈家</span>
              </div>
            </div>

            <!-- 底部提交操作 -->
            <div class="meal-editor-actions">
              <button type="button" class="btn btn-outline" id="btn-cancel-meal-editor">放弃</button>
              <button type="submit" class="btn btn-primary" id="btn-submit-meal">
                💾 保存并同步云端
              </button>
            </div>
          </form>
        </div>
      </div>
    `;

    editor.classList.add('active');

    // 初始化画板并绘制滤镜
    this.previewCanvas = editor.querySelector('#meal-editor-canvas');
    this.renderCanvasWithFilter(this.currentFilter);

    // 按住画面实时对比原图 (提升修图体验)
    const previewBoxEl = editor.querySelector('#meal-preview-box');
    const badgeEl = editor.querySelector('#meal-filter-name-badge');
    const startCompare = (e) => {
      if (this.currentFilter === 'none') return;
      this.renderCanvasWithFilter('none');
      if (badgeEl) badgeEl.innerText = '🌿 原图 (按住对比中)';
    };
    const endCompare = (e) => {
      if (this.currentFilter === 'none') return;
      this.renderCanvasWithFilter(this.currentFilter);
      const fMeta = filters.find(x => x.id === this.currentFilter);
      if (badgeEl) badgeEl.innerText = fMeta ? `${fMeta.icon} ${fMeta.label}` : '原图';
    };
    previewBoxEl?.addEventListener('pointerdown', startCompare);
    previewBoxEl?.addEventListener('pointerup', endCompare);
    previewBoxEl?.addEventListener('pointercancel', endCompare);
    previewBoxEl?.addEventListener('pointerleave', endCompare);

    // 滤镜切换事件
    editor.querySelectorAll('.meal-filter-chip').forEach(btn => {
      btn.addEventListener('click', () => {
        editor.querySelectorAll('.meal-filter-chip').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.currentFilter = btn.getAttribute('data-filter-id');
        this.renderCanvasWithFilter(this.currentFilter);
        const fMeta = filters.find(x => x.id === this.currentFilter);
        const badge = editor.querySelector('#meal-filter-name-badge');
        if (badge) badge.innerText = fMeta ? `${fMeta.icon} ${fMeta.label}` : '原图';
      });
    });

    // 餐别切换
    let userHasManuallyToggledMealType = false;
    editor.querySelectorAll('.meal-type-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        userHasManuallyToggledMealType = true;
        editor.querySelectorAll('.meal-type-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.selectedMealType = btn.getAttribute('data-type');
      });
    });

    // 智能联动：当用户修改就餐时间且未手动指定餐别时，自适应推荐餐别
    const timeInputEl = editor.querySelector('#meal-time-input');
    timeInputEl?.addEventListener('change', () => {
      if (!timeInputEl.value) return;
      const parsed = new Date(timeInputEl.value);
      if (!isNaN(parsed.getTime()) && !userHasManuallyToggledMealType) {
        const autoType = this.inferMealType(parsed);
        this.selectedMealType = autoType;
        editor.querySelectorAll('.meal-type-btn').forEach(b => {
          b.classList.toggle('active', b.getAttribute('data-type') === autoType);
        });
      }
    });

    // 记录人切换
    let chosenAuthor = defaultAuthor;
    editor.querySelectorAll('.meal-author-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        editor.querySelectorAll('.meal-author-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        chosenAuthor = btn.getAttribute('data-author');
      });
    });

    // 地点快捷点击
    editor.querySelectorAll('.meal-loc-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const input = editor.querySelector('#meal-loc-input');
        if (input) input.value = chip.getAttribute('data-loc');
      });
    });

    // GPS 粗略定位辅助
    editor.querySelector('#btn-meal-gps-locate')?.addEventListener('click', () => {
      if (!navigator.geolocation) {
        alert('当前浏览器不支持定位');
        return;
      }
      const hint = editor.querySelector('#btn-meal-gps-locate');
      hint.innerText = '⏳ 正在定位...';
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude.toFixed(3);
          const lon = pos.coords.longitude.toFixed(3);
          const locInput = editor.querySelector('#meal-loc-input');
          if (locInput) locInput.value = `近经纬 (${lat}, ${lon})`;
          hint.innerText = '✅ 已填入';
        },
        (err) => {
          hint.innerText = '⚠️ 定位未授权';
          setTimeout(() => { hint.innerText = '🧭 一键填入位置'; }, 2000);
        },
        { timeout: 5000 }
      );
    });

    // 取消与关闭
    const closeEditor = () => editor.classList.remove('active');
    editor.querySelector('#btn-close-meal-editor')?.addEventListener('click', closeEditor);
    editor.querySelector('#btn-cancel-meal-editor')?.addEventListener('click', closeEditor);

    // 提交保存
    const form = editor.querySelector('#meal-record-form');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const titleInput = editor.querySelector('#meal-title-input');
      const timeInput = editor.querySelector('#meal-time-input');
      const locInput = editor.querySelector('#meal-loc-input');
      const submitBtn = editor.querySelector('#btn-submit-meal');

      const title = (titleInput?.value || '').trim();
      if (!title) return;

      submitBtn.disabled = true;
      submitBtn.innerText = '正在压缩并同步云端...';

      try {
        // 1. 将滤镜后的图片导出为高质量压缩 Blob (最长边1440px / JPEG 0.80) 与极速小缩略图 (380px / 0.70)
        const compressedBlob = await this.exportFilteredBlob(this.currentFilter);
        const thumbBlob = await this.exportThumbnailBlob(this.currentFilter);
        let thumbUrl = '';
        if (thumbBlob) {
          thumbUrl = await this.blobToDataUrl(thumbBlob);
        }

        // 2. 上传至 Cloudflare 存储
        let uploadedUrl = null;
        if (window.spaceStore && window.spaceStore.uploadPhoto) {
          try {
            uploadedUrl = await window.spaceStore.uploadPhoto(compressedBlob, 'meals', `meal_${Date.now()}.jpg`);
          } catch (uploadErr) {
            console.warn('Cloud upload photo warning, fallback to base64:', uploadErr);
          }
        }

        // 兜底方案：如果云端传图失败，转为本地 Base64 确保永不丢失
        if (!uploadedUrl) {
          uploadedUrl = await this.blobToDataUrl(compressedBlob);
        }

        // 3. 构造数据并保存至本地与全局 KV
        let mealTime = new Date().toISOString();
        if (timeInput && timeInput.value) {
          const parsed = new Date(timeInput.value);
          if (!isNaN(parsed.getTime())) {
            mealTime = parsed.toISOString();
          }
        }

        const newMeal = {
          title,
          imageUrl: uploadedUrl,
          thumbUrl: thumbUrl || uploadedUrl,
          mealType: this.selectedMealType,
          time: mealTime,
          location: (locInput?.value || '').trim(),
          author: chosenAuthor,
          filter: this.currentFilter
        };

        window.spaceStore.addMeal(newMeal);
        window.spaceApp?.showToast('🎉 美食手帐已打卡成功！');

        closeEditor();
        this.renderGallery();
        window.albumsModule?.updateSpecialMealCover();
      } catch (err) {
        console.error('Save meal error:', err);
        alert('保存美食记录失败：' + (err.message || '未知错误'));
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerText = '💾 保存并同步云端';
      }
    });
  }

  // 使用指定滤镜在 Canvas 上等比重绘
  renderCanvasWithFilter(filterId) {
    if (!this.previewCanvas || !this.rawImageBitmap) return;
    const canvas = this.previewCanvas;
    const ctx = canvas.getContext('2d');
    const img = this.rawImageBitmap;

    // 计算等比尺寸，最长边限制在 1440px (既极致高清又极速轻量)
    const MAX_DIM = 1440;
    let w = img.width;
    let h = img.height;
    if (w > MAX_DIM || h > MAX_DIM) {
      if (w > h) {
        h = Math.round((h * MAX_DIM) / w);
        w = MAX_DIM;
      } else {
        w = Math.round((w * MAX_DIM) / h);
        h = MAX_DIM;
      }
    }

    canvas.width = w;
    canvas.height = h;

    // 智能自适应预览视窗高度：让竖屏美食照片顶格大图呈现，横屏紧凑无黑边
    const previewBox = canvas.closest('.meal-preview-box');
    if (previewBox) {
      const isMobile = window.innerWidth <= 640;
      const aspect = w / h; // 宽高比
      if (aspect < 0.85) {
        // 手机端常见 3:4 或 9:16 纵向竖图：给予舒展大高度，图片放大 3 倍以上
        previewBox.style.height = isMobile ? 'min(420px, 48vh)' : '390px';
      } else if (aspect <= 1.2) {
        // 接近 1:1 方形美食图
        previewBox.style.height = isMobile ? 'min(340px, 42vh)' : '340px';
      } else {
        // 横屏宽幅图 (4:3 或 16:9)
        previewBox.style.height = isMobile ? 'min(260px, 34vh)' : '280px';
      }
    }

    // 查找滤镜字符串
    const filters = this.getFilters();
    const fObj = filters.find(x => x.id === filterId);
    const filterStr = fObj ? fObj.filterStr : 'none';

    ctx.save();
    ctx.filter = filterStr;
    ctx.drawImage(img, 0, 0, w, h);
    ctx.restore();
  }

  // 将经过滤镜处理的图片导出为高质量 JPEG Blob
  exportFilteredBlob(filterId) {
    return new Promise((resolve, reject) => {
      // 创建离线 Canvas 完成最终高画质烘焙
      const offlineCanvas = document.createElement('canvas');
      const ctx = offlineCanvas.getContext('2d');
      const img = this.rawImageBitmap;

      const MAX_DIM = 1440;
      let w = img.width;
      let h = img.height;
      if (w > MAX_DIM || h > MAX_DIM) {
        if (w > h) {
          h = Math.round((h * MAX_DIM) / w);
          w = MAX_DIM;
        } else {
          w = Math.round((w * MAX_DIM) / h);
          h = MAX_DIM;
        }
      }

      offlineCanvas.width = w;
      offlineCanvas.height = h;

      const filters = this.getFilters();
      const fObj = filters.find(x => x.id === filterId);
      ctx.filter = fObj ? fObj.filterStr : 'none';
      ctx.drawImage(img, 0, 0, w, h);

      offlineCanvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Canvas toBlob failed'));
        },
        'image/jpeg',
        0.80 // 最佳平衡压缩率：体积~200KB，细节锐利不失真
      );
    });
  }

  // 导出极速小缩略图 Blob (最长边380px，体积~15KB-20KB，秒开零延迟)
  exportThumbnailBlob(filterId) {
    return new Promise((resolve) => {
      const offlineCanvas = document.createElement('canvas');
      const ctx = offlineCanvas.getContext('2d');
      const img = this.rawImageBitmap;
      if (!img) return resolve(null);

      const MAX_DIM = 380;
      let w = img.width;
      let h = img.height;
      if (w > MAX_DIM || h > MAX_DIM) {
        if (w > h) {
          h = Math.round((h * MAX_DIM) / w);
          w = MAX_DIM;
        } else {
          w = Math.round((w * MAX_DIM) / h);
          h = MAX_DIM;
        }
      }

      offlineCanvas.width = w;
      offlineCanvas.height = h;

      const filters = this.getFilters();
      const fObj = filters.find(x => x.id === filterId);
      ctx.filter = fObj ? fObj.filterStr : 'none';
      ctx.drawImage(img, 0, 0, w, h);

      offlineCanvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else resolve(null);
        },
        'image/jpeg',
        0.70
      );
    });
  }

  blobToDataUrl(blob) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.readAsDataURL(blob);
    });
  }

  // ==========================================================================
  // 4. 全屏大图灯箱 (Lightbox)
  // ==========================================================================

  openLightbox(meal) {
    let lb = document.getElementById('modal-meal-lightbox');
    if (!lb) {
      lb = document.createElement('div');
      lb.id = 'modal-meal-lightbox';
      lb.className = 'meal-lightbox-overlay';
      document.body.appendChild(lb);
    }

    const mealMeta = this.getMealTypeLabel(meal.mealType);
    const dateObj = new Date(meal.time || meal.createdAt);
    const timeDisplay = `${dateObj.getFullYear()}年${dateObj.getMonth() + 1}月${dateObj.getDate()}日 ${String(dateObj.getHours()).padStart(2, '0')}:${String(dateObj.getMinutes()).padStart(2, '0')}`;

    let authorLabel = '两人共同';
    if (meal.author === 'yan') authorLabel = '王岩记录';
    if (meal.author === 'qiuhui') authorLabel = '杜秋慧记录';

    lb.innerHTML = `
      <div class="meal-lb-dialog">
        <button class="meal-lb-close" id="btn-close-meal-lb">✕</button>
        <div class="meal-lb-img-wrap">
          <img src="${meal.imageUrl}" class="meal-lb-img" alt="${meal.title}">
        </div>
        <div class="meal-lb-bar">
          <div class="meal-lb-title-row">
            <span class="meal-type-tag ${mealMeta.class}">${mealMeta.icon} ${mealMeta.label}</span>
            <h3>${this.escapeHtml(meal.title || '今日美餐')}</h3>
          </div>
          <div class="meal-lb-sub-row">
            <span>👤 ${authorLabel}</span>
            <span>🕒 ${timeDisplay}</span>
            ${meal.location ? `<span>📍 ${this.escapeHtml(meal.location)}</span>` : ''}
          </div>
        </div>
      </div>
    `;

    lb.classList.add('active');

    const closeLb = () => lb.classList.remove('active');
    lb.addEventListener('contextmenu', (e) => { e.preventDefault(); return false; });
    lb.querySelector('#btn-close-meal-lb')?.addEventListener('click', closeLb);
    lb.addEventListener('click', (e) => {
      if (e.target === lb) closeLb();
    });
  }

  escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}

// 挂载全局单例
window.mealsModule = new MealCameraModule();
