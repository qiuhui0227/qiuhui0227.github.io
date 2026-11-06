/**
 * OASIS | Qiuhui & Yan
 * 岁月相簿与时光档案
 * 
 * 全面支持【竖屏流式】与【横屏展卷】多套艺术风格：
 * 【↕️ 竖屏风格】
 * 1. 🎀 竖屏 · 浪漫手账 (scrapbook): 和纸胶带、宝丽来微倾角、可爱手绘贴纸、点阵暖纸
 * 2. 📱 竖屏 · 拍立得挂绳墙 (polaroid_wall): 原木横线麻绳、复古小木夹、悬挂微摆手作感
 * 
 * 【↔️ 横屏风格】
 * 3. 📜 横屏 · 诗意水墨长卷 (scroll): 紫檀木轴头、绢绫装裱、宣纸横向滑行长卷、朱红印章
 * 4. 🎞️ 横屏 · 电影胶卷菲林 (film_strip): 35mm负片链齿孔、胶卷帧编码、全景横向电影幻灯
 * 
 * 【🏛️ 典藏装帧】
 * 5. 📑 典藏 · 经折立体折子 (accordion): 经折装硬壳封皮、风琴褶皱光影折痕、金线页码
 * 6. 🏛️ 工整 · 现代经典画册 (classic): USV Lab 工整秩序感相片网格
 */

class AlbumsModule {
  constructor() {
    this.currentAlbumId = null;
    this.currentPhotos = [];
    this.activePhotoIndex = -1;
  }

  get stylesList() {
    return [
      { id: 'scrapbook', name: '浪漫花哨手账', badge: '↕️ 竖屏手账', type: 'v', orientation: 'vertical', icon: '🎀', desc: '和纸胶带 · 拍立得倾角 · 暖色手绘' },
      { id: 'polaroid_wall', name: '拍立得挂绳墙', badge: '↕️ 竖屏挂墙', type: 'v', orientation: 'vertical', icon: '📱', desc: '原木麻绳 · 复古木夹 · 自由悬挂' },
      { id: 'scroll', name: '诗意水墨长卷', badge: '↔️ 横屏长卷', type: 'h', orientation: 'horizontal', icon: '📜', desc: '紫檀木轴 · 绫绢宣纸 · 横向诗意展开' },
      { id: 'film_strip', name: '电影胶卷菲林', badge: '↔️ 横屏胶卷', type: 'h', orientation: 'horizontal', icon: '🎞️', desc: '35mm画幅 · 胶卷齿孔 · 沉浸放映' },
      { id: 'accordion', name: '经折典藏折子', badge: '📑 经折折子', type: 'm', orientation: 'mixed', icon: '📑', desc: '经折风琴褶 · 立体折页 · 典藏装帧' },
      { id: 'classic', name: '工整现代画册', badge: '🏛️ 经典画册', type: 'm', orientation: 'mixed', icon: '🏛️', desc: '现代艺术画廊 · 秩序工整网格' }
    ];
  }

  getStyleMeta(style) {
    const list = this.stylesList;
    const found = list.find(s => s.id === style);
    return found || list[0];
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

  // 1. 相簿列表页 (日系小清新・实木陈列时光书架，秒开无延迟)
  async renderAlbumsList(container, isMaster) {
    const allAlbums = window.spaceStore.getAlbums();
    // 严格过滤掉旧样例虚假相册，仅展示用户真实相册
    const fakeAlbumIds = new Set(['album_sweet_life', 'album_travel_notes', 'album_accordion_memories']);
    const realAlbums = allAlbums.filter(a => a && !fakeAlbumIds.has(a.id));
    const visibleAlbums = realAlbums.filter(a => isMaster || a.visibility === 'living_room');
    // 书架图书总数：三餐手帐(1) + 杜秋慧找导师简历(1) + 王岩求职简历(1) + 真实自建相册数
    const totalCount = visibleAlbums.length + 3;

    container.innerHTML = `
      <div class="oasis-bookshelf-zone">
        <!-- 统一主模块标头栏 -->
        <div class="oasis-header-bar">
          <div class="oasis-header-main">
            <div class="oasis-header-kicker">
              <svg class="ico" width="13" height="13" viewBox="0 0 24 24"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
              <span>时光书架 · 朝夕细碎与研途典藏</span>
            </div>
            <h2 class="oasis-header-title">🎞️ 时光书架</h2>
            <p class="oasis-header-sub">共计 ${totalCount} 卷书册档案 · 点击书脊翻阅 · 沉淀朝夕烟火与研途初心</p>
          </div>
          <div class="oasis-header-actions">
            ${isMaster ? `
              <button class="btn btn-primary btn-sm" id="btn-create-album">
                <svg class="ico" width="13" height="13" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>
                新建相册
              </button>
            ` : `
              <span class="pill good">🛋️ 客厅来宾模式 · 开放书架浏览</span>
            `}
          </div>
        </div>

        <!-- 日系小清新 · 实木温润陈列时光书架 -->
        <div class="bookshelf-display-unit" id="bookshelf-unit">
          <div class="bookshelf-shelf-row">
            <div class="albums-grid bookshelf-grid">
              ${this.renderSpecialMealAlbumCard()}
              ${this.renderSpecialResumeBookCardQiuhui()}
              ${this.renderSpecialResumeBookCardYan()}
              ${visibleAlbums.map(album => this.renderAlbumCard(album, isMaster)).join('')}
            </div>
            <!-- 实木温润托架横梁 -->
            <div class="bookshelf-ledge-wood"></div>
          </div>

          <!-- 需求 3：独立位于下方开阔空白处的放回书架控制栏，大气、优雅、美观 -->
          <div class="bookshelf-floating-retract-zone" id="bookshelf-retract-zone">
            <button type="button" class="bookshelf-floating-retract-btn" id="btn-bookshelf-retract" title="将放大的书册放回书架">
              <svg class="retract-ico" viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 4v12M18 11l-6 6-6-6M4 20h16"/>
              </svg>
              <span>放回书架</span>
            </button>
          </div>
        </div>
      </div>
    `;

    this.bindAlbumsListEvents(container);
  }

  // 专属三餐相册 (系统永久手帐 · 书架第1本 · 18KB微缩秒开)
  renderSpecialMealAlbumCard() {
    const rawMeals = window.spaceStore ? window.spaceStore.getMeals() : [];
    const meals = [...rawMeals].sort((a, b) => {
      const tA = new Date(a.time || a.createdAt || 0).getTime();
      const tB = new Date(b.time || b.createdAt || 0).getTime();
      return tB - tA;
    });
    // 关键优化：三餐相册封面优先使用最新拍摄/打卡的照片，兜底使用 18KB 本地极速图
    const latestMealWithPhoto = meals.find(m => m.thumbUrl || m.imageUrl);
    const mealCoverUrl = latestMealWithPhoto ? (latestMealWithPhoto.thumbUrl || latestMealWithPhoto.imageUrl) : './images/1001_1_thumb.jpg';
    return `
      <div class="shelf-photobook-card special-meal-book" id="album-card-special-meals" title="点击打开三餐手帐与拍照打卡">
        <div class="photobook-cover-wrap">
          <div class="photobook-spine-groove"></div>
          <img src="${mealCoverUrl}" alt="三餐相册封面" class="photobook-cover-img" loading="eager" decoding="async">
          <span class="photobook-silk-ribbon meal">🍱 三餐</span>
          <span class="photobook-stamp-badge">🍱 ${meals.length} 餐</span>
        </div>
        <div class="photobook-spine-label">
          <div class="photobook-spine-content">
            <h4 class="photobook-title-txt">🍱 三餐相册</h4>
            <div class="photobook-sub-txt">
              <span>人间烟火</span>
              <span>·</span>
              <span>手帐</span>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // 专属杜秋慧找导师学术简历图书 (书架常驻)
  renderSpecialResumeBookCardQiuhui() {
    return `
      <div class="shelf-photobook-card special-resume-book-qh" id="album-card-resume-qh" title="点击查阅与编辑 杜秋慧 · 口腔医学学术简历">
        <div class="photobook-cover-wrap">
          <div class="photobook-spine-groove"></div>
          <div class="resume-book-cover-art advisor">
            <div class="resume-cover-emblem">🔬</div>
            <div class="resume-cover-name">杜秋慧</div>
            <div class="resume-cover-sub">吉大口腔 · 找导师简历</div>
          </div>
          <span class="photobook-silk-ribbon qh">👧 杜秋慧</span>
          <span class="photobook-stamp-badge">A4 规范</span>
        </div>
        <div class="photobook-spine-label">
          <div class="photobook-spine-content">
            <h4 class="photobook-title-txt">🔬 杜秋慧 · 找导师简历</h4>
            <div class="photobook-sub-txt">
              <span>口腔5+3</span>
              <span>·</span>
              <span>学术A4</span>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // 专属王岩求职简历图书 (书架常驻)
  renderSpecialResumeBookCardYan() {
    return `
      <div class="shelf-photobook-card special-resume-book-yan" id="album-card-resume-yan" title="点击查阅与编辑 王岩 · 个人求职简历">
        <div class="photobook-cover-wrap">
          <div class="photobook-spine-groove"></div>
          <div class="resume-book-cover-art job">
            <div class="resume-cover-emblem">💼</div>
            <div class="resume-cover-name">王岩</div>
            <div class="resume-cover-sub">软件工程 · 名企求职</div>
          </div>
          <span class="photobook-silk-ribbon yan">👦 王岩</span>
          <span class="photobook-stamp-badge">A4 规范</span>
        </div>
        <div class="photobook-spine-label">
          <div class="photobook-spine-content">
            <h4 class="photobook-title-txt">💼 王岩 · 求职简历</h4>
            <div class="photobook-sub-txt">
              <span>软件工程</span>
              <span>·</span>
              <span>求职A4</span>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // 动态更新三餐相册封面为最新一张照片
  updateSpecialMealCover() {
    const card = document.getElementById('album-card-special-meals');
    if (!card) return;
    const rawMeals = window.spaceStore ? window.spaceStore.getMeals() : [];
    const meals = [...rawMeals].sort((a, b) => {
      const tA = new Date(a.time || a.createdAt || 0).getTime();
      const tB = new Date(b.time || b.createdAt || 0).getTime();
      return tB - tA;
    });
    const latestMealWithPhoto = meals.find(m => m.thumbUrl || m.imageUrl);
    const coverUrl = latestMealWithPhoto ? (latestMealWithPhoto.thumbUrl || latestMealWithPhoto.imageUrl) : './images/1001_1_thumb.jpg';

    const img = card.querySelector('.photobook-cover-img');
    if (img && coverUrl) {
      img.src = coverUrl;
    }
    const badge = card.querySelector('.photobook-stamp-badge');
    if (badge) {
      badge.textContent = `🍱 ${meals.length} 餐`;
    }
  }

  renderAlbumCard(album, isMaster) {
    const isLiving = album.visibility === 'living_room';
    const styleMeta = this.getStyleMeta(album.style);
    
    // 关键优化：优先使用微缩图秒开，杜绝大图慢速卡顿
    let coverSrc = album.coverThumb || album.coverUrl || album.cover;
    if (!coverSrc || coverSrc.includes('unsplash.com')) {
      coverSrc = './images/1001_1_thumb.jpg';
    }

    return `
      <div class="shelf-photobook-card" data-id="${album.id}">
        <div class="photobook-cover-wrap" id="album-cover-box-${album.id}">
          <div class="photobook-spine-groove"></div>
          ${coverSrc ? `<img src="${coverSrc}" alt="cover" class="photobook-cover-img" loading="eager" decoding="async" />` : `
            <div class="photobook-placeholder">
              <span>${styleMeta.icon}</span>
              <span style="font-size:10px; font-weight:600;">${styleMeta.name}</span>
            </div>
          `}
          <span class="photobook-silk-ribbon ${isLiving ? 'living' : 'bedroom'}">${isLiving ? '客厅' : '私密'}</span>
          <span class="photobook-stamp-badge" id="album-count-${album.id}">📷 ${album.count || 0}</span>
          ${isMaster ? `
            <div class="photobook-quick-acts">
              <button class="photobook-mini-btn btn-edit-album" data-id="${album.id}" title="编辑相簿与封面">✎</button>
              <button class="photobook-mini-btn del btn-del-album" data-id="${album.id}" title="删除相簿">×</button>
            </div>
          ` : ''}
        </div>
        <div class="photobook-spine-label">
          <div class="photobook-spine-content">
            <h4 class="photobook-title-txt">${this.escapeHtml(album.title)}</h4>
            <div class="photobook-sub-txt">
              <span>${styleMeta.name}</span>
              <span>·</span>
              <span>${album.createdAt ? album.createdAt.slice(5) : '影集'}</span>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  bindAlbumsListEvents(container) {
    const bookshelfUnit = container.querySelector('#bookshelf-unit');
    const bookshelfGrid = container.querySelector('.bookshelf-grid');
    const retractBtn = container.querySelector('#btn-bookshelf-retract');
    let activePinnedCard = null;

    // 核心函数：固定挺住相册并放大，向中间靠拢
    const pinCard = (card) => {
      if (activePinnedCard && activePinnedCard !== card) {
        unpinCard();
      }

      // 计算卡片中心与屏幕/书架水平中心的相对偏移
      const cardRect = card.getBoundingClientRect();
      const cardCenterX = cardRect.left + cardRect.width / 2;
      const shelfCenterX = window.innerWidth / 2;
      const diffX = shelfCenterX - cardCenterX;

      // 核心需求：“以自己的位置向中间靠拢，注意，不是直接居中”
      let nudgeX = 0;
      if (diffX > 15) {
        nudgeX = Math.min(diffX * 0.44, 52);
      } else if (diffX < -15) {
        nudgeX = Math.max(diffX * 0.44, -52);
      }

      // 放大 1.68 倍，上浮 36px，压住周围相册
      card.style.transform = `translate3d(${nudgeX.toFixed(1)}px, -36px, 0) scale(1.68)`;
      card.classList.add('card-pinned');
      card.classList.remove('touch-pressing');
      bookshelfGrid?.classList.add('bookshelf-has-pinned');
      bookshelfUnit?.classList.add('has-pinned-card');
      activePinnedCard = card;
    };

    // 核心函数：收回挺住的相册，绝对水平平整归位，杜绝高出书架 bug
    const unpinCard = () => {
      if (!activePinnedCard) return;
      activePinnedCard.style.transform = 'none';
      activePinnedCard.classList.remove('card-pinned');
      activePinnedCard.classList.remove('touch-pressing');
      bookshelfGrid?.classList.remove('bookshelf-has-pinned');
      bookshelfUnit?.classList.remove('has-pinned-card');
      const tempCard = activePinnedCard;
      activePinnedCard = null;
      setTimeout(() => {
        if (tempCard && !tempCard.classList.contains('card-pinned')) {
          tempCard.style.transform = '';
        }
      }, 300);
    };

    // 绑定独立大气放回书架按钮
    retractBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();
      unpinCard();
    });

    // 统一卡片点击/翻阅调度器
    const handleCardOpen = (card) => {
      if (card.classList.contains('special-meal-book')) {
        window.mealsModule?.openMealAlbumModal();
      } else if (card.id === 'album-card-resume-qh' || card.classList.contains('special-resume-book-qh')) {
        if (window.resumeModule) {
          window.resumeModule.currentPerson = 'qiuhui';
          const qhBooks = window.spaceStore?.getResumeBooks()?.qiuhui || [];
          window.resumeModule.activeResumeId = qhBooks[0]?.id || 'res_qh_advisor';
          window.resumeModule.viewMode = 'editor';
        }
        if (!window.spaceAuth.isMaster()) {
          window.spaceApp?.openMasterUpgradeModal();
        } else {
          window.spaceApp?.switchTab('resume');
        }
      } else if (card.id === 'album-card-resume-yan' || card.classList.contains('special-resume-book-yan')) {
        if (window.resumeModule) {
          window.resumeModule.currentPerson = 'yan';
          const yanBooks = window.spaceStore?.getResumeBooks()?.yan || [];
          window.resumeModule.activeResumeId = yanBooks[0]?.id || 'res_yan_job';
          window.resumeModule.viewMode = 'editor';
        }
        if (!window.spaceAuth.isMaster()) {
          window.spaceApp?.openMasterUpgradeModal();
        } else {
          window.spaceApp?.switchTab('resume');
        }
      } else {
        this.currentAlbumId = card.dataset.id;
        this.render(container);
      }
    };

    // 点空白处收回
    const handleOutsideTap = (e) => {
      if (!activePinnedCard) return;

      if (e.target.closest('#btn-bookshelf-retract')) {
        e.stopPropagation();
        unpinCard();
        return;
      }

      // 如果点击的是已经被锁定的卡片自身
      if (e.target.closest('.shelf-photobook-card') === activePinnedCard) {
        if (e.target.closest('.photobook-mini-btn')) return; // 让编辑/删除按钮自己处理
        // 点击当前固定的卡片本身，直接进入相册
        const card = activePinnedCard;
        unpinCard();
        handleCardOpen(card);
        return;
      }
      // 否则点击空白处或其它地方，收回！
      unpinCard();
    };

    container.addEventListener('click', handleOutsideTap);

    // 阻止长按弹出微信上下文菜单（搜一搜、保存到手机等）
    container.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      return false;
    }, { passive: false });

    const albums = window.spaceStore.getAlbums();

    // 绑定相册交互：按住震动挺住，否则直接进入
    container.querySelectorAll('.shelf-photobook-card').forEach(card => {
      let pressTimer = null;
      let isVibrated = false;
      let isTouchMove = false;
      let startX = 0;
      let startY = 0;

      // 触摸开始
      card.addEventListener('touchstart', (e) => {
        if (e.target.closest('.photobook-mini-btn') || e.target.closest('.photobook-retract-btn')) return;

        if (activePinnedCard && activePinnedCard !== card) {
          unpinCard();
        }

        clearTimeout(pressTimer);
        isVibrated = false;
        isTouchMove = false;
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;

        card.classList.add('touch-pressing');

        // 按住 280ms 触发震动并锁定放大
        pressTimer = setTimeout(() => {
          isVibrated = true;
          if (navigator.vibrate) {
            try { navigator.vibrate(35); } catch (_) {}
          }
          pinCard(card);
        }, 280);
      }, { passive: true });

      // 滑动中（若在翻滚页面，取消按住计时）
      card.addEventListener('touchmove', (e) => {
        const dx = e.touches[0].clientX - startX;
        const dy = e.touches[0].clientY - startY;
        if (Math.hypot(dx, dy) > 10) {
          isTouchMove = true;
          clearTimeout(pressTimer);
          card.classList.remove('touch-pressing');
        }
      }, { passive: true });

      // 触摸结束
      card.addEventListener('touchend', (e) => {
        if (e.target.closest('.photobook-retract-btn')) {
          e.stopPropagation();
          e.preventDefault();
          unpinCard();
          return;
        }

        if (e.target.closest('.photobook-mini-btn')) return;
        clearTimeout(pressTimer);
        card.classList.remove('touch-pressing');

        if (isTouchMove) return;

        // 如果还没震动，用户只是轻点了一下：直接进入！
        if (!isVibrated) {
          if (activePinnedCard === card) {
            unpinCard();
          }
          handleCardOpen(card);
        } else {
          // 已经震动：松开就会挺住！
          e.preventDefault();
        }
      }, { passive: false });

      card.addEventListener('touchcancel', () => {
        clearTimeout(pressTimer);
        card.classList.remove('touch-pressing');
      }, { passive: true });

      // 桌面端鼠标交互：支持点击直达与长按挺住
      let mouseTimer = null;
      let mouseVibrated = false;

      card.addEventListener('mousedown', (e) => {
        if (e.button !== 0 || e.target.closest('.photobook-mini-btn') || e.target.closest('.photobook-retract-btn')) return;
        if (activePinnedCard && activePinnedCard !== card) {
          unpinCard();
        }
        mouseVibrated = false;
        card.classList.add('touch-pressing');
        mouseTimer = setTimeout(() => {
          mouseVibrated = true;
          pinCard(card);
        }, 280);
      });

      card.addEventListener('mouseup', (e) => {
        if (e.button !== 0) return;
        if (e.target.closest('.photobook-retract-btn')) {
          e.stopPropagation();
          unpinCard();
          return;
        }
        if (e.target.closest('.photobook-mini-btn')) return;
        clearTimeout(mouseTimer);
        card.classList.remove('touch-pressing');
        if (!mouseVibrated) {
          if (activePinnedCard === card) {
            unpinCard();
          }
          handleCardOpen(card);
        }
      });

      card.addEventListener('mouseleave', () => {
        clearTimeout(mouseTimer);
        card.classList.remove('touch-pressing');
      });
    });

    container.querySelector('#btn-create-album')?.addEventListener('click', () => {
      this.openAlbumModal();
    });

    container.querySelectorAll('.btn-edit-album').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.dataset.id;
        const a = albums.find(x => x.id === id);
        if (a) this.openAlbumModal(a);
      });
    });

    container.querySelectorAll('.btn-del-album').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const id = btn.dataset.id;
        if (confirm('确定要删除这本相册吗？相册内的照片也将一并移除。')) {
          await window.spaceStore.deleteAlbum(id);
          this.render(container);
          window.spaceApp?.showToast('相册已删除');
        }
      });
    });
  }

  // 2. 单本相簿详情展示 (支持横屏/竖屏多风格切换与持久化)
  async renderAlbumDetail(container, isMaster) {
    const albums = window.spaceStore.getAlbums();
    const album = albums.find(a => a.id === this.currentAlbumId);
    if (!album || (!isMaster && album.visibility === 'bedroom')) {
      this.currentAlbumId = null;
      return this.render(container);
    }

    const currentStyle = album.style || 'scrapbook';
    const styleMeta = this.getStyleMeta(currentStyle);

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

    let guideHtml = '';
    if (styleMeta.type === 'v') {
      guideHtml = `<span class="orientation-guide v">↕️ 竖屏流式风格 · 极佳适配手机纵向翻阅</span>`;
    } else if (styleMeta.type === 'h') {
      guideHtml = `<span class="orientation-guide h">↔️ 横屏展卷风格 · 支持横向触摸滑动与滚轮滑行</span>`;
    } else {
      guideHtml = `<span class="orientation-guide m">📑 典藏装帧风格 · 沉浸式艺术翻阅</span>`;
    }

    container.innerHTML = `
      <div class="album-detail-wrap">
        <!-- 统一主模块标头栏 -->
        <div class="oasis-header-bar">
          <div class="oasis-header-main">
            <div class="oasis-header-kicker">
              <button class="btn btn-outline btn-xs" id="btn-back-to-albums" style="margin-right:6px;">← 返回相册列表</button>
              <span>${album.visibility === 'living_room' ? '🛋️ 客厅开放相册' : '🛏️ 卧室私密相册'}</span>
            </div>
            <h2 class="oasis-header-title">
              <span>📖 ${this.escapeHtml(album.title)}</span>
              <span class="pill ${album.visibility === 'living_room' ? 'good' : 'off'}" style="font-size:11.5px; font-weight:600;">
                ${album.visibility === 'living_room' ? '客厅公开' : '卧室私密'}
              </span>
            </h2>
            <p class="oasis-header-sub">${this.escapeHtml(album.desc || '点滴记录我们的美好时刻')}</p>
          </div>
          <div class="oasis-header-actions">
            ${isMaster ? `
              <button class="btn btn-outline btn-sm" id="btn-edit-current-album">⚙️ 修改相册信息</button>
              <label class="btn btn-primary btn-sm" style="margin: 0; cursor: pointer;">
                <input type="file" id="input-upload-photos" accept="image/*" multiple style="display:none;">
                <svg class="ico" width="13" height="13" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                上传新照片
              </label>
            ` : ''}
          </div>
        </div>

        <!-- 相簿艺术呈递风格切换器 (分类呈现横屏与竖屏) -->
        <div class="album-style-bar">
          <div class="album-style-bar-left">
            <span class="fine" style="font-weight:750; color:#18354a;">🎨 呈递风格:</span>
            <span class="pill-badge ${styleMeta.type}">${styleMeta.name}</span>
          </div>
          <div class="style-switcher">
            <button class="style-tab ${currentStyle === 'scrapbook' ? 'active' : ''}" data-style="scrapbook" title="↕️ 竖屏手账">
              🎀 竖屏手账
            </button>
            <button class="style-tab ${currentStyle === 'polaroid_wall' ? 'active' : ''}" data-style="polaroid_wall" title="↕️ 竖屏挂绳墙">
              📱 竖屏挂墙
            </button>
            <button class="style-tab ${currentStyle === 'scroll' ? 'active' : ''}" data-style="scroll" title="↔️ 横屏水墨长卷">
              📜 横屏长卷
            </button>
            <button class="style-tab ${currentStyle === 'film_strip' ? 'active' : ''}" data-style="film_strip" title="↔️ 横屏电影胶卷">
              🎞️ 横屏胶卷
            </button>
            <button class="style-tab ${currentStyle === 'accordion' ? 'active' : ''}" data-style="accordion" title="📑 经折折子">
              📑 经折折子
            </button>
            <button class="style-tab ${currentStyle === 'classic' ? 'active' : ''}" data-style="classic" title="🏛️ 现代画册">
              🏛️ 经典画册
            </button>
          </div>
        </div>

        <!-- 动态视觉展示容器 -->
        <div id="album-photos-view">
          ${this.renderPhotosByStyle(currentStyle, this.currentPhotos, isMaster)}
        </div>
      </div>
    `;

    this.bindDetailEvents(container, album);
  }

  // 风格路由器
  renderPhotosByStyle(style, photos, isMaster) {
    if (photos.length === 0) {
      return `<div class="empty" style="grid-column: 1/-1;">这本相簿暂无照片，点击上方按钮上传第一张吧！</div>`;
    }

    switch (style) {
      case 'polaroid_wall':
        return this.renderPolaroidWallView(photos, isMaster);
      case 'scroll':
        return this.renderScrollView(photos, isMaster);
      case 'film_strip':
        return this.renderFilmStripView(photos, isMaster);
      case 'accordion':
        return this.renderAccordionView(photos, isMaster);
      case 'classic':
        return this.renderClassicView(photos, isMaster);
      case 'scrapbook':
      default:
        return this.renderScrapbookView(photos, isMaster);
    }
  }

  // 风格 1: 🎀 竖屏 · 浪漫手账 (Scrapbook)
  renderScrapbookView(photos, isMaster) {
    const tapes = ['tape-mint', 'tape-peach', 'tape-yellow', 'tape-lavender', 'tape-sky'];
    const stickers = ['🎀', '✨', '🌸', '🧸', '💌', '☕', '🍀', '🪐', '💫', '💖'];

    return `
      <div class="scrapbook-board">
        <div class="scrapbook-header-badge">
          <div class="scrapbook-header-title">
            <span>🌸 独家手账日志</span>
            <span class="fine" style="color:#87715f;">(↕️ 竖屏点阵暖纸 · 宝丽来微倾角与和纸胶带)</span>
          </div>
          <div class="scrapbook-decorations">
            <span>✨</span><span>🎀</span><span>🌷</span><span>💌</span>
          </div>
        </div>

        <div class="scrapbook-grid">
          ${photos.map((photo, idx) => {
            const tapeClass = tapes[idx % tapes.length];
            const sticker = stickers[idx % stickers.length];
            return `
              <div class="scrapbook-card photo-card-target" data-index="${idx}">
                <div class="washi-tape ${tapeClass}"></div>
                <span class="scrapbook-sticker sticker-top-right">${sticker}</span>
                <div class="scrapbook-img-box">
                  <img src="${photo.thumbUrl || photo.dataUrl}" alt="${this.escapeHtml(photo.title)}" loading="lazy" decoding="async">
                </div>
                <div class="scrapbook-caption-row">
                  <span class="scrapbook-title">${this.escapeHtml(photo.title || '美好瞬间')}</span>
                  ${photo.date ? `<span class="scrapbook-date">${photo.date}</span>` : ''}
                  ${isMaster ? `
                    <button class="scrapbook-btn-del btn-del-photo" data-id="${photo.id}" title="删除此照片">🗑️</button>
                  ` : ''}
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }

  // 风格 2: 📱 竖屏 · 拍立得挂绳墙 (Polaroid Wall)
  renderPolaroidWallView(photos, isMaster) {
    return `
      <div class="polaroid-wall-stage">
        <div class="wall-header-badge">
          <div class="wall-header-title">
            <span>📱 拍立得挂绳墙</span>
            <span class="fine" style="color:#785c49;">(↕️ 竖屏手作感 · 原木麻绳悬挂与小木夹)</span>
          </div>
          <div style="font-size:16px;">🌿 💡 🪵 📷</div>
        </div>

        <div class="wall-twine-container">
          ${photos.map((photo, idx) => `
            <div class="hanging-card photo-card-target" data-index="${idx}">
              <div class="wood-clip"></div>
              <div class="hanging-img-box">
                <img src="${photo.thumbUrl || photo.dataUrl}" alt="${this.escapeHtml(photo.title)}" loading="lazy" decoding="async">
              </div>
              <div class="hanging-caption-row">
                <span class="hanging-title">${this.escapeHtml(photo.title || '美好瞬间')}</span>
                ${photo.date ? `<span class="hanging-date">${photo.date}</span>` : ''}
                ${isMaster ? `
                  <button class="scrapbook-btn-del btn-del-photo" data-id="${photo.id}" title="删除此照片">🗑️</button>
                ` : ''}
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  // 风格 3: 📜 横屏 · 诗意水墨长卷 (Chinese Scroll)
  renderScrollView(photos, isMaster) {
    const seals = ['心心相印', '岁岁欢喜', '良辰美景', '山海同游', '此情可待', '长乐未央'];

    return `
      <div class="scroll-stage">
        <div class="fine" style="color:#c5b59f; margin-bottom:12px; display:flex; justify-content:space-between; align-items:center;">
          <span>📜 古风水墨长卷 · (↔️ 横屏展卷 · 支持横向触摸滑动或滚轮滑动)</span>
          <span class="fine" style="color:#9e8870;">紫檀轴杆 · 绢绫装裱</span>
        </div>
        <div class="scroll-mount-wrapper">
          <div class="scroll-rod rod-left">
            <div class="rod-cap"></div>
            <div class="rod-cap"></div>
          </div>

          <div class="scroll-paper-stream">
            ${photos.map((photo, idx) => {
              const sealText = seals[idx % seals.length];
              return `
                <div class="scroll-painting-card photo-card-target" data-index="${idx}">
                  <div class="chinese-seal">${sealText}</div>
                  <div class="scroll-painting-img-box">
                    <img src="${photo.thumbUrl || photo.dataUrl}" alt="${this.escapeHtml(photo.title)}" loading="lazy" decoding="async">
                  </div>
                  <div class="scroll-painting-meta">
                    <span class="scroll-painting-title">${this.escapeHtml(photo.title || '卷中良辰')}</span>
                    <span class="scroll-painting-date">${photo.date || '岁在今朝'}</span>
                    ${isMaster ? `
                      <button class="btn-text btn-del-photo" data-id="${photo.id}" style="color:#a7464c; padding:0 4px;" title="删除">🗑️</button>
                    ` : ''}
                  </div>
                </div>
              `;
            }).join('')}
          </div>

          <div class="scroll-rod rod-right">
            <div class="rod-cap"></div>
            <div class="rod-cap"></div>
          </div>
        </div>
      </div>
    `;
  }

  // 风格 4: 🎞️ 横屏 · 电影胶卷菲林 (Film Strip)
  renderFilmStripView(photos, isMaster) {
    const sprocketHoles = Array(22).fill('<div class="film-hole"></div>').join('');

    return `
      <div class="film-strip-stage">
        <div class="film-header">
          <div style="display:flex; align-items:center; gap:10px;">
            <span class="film-logo-brand">KODAK PORTRA 400</span>
            <span class="fine" style="color:#8a8a9e;">(↔️ 横屏电影胶卷 · 全景滑动检视)</span>
          </div>
          <div class="fine" style="color:#ffb703; font-family:monospace;">SAFETY FILM · 35mm</div>
        </div>

        <div class="film-track-container">
          <!-- 上方齿孔 -->
          <div class="film-sprockets">
            ${sprocketHoles}
          </div>

          <!-- 横向电影帧流 -->
          <div class="film-frames-stream">
            ${photos.map((photo, idx) => {
              const frameCode = String(idx + 1).padStart(2, '0') + 'A';
              return `
                <div class="film-frame-card photo-card-target" data-index="${idx}">
                  <div class="film-frame-info-top">
                    <span>FRAME #${frameCode}</span>
                    <span>ISO 400 · 1/250s</span>
                  </div>
                  <div class="film-frame-img-box">
                    <img src="${photo.thumbUrl || photo.dataUrl}" alt="${this.escapeHtml(photo.title)}" loading="lazy" decoding="async">
                  </div>
                  <div class="film-frame-footer">
                    <span class="film-frame-title">${this.escapeHtml(photo.title || '胶卷定格')}</span>
                    ${photo.date ? `<span class="fine" style="color:#ffb703; font-size:10px; font-family:monospace;">${photo.date}</span>` : ''}
                    ${isMaster ? `
                      <button class="btn-text btn-del-photo" data-id="${photo.id}" style="color:#ff6b6b; padding:0 4px;" title="删除">🗑️</button>
                    ` : ''}
                  </div>
                </div>
              `;
            }).join('')}
          </div>

          <!-- 下方齿孔 -->
          <div class="film-sprockets">
            ${sprocketHoles}
          </div>
        </div>
      </div>
    `;
  }

  // 风格 5: 📑 经折折子 (Accordion Fold)
  renderAccordionView(photos, isMaster) {
    const chineseNums = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十', '十一', '十二', '十三', '十四', '十五', '十六'];

    return `
      <div class="accordion-book-stage">
        <div class="accordion-book-head">
          <h4>📑 典藏经折装 · 风琴多折立体册页</h4>
          <span class="fine" style="color:#7899ad;">传统经折连续装帧 · 横向连绵展开</span>
        </div>

        <div class="accordion-leaves-container">
          <!-- 封面硬板 -->
          <div class="accordion-cover-panel">
            <div class="accordion-gold-label">岁 · 月 · 珍 · 藏</div>
            <div style="font-size:10px; color:#68889c; margin-top:10px;">QIUHUI & YAN</div>
          </div>

          <!-- 折页序列 -->
          ${photos.map((photo, idx) => {
            const isOdd = idx % 2 === 0;
            const foldNum = chineseNums[idx] || (idx + 1);
            return `
              <div class="accordion-leaf ${isOdd ? 'odd-fold' : 'even-fold'} photo-card-target" data-index="${idx}">
                <div class="accordion-leaf-index">
                  <span>折 ${foldNum}</span>
                  <span>${photo.date || '留影'}</span>
                </div>
                <div class="accordion-leaf-img-box">
                  <img src="${photo.thumbUrl || photo.dataUrl}" alt="${this.escapeHtml(photo.title)}" loading="lazy" decoding="async">
                </div>
                <div class="accordion-leaf-title">${this.escapeHtml(photo.title || '并肩时光')}</div>
                ${isMaster ? `
                  <div style="text-align:right; margin-top:4px;">
                    <button class="btn-text btn-del-photo" data-id="${photo.id}" style="color:#a7464c; font-size:11px;" title="删除">🗑️ 移除</button>
                  </div>
                ` : ''}
              </div>
            `;
          }).join('')}

          <!-- 封底硬板 -->
          <div class="accordion-cover-panel">
            <div class="accordion-gold-label">未 · 完 · 待 · 续</div>
            <div style="font-size:10px; color:#68889c; margin-top:10px;">OASIS 2026</div>
          </div>
        </div>
      </div>
    `;
  }

  // 风格 6: 🏛️ 经典画册 (Classic Archival)
  renderClassicView(photos, isMaster) {
    return `
      <div class="photos-masonry">
        ${photos.map((photo, idx) => `
          <div class="photo-item photo-card-target" data-index="${idx}">
            <img src="${photo.thumbUrl || photo.dataUrl}" alt="${this.escapeHtml(photo.title)}" loading="lazy" decoding="async">
            <div class="photo-bar">
              <span class="photo-bar-title">${this.escapeHtml(photo.title || '美好瞬间')}</span>
              ${isMaster ? `
                <button class="btn-text btn-del-photo" data-id="${photo.id}" style="color:#a7464c; padding:0 4px;" title="删除">🗑️</button>
              ` : ''}
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  bindDetailEvents(container, album) {
    container.querySelector('#btn-back-to-albums')?.addEventListener('click', () => {
      this.currentAlbumId = null;
      this.render(container);
    });

    container.querySelector('#btn-edit-current-album')?.addEventListener('click', () => {
      this.openAlbumModal(album);
    });

    // 艺术风格切换 (同时持久化更新本相册的 style)
    container.querySelectorAll('.style-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        const style = tab.dataset.style;
        album.style = style;
        const allAlbums = window.spaceStore.getAlbums();
        const found = allAlbums.find(a => a.id === album.id);
        if (found) found.style = style;
        window.spaceStore.saveAlbums(allAlbums);
        window.spaceStore.saveAlbumStyle(style);
        this.render(container);
      });
    });

    const uploadInput = container.querySelector('#input-upload-photos');
    uploadInput?.addEventListener('change', async (e) => {
      const files = Array.from(e.target.files);
      if (files.length === 0) return;

      window.spaceApp?.showToast(`正在前端生成极速微缩图 (${files.length} 张)...`);

      for (const file of files) {
        try {
          // 1. 生成极速小缩略图 (最长边 380px，质量 0.70，体积仅 15KB-20KB，列表秒开零卡顿)
          const thumbObj = await this.compressImage(file, 380, 0.70);
          // 2. 生成高清大图 (最长边 1280px，质量 0.80，体积仅 120KB-180KB，杜绝手机原始 10MB 巨图瘫痪网络)
          const displayObj = await this.compressImage(file, 1280, 0.80);

          let cloudUrl = null;
          try {
            // 上传轻量高清大图到云端，杜绝上传动辄十几兆的原始巨图
            cloudUrl = await window.spaceStore.uploadPhoto(displayObj.dataUrl, album.id, file.name);
          } catch (e) {
            console.warn('Cloud photo upload failed, using local compressed dataUrl:', e);
          }

          const photoData = {
            id: 'photo_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
            albumId: album.id,
            title: file.name.replace(/\.[^/.]+$/, ''),
            date: new Date().toISOString().split('T')[0],
            thumbUrl: thumbObj.dataUrl,
            dataUrl: cloudUrl || displayObj.dataUrl,
            cloudUrl: cloudUrl || ''
          };
          await window.spaceStore.savePhoto(photoData);

          // 若相册尚无封面，将本张微缩图设为封面
          if (!album.cover || album.cover.includes('unsplash') || album.cover === './images/1001_1_thumb.jpg') {
            album.cover = thumbObj.dataUrl;
            album.coverThumb = thumbObj.dataUrl;
            album.coverUrl = thumbObj.dataUrl;
          }
        } catch (err) {
          console.error('上传处理失败:', err);
        }
      }

      const updated = await window.spaceStore.getPhotosByAlbum(album.id);
      album.count = updated.length;
      const all = window.spaceStore.getAlbums();
      const found = all.find(x => x.id === album.id);
      if (found) {
        found.count = updated.length;
        if (album.cover) {
          found.cover = album.cover;
          found.coverThumb = album.coverThumb || album.cover;
          found.coverUrl = album.coverUrl || album.cover;
        }
      }
      window.spaceStore.saveAlbums(all);

      window.spaceApp?.showToast('照片已上传并生成极速缩略图！', 'good');
      this.render(container);
    });

    // 点击照片打开全屏大图灯箱
    container.querySelectorAll('.photo-card-target').forEach(card => {
      card.addEventListener('click', (e) => {
        if (e.target.closest('.btn-del-photo, .scrapbook-btn-del')) return;
        this.openLightbox(parseInt(card.dataset.index, 10));
      });
    });

    // 删除单张照片
    container.querySelectorAll('.btn-del-photo, .scrapbook-btn-del').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        if (confirm('确认删除这张照片吗？')) {
          await window.spaceStore.deletePhoto(btn.dataset.id);
          this.render(container);
        }
      });
    });
  }

  // 纯前端 Canvas 视网膜级轻量压缩 (支持 File 或 dataUrl 字符串)
  compressImage(fileOrUrl, maxDimension = 1280, quality = 0.80) {
    return new Promise((resolve, reject) => {
      const handleImage = (img) => {
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
        resolve({ dataUrl, width, height });
      };

      if (typeof fileOrUrl === 'string') {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => handleImage(img);
        img.onerror = reject;
        img.src = fileOrUrl;
      } else {
        const reader = new FileReader();
        reader.onload = (e) => {
          const img = new Image();
          img.onload = () => handleImage(img);
          img.onerror = reject;
          img.src = e.target.result;
        };
        reader.onerror = reject;
        reader.readAsDataURL(fileOrUrl);
      }
    });
  }

  // 新建/编辑相簿弹窗 (核心增强：支持封面自定义上传压缩、微缩秒开与艺术风格选择)
  openAlbumModal(album = null) {
    const isEdit = !!album;
    const currentStyle = album ? album.style : 'scrapbook';
    const currentCover = album ? (album.coverUrl || album.coverThumb || album.cover || '') : '';

    const modalHtml = `
      <div class="overlay" id="album-modal">
        <div class="sheet" style="max-width: 540px;">
          <div class="sheet-head">
            <div>
              <h3>${isEdit ? '编辑相簿设置' : '创建新时光相册'}</h3>
              <div class="fine">岁月相册 · 记录朝夕温暖印记</div>
            </div>
            <button type="button" class="logout" id="album-modal-close" style="font-size: 20px; line-height: 1;">×</button>
          </div>
          <form id="form-album">
            <div class="field">
              <label class="label">相册标题 *</label>
              <input type="text" name="title" class="input" required placeholder="例如：2026 盛夏漫游记" value="${album ? this.escapeHtml(album.title) : ''}">
            </div>

            <div class="field">
              <label class="label">展示空间 *</label>
              <select name="visibility" class="select">
                <option value="living_room" ${album && album.visibility === 'living_room' ? 'selected' : ''}>🛋️ 客厅 (公开展示 · 访客与两人均可见)</option>
                <option value="bedroom" ${!album || album.visibility === 'bedroom' ? 'selected' : ''}>🛏️ 卧室 (私密相册 · 仅王岩与杜秋慧可见)</option>
              </select>
            </div>

            <!-- 自定义封面设置与纯前端轻量压缩 -->
            <div class="field">
              <label class="label">相册封面 (自定义封面 · 极速预加载)</label>
              <div class="album-cover-picker-box">
                <div class="album-cover-preview" id="album-cover-preview-box">
                  ${currentCover ? `<img src="${currentCover}" alt="cover" id="album-cover-preview-img" />` : `<span class="album-cover-placeholder" id="album-cover-placeholder-txt">暂无封面</span>`}
                </div>
                <div class="album-cover-ctrls">
                  <div style="display:flex; gap:8px;">
                    <button type="button" class="btn btn-outline btn-xs" id="btn-pick-album-cover">
                      📷 上传/更换封面
                    </button>
                    <button type="button" class="btn btn-outline btn-xs" id="btn-clear-album-cover" style="color:#ef4444; ${currentCover ? '' : 'display:none;'}">
                      清除封面
                    </button>
                  </div>
                  <span class="fine" style="color:#64748b; font-size:11px;" id="album-cover-status-tip">
                    ${currentCover ? '已设置封面 (自动压缩至微缩规格)' : '未设置时，将自动取相册第一张照片作为封面'}
                  </span>
                  <input type="file" id="input-album-cover" accept="image/*" style="display:none;" />
                  <input type="hidden" name="coverUrl" id="input-album-cover-url" value="${currentCover}" />
                </div>
              </div>
            </div>

            <div class="field">
              <label class="label">艺术展卷风格 * (自适应手机/电脑)</label>
              <div class="style-picker-grid">
                ${this.stylesList.map(st => `
                  <label class="style-choice-card">
                    <input type="radio" name="style" value="${st.id}" ${currentStyle === st.id ? 'checked' : ''}>
                    <div class="style-choice-body">
                      <span class="style-choice-icon">${st.icon}</span>
                      <div class="style-choice-info">
                        <div class="style-choice-title">
                          <span>${st.name}</span>
                          <span class="pill-badge ${st.type}">${st.badge}</span>
                        </div>
                        <div class="style-choice-desc">${st.desc}</div>
                      </div>
                    </div>
                  </label>
                `).join('')}
              </div>
            </div>

            <div class="field">
              <label class="label">相册寄语 / 简介</label>
              <textarea name="desc" class="textarea" rows="2" placeholder="写下一两句时光箴言...">${album ? this.escapeHtml(album.desc || '') : ''}</textarea>
            </div>

            <div style="display:flex; justify-content:flex-end; gap:10px; margin-top:16px;">
              <button type="button" class="btn btn-outline" id="album-modal-cancel">取消</button>
              <button type="submit" class="btn btn-primary" id="btn-album-submit">${isEdit ? '保存修改' : '立即创建'}</button>
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

    // 封面上传与自动压缩逻辑 (纯前端微缩至 380px 极速载入，消除等待)
    const coverInput = modalEl.querySelector('#input-album-cover');
    const pickCoverBtn = modalEl.querySelector('#btn-pick-album-cover');
    const clearCoverBtn = modalEl.querySelector('#btn-clear-album-cover');
    const coverPreviewBox = modalEl.querySelector('#album-cover-preview-box');
    const coverTip = modalEl.querySelector('#album-cover-status-tip');
    const coverUrlInput = modalEl.querySelector('#input-album-cover-url');

    pickCoverBtn?.addEventListener('click', () => coverInput?.click());

    coverInput?.addEventListener('change', async (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;

      if (coverTip) coverTip.innerHTML = '⏳ 正在压缩封面 (微缩秒开规格)...';
      try {
        // 关键：封面微缩压缩至 380px / 0.72 质量，体积仅 ~15KB-20KB，秒开且省流量
        const { dataUrl } = await this.compressImage(file, 380, 0.72);
        let finalCover = dataUrl;

        try {
          const cloudUrl = await window.spaceStore.uploadPhoto(dataUrl, 'covers', `cover_${Date.now()}.jpg`);
          if (cloudUrl) finalCover = cloudUrl;
        } catch (err) {
          console.warn('Cover upload to cloud failed, using compressed base64:', err);
        }

        coverUrlInput.value = finalCover;
        coverPreviewBox.innerHTML = `<img src="${finalCover}" alt="封面预览" style="width:100%; height:100%; object-fit:cover; display:block; border-radius:6px;" />`;
        if (clearCoverBtn) clearCoverBtn.style.display = 'inline-block';
        if (coverTip) coverTip.innerHTML = '✨ 封面微缩压缩完成，秒开就绪！';
      } catch (err) {
        console.error('Compress cover failed:', err);
        if (coverTip) coverTip.innerHTML = '❌ 封面压缩处理失败，请重试';
      }
    });

    clearCoverBtn?.addEventListener('click', () => {
      coverUrlInput.value = '';
      coverPreviewBox.innerHTML = `<span class="album-cover-placeholder">暂无封面</span>`;
      clearCoverBtn.style.display = 'none';
      if (coverTip) coverTip.innerText = '已清除自定义封面，将取相册首张照片展示';
      coverInput.value = '';
    });

    modalEl.querySelector('#form-album').addEventListener('submit', (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const list = window.spaceStore.getAlbums();
      const chosenStyle = fd.get('style') || 'scrapbook';
      const coverVal = (coverUrlInput ? coverUrlInput.value : '').trim();

      if (isEdit) {
        const found = list.find(a => a.id === album.id);
        if (found) {
          found.title = fd.get('title');
          found.visibility = fd.get('visibility');
          found.desc = fd.get('desc');
          found.style = chosenStyle;
          found.coverUrl = coverVal;
          found.coverThumb = coverVal;
          found.cover = coverVal;
        }
      } else {
        list.push({
          id: 'album_' + Date.now(),
          title: fd.get('title'),
          visibility: fd.get('visibility'),
          desc: fd.get('desc'),
          style: chosenStyle,
          coverUrl: coverVal,
          coverThumb: coverVal,
          cover: coverVal,
          createdAt: new Date().toISOString().split('T')[0],
          count: 0
        });
      }

      window.spaceStore.saveAlbums(list);
      close();
      const container = document.getElementById('content-albums');
      if (container) this.render(container);
      window.spaceApp?.showToast(isEdit ? '相册设置已保存' : '✨ 新相册已成功创建！', 'good');
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
          <img src="${photo.dataUrl || photo.cloudUrl || photo.thumbUrl}" id="lb-img" style="max-width:100%; max-height:80vh; border-radius:12px; box-shadow:0 12px 35px rgba(0,0,0,0.5);">
          <div style="color:#fff; margin-top:12px; font-size:14px; font-weight:700;" id="lb-caption">${this.escapeHtml(photo.title)}</div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', lbHtml);
    const modalEl = document.getElementById('lightbox-modal');

    // 阻止长按呼出微信菜单
    modalEl.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      return false;
    }, { passive: false });

    const update = (newIdx) => {
      this.activePhotoIndex = newIdx;
      const p = this.currentPhotos[newIdx];
      modalEl.querySelector('#lb-img').src = p.dataUrl || p.cloudUrl || p.thumbUrl;
      modalEl.querySelector('#lb-caption').innerText = p.title || '美好瞬间';
    };

    const closeLightbox = () => {
      document.removeEventListener('keydown', handleKeyNav);
      modalEl && modalEl.remove();
    };

    const handleKeyNav = (e) => {
      if (e.key === 'Escape') {
        closeLightbox();
      } else if (e.key === 'ArrowLeft') {
        const prev = (this.activePhotoIndex - 1 + this.currentPhotos.length) % this.currentPhotos.length;
        update(prev);
      } else if (e.key === 'ArrowRight') {
        const next = (this.activePhotoIndex + 1) % this.currentPhotos.length;
        update(next);
      }
    };

    // 修复 Bug 3：点击遮罩层外部空白处直接关闭灯箱
    modalEl.addEventListener('click', (e) => {
      if (e.target === modalEl || e.target.id === 'lightbox-modal') {
        closeLightbox();
      }
    });

    modalEl.querySelector('#lb-close').addEventListener('click', closeLightbox);
    document.addEventListener('keydown', handleKeyNav);

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
