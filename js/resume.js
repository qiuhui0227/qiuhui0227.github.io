/**
 * OASIS | Qiuhui & Yan
 * 履历文库与 A4 简历书房 (Resume Bookshelf & Workshop)
 * 
 * 核心设计特色：
 * 1. 日系实木温润陈列书架：简历如实体典雅书卷立于书架之上，点击翻阅，支持触控震动挺住与归位。
 * 2. 简约轻量化工作台：剔除重复蓝本按钮、冗余手动保存与繁杂文案，回归纯粹专注排版。
 * 3. 三大主流升学与职业风格：
 *    - 🔬 找导师学术简历 (advisor): 医科与科研前沿，突出导师意向、大创课题、实验技能与学术志向
 *    - 💼 校园与名企求职 (job): 强调重点实践/实习、STAR工程成果与核心技能矩阵
 *    - 🎓 申请奖学金评优 (scholarship): 聚焦学业位次、国家级/省校级竞赛荣誉、学生骨干奉献
 * 4. 1:1 标准 A4 矢量即时排版：
 *    - 左侧轻量配置，右侧高保真纸张渲染，支持一键浏览器原生矢量打印 (A4 PDF) 与 Word 导出。
 */

class ResumeModule {
  constructor() {
    this.currentPerson = 'yan'; // 'yan' | 'qiuhui'
    this.viewMode = 'bookshelf'; // 'bookshelf' | 'editor'
    this.activeResumeId = null;
    this.resumeData = null;
    this.saveStatusText = '✓ 已自动保存';
    this.saveTimer = null;
    this.mobileTab = 'edit'; // 'edit' | 'preview'
    this.showAvatarUrl = false;
  }

  // --- 场景风格元数据 ---
  getStyleMeta(style) {
    switch (style) {
      case 'job':
        return {
          key: 'job',
          name: '💼 校园/名企求职',
          tag: '名企招聘版',
          tagShort: '💼 求职',
          color: '#1e3a8a',
          desc: '成果导向 · STAR工程项目经历 · 核心技能矩阵'
        };
      case 'scholarship':
        return {
          key: 'scholarship',
          name: '🎓 申请奖学金',
          tag: '奖学金申报版',
          tagShort: '🎓 评优',
          color: '#881337',
          desc: '学业位次 · 国家级/省校级荣誉表彰 · 骨干奉献'
        };
      case 'advisor':
      default:
        return {
          key: 'advisor',
          name: '🔬 找导师学术简历',
          tag: '联系导师学术版',
          tagShort: '🔬 学术',
          color: '#0f766e',
          desc: '学术志趣 · 大创科研训练 · 实验技能与未来设想'
        };
    }
  }

  // 主渲染入口
  render(container) {
    if (!container) return;

    if (this.viewMode === 'editor' && this.activeResumeId) {
      this.resumeData = window.spaceStore.getResumeBook(this.currentPerson, this.activeResumeId);
      if (!this.resumeData) {
        this.viewMode = 'bookshelf';
      }
    }

    if (this.viewMode === 'bookshelf') {
      this.renderBookshelf(container);
    } else {
      this.renderEditor(container);
    }
  }

  // =========================================================================
  // 1. 实木陈列书架视图 (Artisan Wooden Bookshelf View)
  // =========================================================================
  renderBookshelf(container) {
    const books = window.spaceStore.getResumeBooks();
    const yanList = books.yan || [];
    const qhList = books.qiuhui || [];
    const currentList = this.currentPerson === 'yan' ? yanList : qhList;

    container.innerHTML = `
      <div class="oasis-bookshelf-zone">
        <!-- 极简主标头栏 -->
        <div class="oasis-header-bar resume-header-minimal">
          <div class="oasis-header-main">
            <h2 class="oasis-header-title">📄 履历档案</h2>
            <p class="oasis-header-sub">轻触书本翻阅 · 支持 A4 专业排版与一键打印导出</p>
          </div>
          <div class="oasis-header-actions">
            <button class="btn btn-primary btn-sm" id="btn-create-new-resume">
              <svg class="ico" width="13" height="13" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>
              新建履历
            </button>
          </div>
        </div>

        <!-- 极简轻量 Segmented 控制栏 (彻底告别“xx的简历卷宗”) -->
        <div class="resume-segment-bar">
          <div class="resume-segment-pill-group">
            <button class="resume-segment-pill ${this.currentPerson === 'yan' ? 'active' : ''}" data-person="yan">
              <span class="pill-avatar">👦</span>
              <span class="pill-name">王岩</span>
              <span class="pill-count">${yanList.length}</span>
            </button>
            <button class="resume-segment-pill ${this.currentPerson === 'qiuhui' ? 'active' : ''}" data-person="qiuhui">
              <span class="pill-avatar">👧</span>
              <span class="pill-name">杜秋慧</span>
              <span class="pill-count">${qhList.length}</span>
            </button>
          </div>
        </div>

        <!-- 实木温润陈列时光书架 -->
        <div class="bookshelf-display-unit" id="resume-bookshelf-unit">
          <div class="bookshelf-shelf-row">
            <div class="albums-grid bookshelf-grid" id="resume-shelf-grid">
              ${currentList.map(resume => this.renderResumeBookCard(resume)).join('')}
              ${this.renderAddResumeBookCard()}
            </div>
            <!-- 实木温润托架横梁 -->
            <div class="bookshelf-ledge-wood"></div>
          </div>

          <!-- 独立位于下方开阔空白处的放回书架控制栏 -->
          <div class="bookshelf-floating-retract-zone" id="resume-retract-zone">
            <button type="button" class="bookshelf-floating-retract-btn" id="btn-resume-shelf-retract" title="放回书架">
              <svg class="retract-ico" viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 4v12M18 11l-6 6-6-6M4 20h16"/>
              </svg>
              <span>放回书架</span>
            </button>
          </div>
        </div>
      </div>
    `;

    this.bindBookshelfEvents(container);
  }

  // 渲染单本简历图书
  renderResumeBookCard(resume) {
    const styleMeta = this.getStyleMeta(resume.style);
    const b = resume.basics || {};
    const defaultName = this.currentPerson === 'yan' ? '王岩' : '杜秋慧';
    const ownerName = b.name || defaultName;

    // 获取精炼封面主标题与副标
    let coverMainTitle = '名企求职';
    let coverSubTitle = '软件工程 · STAR经历';
    let shelfTitle = '名企求职版';
    if (resume.style === 'advisor') {
      coverMainTitle = this.currentPerson === 'qiuhui' ? '找导师简历' : '学术科研自述';
      coverSubTitle = this.currentPerson === 'qiuhui' ? '口腔医学 · 导师推荐' : '智能系统 · 课题攻读';
      shelfTitle = '找导师学术版';
    } else if (resume.style === 'scholarship') {
      coverMainTitle = '奖学金申报';
      coverSubTitle = '综合评优 · 荣誉自述';
      shelfTitle = '奖学金评优版';
    }

    if (resume.title && resume.title.includes('规培')) {
      coverMainTitle = '规培求职';
      coverSubTitle = '住院医师 · 临床考核';
      shelfTitle = '住院规培版';
    }

    return `
      <div class="shelf-photobook-card resume-shelf-book style-${resume.style}" data-id="${resume.id}" title="点击翻阅排版 · ${this.escapeHtml(resume.title)}">
        <div class="photobook-cover-wrap">
          <div class="photobook-spine-groove"></div>
          
          <div class="resume-book-cover-art ${resume.style}">
            <div class="resume-cover-header-rule">
              <span class="resume-cover-dot"></span>
              <span class="resume-cover-tag-txt">${this.escapeHtml(styleMeta.tagShort.replace(/[^\u4e00-\u9fa5]/g, ''))}</span>
              <span class="resume-cover-dot"></span>
            </div>
            
            <div class="resume-cover-emblem">${resume.style === 'job' ? '💼' : (resume.style === 'scholarship' ? '🎓' : '🔬')}</div>
            
            <div class="resume-cover-main-title">${this.escapeHtml(coverMainTitle)}</div>
            <div class="resume-cover-sub-title">${this.escapeHtml(coverSubTitle)}</div>
            
            <div class="resume-cover-footer-author">
              <span class="author-rule"></span>
              <span class="author-name">${this.escapeHtml(ownerName)}</span>
              <span class="author-rule"></span>
            </div>
          </div>

          <div class="photobook-quick-acts">
            <button class="photobook-mini-btn del btn-del-resume" data-id="${resume.id}" title="删除此卷">×</button>
          </div>
        </div>
        <div class="photobook-spine-label">
          <div class="photobook-spine-content">
            <h4 class="photobook-title-txt">${this.escapeHtml(shelfTitle)}</h4>
            <div class="photobook-sub-txt">
              <span>${this.escapeHtml(ownerName)}</span>
              <span>·</span>
              <span>${resume.updatedAt ? resume.updatedAt.slice(5) : '最新'}</span>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // 渲染添置新卷卡片
  renderAddResumeBookCard() {
    return `
      <div class="shelf-photobook-card add-resume-book" id="card-add-resume" title="新建一份新履历">
        <div class="photobook-cover-wrap add-wrap">
          <div class="photobook-spine-groove"></div>
          <div class="add-resume-content">
            <div class="add-icon-circle">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>
            </div>
            <div class="add-text">新建履历</div>
            <div class="add-sub">传承蓝本</div>
          </div>
        </div>
        <div class="photobook-spine-label">
          <div class="photobook-spine-content">
            <h4 class="photobook-title-txt">➕ 新建履历</h4>
            <div class="photobook-sub-txt">
              <span>添加新档案</span>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  bindBookshelfEvents(container) {
    const bookshelfUnit = container.querySelector('#resume-bookshelf-unit');
    const bookshelfGrid = container.querySelector('#resume-shelf-grid');
    const retractBtn = container.querySelector('#btn-resume-shelf-retract');
    let activePinnedCard = null;

    // 核心：挺住相册并放大
    const pinCard = (card) => {
      if (activePinnedCard && activePinnedCard !== card) {
        unpinCard();
      }
      const cardRect = card.getBoundingClientRect();
      const cardCenterX = cardRect.left + cardRect.width / 2;
      const shelfCenterX = window.innerWidth / 2;
      const diffX = shelfCenterX - cardCenterX;

      let nudgeX = 0;
      if (diffX > 15) {
        nudgeX = Math.min(diffX * 0.44, 52);
      } else if (diffX < -15) {
        nudgeX = Math.max(diffX * 0.44, -52);
      }

      card.style.transform = `translate3d(${nudgeX.toFixed(1)}px, -36px, 0) scale(1.68)`;
      card.classList.add('card-pinned');
      card.classList.remove('touch-pressing');
      bookshelfGrid?.classList.add('bookshelf-has-pinned');
      bookshelfUnit?.classList.add('has-pinned-card');
      activePinnedCard = card;
    };

    // 核心：收回相册
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

    // 绑定放回书架按钮
    retractBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();
      unpinCard();
    });

    // 点空白处收回
    const handleOutsideTap = (e) => {
      if (!activePinnedCard) return;
      if (e.target.closest('#btn-resume-shelf-retract')) {
        e.stopPropagation();
        unpinCard();
        return;
      }
      if (e.target.closest('.shelf-photobook-card') === activePinnedCard) {
        if (e.target.closest('.photobook-mini-btn')) return;
        const card = activePinnedCard;
        unpinCard();
        if (card.id === 'card-add-resume') {
          this.openCreateModal();
        } else {
          this.activeResumeId = card.dataset.id;
          this.viewMode = 'editor';
          this.render(container);
        }
        return;
      }
      unpinCard();
    };

    container.addEventListener('click', handleOutsideTap);

    // 绑定主人身份切换
    container.querySelectorAll('.resume-segment-pill, .person-tab').forEach(btn => {
      btn.addEventListener('click', () => {
        this.currentPerson = btn.dataset.person;
        this.render(container);
      });
    });

    // 绑定新建按钮
    container.querySelector('#btn-create-new-resume')?.addEventListener('click', () => {
      this.openCreateModal();
    });

    // 绑定书架卡片交互 (轻触翻阅、按住挺住)
    container.querySelectorAll('.shelf-photobook-card').forEach(card => {
      let pressTimer = null;
      let isVibrated = false;
      let isTouchMove = false;
      let startX = 0;
      let startY = 0;

      // 触摸事件
      card.addEventListener('touchstart', (e) => {
        if (e.target.closest('.photobook-mini-btn') || e.target.closest('.photobook-retract-btn')) return;
        if (activePinnedCard && activePinnedCard !== card) unpinCard();

        clearTimeout(pressTimer);
        isVibrated = false;
        isTouchMove = false;
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
        card.classList.add('touch-pressing');

        pressTimer = setTimeout(() => {
          isVibrated = true;
          if (navigator.vibrate) {
            try { navigator.vibrate(35); } catch (_) {}
          }
          pinCard(card);
        }, 280);
      }, { passive: true });

      card.addEventListener('touchmove', (e) => {
        const dx = e.touches[0].clientX - startX;
        const dy = e.touches[0].clientY - startY;
        if (Math.hypot(dx, dy) > 10) {
          isTouchMove = true;
          clearTimeout(pressTimer);
          card.classList.remove('touch-pressing');
        }
      }, { passive: true });

      card.addEventListener('touchend', (e) => {
        if (e.target.closest('.photobook-mini-btn')) return;
        clearTimeout(pressTimer);
        card.classList.remove('touch-pressing');
        if (isTouchMove) return;

        if (!isVibrated) {
          if (activePinnedCard === card) unpinCard();
          if (card.id === 'card-add-resume') {
            this.openCreateModal();
          } else {
            this.activeResumeId = card.dataset.id;
            this.viewMode = 'editor';
            this.render(container);
          }
        } else {
          e.preventDefault();
        }
      }, { passive: false });

      card.addEventListener('touchcancel', () => {
        clearTimeout(pressTimer);
        card.classList.remove('touch-pressing');
      }, { passive: true });

      // 桌面鼠标交互
      let mouseTimer = null;
      let mouseVibrated = false;

      card.addEventListener('mousedown', (e) => {
        if (e.button !== 0 || e.target.closest('.photobook-mini-btn') || e.target.closest('.photobook-retract-btn')) return;
        if (activePinnedCard && activePinnedCard !== card) unpinCard();
        mouseVibrated = false;
        card.classList.add('touch-pressing');
        mouseTimer = setTimeout(() => {
          mouseVibrated = true;
          pinCard(card);
        }, 280);
      });

      card.addEventListener('mouseup', (e) => {
        if (e.button !== 0 || e.target.closest('.photobook-mini-btn')) return;
        clearTimeout(mouseTimer);
        card.classList.remove('touch-pressing');
        if (!mouseVibrated) {
          if (activePinnedCard === card) unpinCard();
          if (card.id === 'card-add-resume') {
            this.openCreateModal();
          } else {
            this.activeResumeId = card.dataset.id;
            this.viewMode = 'editor';
            this.render(container);
          }
        }
      });

      card.addEventListener('mouseleave', () => {
        clearTimeout(mouseTimer);
        card.classList.remove('touch-pressing');
      });
    });

    // 绑定删除按钮
    container.querySelectorAll('.btn-del-resume').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();
        const id = btn.dataset.id;
        const book = window.spaceStore.getResumeBook(this.currentPerson, id);
        if (!confirm(`确定要从书架移除这份简历【${book?.title || id}】吗？`)) return;

        const res = window.spaceStore.deleteResumeBook(this.currentPerson, id);
        if (res.success) {
          window.spaceApp?.showToast('简历已从书架移除');
          this.render(container);
        } else {
          window.spaceApp?.showToast(res.message, true);
        }
      });
    });
  }

  // =========================================================================
  // 2. 简约新建弹窗 (Minimalist Creation Modal)
  // =========================================================================
  openCreateModal() {
    const books = window.spaceStore.getResumeBooks();
    const allResumes = [];
    (books.yan || []).forEach(r => allResumes.push({ ...r, ownerName: '王岩' }));
    (books.qiuhui || []).forEach(r => allResumes.push({ ...r, ownerName: '杜秋慧' }));

    const existingForOwner = allResumes.filter(r => r.owner === this.currentPerson);
    const defaultBlueprint = existingForOwner[0] || null;

    const modalHtml = `
      <div class="overlay" id="resume-create-modal">
        <div class="sheet blueprint-modal-box">
          <div class="sheet-head">
            <h3>➕ 添置新简历卷宗</h3>
            <button class="logout" id="resume-create-close" style="font-size:18px;">✕</button>
          </div>

          <form id="resume-create-form" class="login-form">
            <div>
              <label class="form-label">简历归属 *</label>
              <select name="owner" class="select" id="create-owner-select" required>
                <option value="yan" ${this.currentPerson === 'yan' ? 'selected' : ''}>👦 王岩 (Yan)</option>
                <option value="qiuhui" ${this.currentPerson === 'qiuhui' ? 'selected' : ''}>👧 杜秋慧 (Qiuhui)</option>
              </select>
            </div>

            <div>
              <label class="form-label">卷宗标题 / 简历名称 *</label>
              <input type="text" name="title" class="input" placeholder="例如：2026 北大医学部导师联系学术简历" required autofocus>
            </div>

            <div class="form-row">
              <div>
                <label class="form-label">场景风格 *</label>
                <select name="style" class="select" id="create-style-select" required>
                  <option value="advisor">🔬 找导师学术版 (医科/升学)</option>
                  <option value="job">💼 校园/名企求职版 (工程/实习)</option>
                  <option value="scholarship">🎓 申请奖学金版 (评优/表彰)</option>
                </select>
              </div>

              <div>
                <label class="form-label">信息继承蓝本</label>
                <select name="blueprintId" class="select" id="create-blueprint-select">
                  ${defaultBlueprint ? `<option value="${defaultBlueprint.id}">📑 自动继承已有的基本资料与经历</option>` : ''}
                  ${allResumes.filter(r => r.id !== defaultBlueprint?.id).map(r => `
                    <option value="${r.id}">📑 [${r.ownerName}] ${this.escapeHtml(r.title)}</option>
                  `).join('')}
                  <option value="blank">📄 使用空白标准模板</option>
                </select>
              </div>
            </div>

            <div style="display:flex; justify-content:flex-end; gap:10px; margin-top:16px;">
              <button type="button" class="btn btn-outline" id="resume-create-cancel">取消</button>
              <button type="submit" class="btn btn-primary">立即创建并进入排版</button>
            </div>
          </form>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);
    const modalEl = document.getElementById('resume-create-modal');
    const close = () => modalEl && modalEl.remove();

    modalEl.querySelector('#resume-create-close')?.addEventListener('click', close);
    modalEl.querySelector('#resume-create-cancel')?.addEventListener('click', close);

    modalEl.querySelector('#resume-create-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const targetOwner = fd.get('owner');
      const title = fd.get('title').trim();
      const style = fd.get('style');
      const bId = fd.get('blueprintId');

      const defaults = window.spaceStore.getDefaultResumeBooks();
      const baseTemplates = defaults[targetOwner] || defaults.yan;
      const matchedStyleTemplate = baseTemplates.find(t => t.style === style) || baseTemplates[0];

      const newResume = JSON.parse(JSON.stringify(matchedStyleTemplate));
      newResume.id = 'res_' + targetOwner + '_' + Date.now();
      newResume.owner = targetOwner;
      newResume.title = title;
      newResume.style = style;
      newResume.updatedAt = new Date().toISOString().split('T')[0];

      if (bId && bId !== 'blank') {
        const blueprint = allResumes.find(r => r.id === bId);
        if (blueprint) {
          if (blueprint.basics) newResume.basics = { ...newResume.basics, ...JSON.parse(JSON.stringify(blueprint.basics)) };
          if (blueprint.avatar) newResume.avatar = blueprint.avatar;
          if (blueprint.education?.length) newResume.education = JSON.parse(JSON.stringify(blueprint.education));
          if (blueprint.style === style) {
            if (blueprint.experiences?.length) newResume.experiences = JSON.parse(JSON.stringify(blueprint.experiences));
            if (blueprint.projects?.length) newResume.projects = JSON.parse(JSON.stringify(blueprint.projects));
            if (blueprint.honors?.length) newResume.honors = JSON.parse(JSON.stringify(blueprint.honors));
            if (blueprint.publications?.length) newResume.publications = JSON.parse(JSON.stringify(blueprint.publications));
            if (blueprint.skills?.length) newResume.skills = JSON.parse(JSON.stringify(blueprint.skills));
          }
        }
      }

      window.spaceStore.createResumeBook(targetOwner, newResume);
      close();

      this.currentPerson = targetOwner;
      this.activeResumeId = newResume.id;
      this.viewMode = 'editor';
      const container = document.getElementById('content-resume');
      if (container) this.render(container);
      window.spaceApp?.showToast(`已成功创建简历【${title}】！`);
    });
  }

  // =========================================================================
  // 3. 极简双栏工作台视图 (Editor & A4 Paper Preview)
  // =========================================================================
  renderEditor(container) {
    const d = this.resumeData;
    if (!d) {
      this.viewMode = 'bookshelf';
      this.render(container);
      return;
    }

    const b = d.basics || {};
    const styleMeta = this.getStyleMeta(d.style);
    const hasAvatar = !!d.avatar;

    container.innerHTML = `
      <div class="resume-wrapper">
        <!-- 统一主模块标头栏 (简约无冗余) -->
        <div class="oasis-header-bar">
          <div class="oasis-header-main">
            <div class="oasis-header-kicker" style="display:flex; align-items:center; gap:8px;">
              <button class="btn btn-outline btn-xs" id="btn-back-to-shelf" style="padding:2px 8px; font-size:11px;">
                ← 返回书架
              </button>
              <span>${this.currentPerson === 'yan' ? '👦 王岩' : '👧 杜秋慧'} · A4 标准工作台</span>
            </div>
            <div style="display:flex; align-items:center; gap:10px; margin-top:2px;">
              <h2 class="oasis-header-title" style="margin-bottom:0;">${this.escapeHtml(d.title)}</h2>
              <select id="select-editor-style" class="select" style="height:26px; font-size:11.5px; padding:1px 8px; width:auto;">
                <option value="advisor" ${d.style === 'advisor' ? 'selected' : ''}>🔬 找导师学术版</option>
                <option value="job" ${d.style === 'job' ? 'selected' : ''}>💼 校园名企求职版</option>
                <option value="scholarship" ${d.style === 'scholarship' ? 'selected' : ''}>🎓 申请奖学金版</option>
              </select>
            </div>
          </div>
          <div class="oasis-header-actions">
            <span class="save-indicator" id="resume-save-indicator">${this.saveStatusText}</span>
            <button class="btn btn-outline btn-sm" id="btn-export-word" title="导出 Word .doc 格式">
              📄 导出 Word
            </button>
            <button class="btn btn-primary btn-sm" id="btn-export-pdf" title="调用浏览器高清矢量打印 A4 纸张">
              🖨️ 打印 / 存为 PDF
            </button>
          </div>
        </div>

        <!-- 手机端便捷切换 Tab -->
        <div class="mobile-resume-tabs" style="display:none;">
          <button type="button" class="btn ${this.mobileTab === 'edit' ? 'btn-primary' : 'btn-outline'} btn-sm" id="btn-mobile-tab-edit">
            ✍️ 编辑资料
          </button>
          <button type="button" class="btn ${this.mobileTab === 'preview' ? 'btn-primary' : 'btn-outline'} btn-sm" id="btn-mobile-tab-preview">
            📄 预览 A4 纸张
          </button>
        </div>

        <!-- 双栏工作台 -->
        <div class="resume-workspace ${this.mobileTab}">
          <!-- 左侧：紧凑表单配置面板 -->
          <div class="resume-editor-panel" id="resume-editor-pane">
            <div class="resume-form-flow">

              <!-- 证件照轻量管理卡片 -->
              <div class="form-section-card">
                <div class="resume-avatar-tile">
                  <div class="avatar-preview-box">
                    ${hasAvatar ? `<img src="${d.avatar}" class="avatar-real-img" alt="avatar" />` : `<div class="avatar-placeholder-box">👤</div>`}
                  </div>
                  <div class="avatar-tile-info">
                    <div style="font-weight:700; font-size:12.5px; color:#18354a; margin-bottom:2px;">📷 证件照</div>
                    <div class="fine" style="color:#627d8c; margin-bottom:6px;">建议一寸白底或正装免冠照，自动高清压缩</div>
                    <div style="display:flex; align-items:center; gap:8px;">
                      <input type="file" id="input-avatar-file" accept="image/*" style="display:none;">
                      <button type="button" class="btn btn-outline btn-xs" id="btn-trigger-upload-avatar">
                        ${hasAvatar ? '更换照片' : '上传照片'}
                      </button>
                      ${hasAvatar ? `<button type="button" class="btn-text-del" id="btn-remove-avatar">移除</button>` : ''}
                      <button type="button" class="btn-text-muted" id="btn-toggle-avatar-url">
                        ${this.showAvatarUrl ? '收起外链' : '填图片链接'}
                      </button>
                    </div>
                    ${this.showAvatarUrl ? `
                      <div class="avatar-url-input-wrap" style="margin-top:6px;">
                        <input type="url" id="input-avatar-url" class="input sm" placeholder="https://...公开图片网址" value="${hasAvatar && d.avatar.startsWith('http') ? d.avatar : ''}">
                        <button type="button" class="btn btn-outline btn-xs" id="btn-apply-avatar-url">应用</button>
                      </div>
                    ` : ''}
                  </div>
                </div>
              </div>

              <!-- 基本信息 -->
              <div class="form-section-card">
                <div class="section-title">👤 基本信息</div>
                <div class="form-row" style="margin-top:8px;">
                  <div>
                    <label class="form-label">姓名 *</label>
                    <input type="text" class="input resume-sync" data-path="basics.name" value="${this.escapeHtml(b.name || '')}">
                  </div>
                  <div>
                    <label class="form-label">性别 / 出生年月</label>
                    <div style="display:flex; gap:6px;">
                      <input type="text" class="input resume-sync" data-path="basics.gender" placeholder="男/女" value="${this.escapeHtml(b.gender || '')}" style="width:55px;">
                      <input type="text" class="input resume-sync" data-path="basics.birthDate" placeholder="如 2001-08" value="${this.escapeHtml(b.birthDate || '')}">
                    </div>
                  </div>
                </div>

                <div class="form-row" style="margin-top:8px;">
                  <div>
                    <label class="form-label">联系电话 *</label>
                    <input type="text" class="input resume-sync" data-path="basics.phone" value="${this.escapeHtml(b.phone || '')}">
                  </div>
                  <div>
                    <label class="form-label">电子邮箱 *</label>
                    <input type="email" class="input resume-sync" data-path="basics.email" value="${this.escapeHtml(b.email || '')}">
                  </div>
                </div>

                <div class="form-row" style="margin-top:8px;">
                  <div>
                    <label class="form-label">毕业/就读高校</label>
                    <input type="text" class="input resume-sync" data-path="basics.school" value="${this.escapeHtml(b.school || '')}">
                  </div>
                  <div>
                    <label class="form-label">主修专业与学历层次</label>
                    <input type="text" class="input resume-sync" data-path="basics.major" placeholder="专业名 / 学士/硕士" value="${this.escapeHtml(b.major || '')}">
                  </div>
                </div>

                <div style="margin-top:8px;">
                  <label class="form-label">求职意向 / 奖学金级别 / 意向导师方向 *</label>
                  <input type="text" class="input resume-sync" data-path="basics.target" value="${this.escapeHtml(b.target || '')}">
                </div>

                <div class="form-row" style="margin-top:8px;">
                  <div>
                    <label class="form-label">政治面貌</label>
                    <input type="text" class="input resume-sync" data-path="basics.politicalStatus" placeholder="中共党员/共青团员" value="${this.escapeHtml(b.politicalStatus || '')}">
                  </div>
                  <div>
                    <label class="form-label">学业绩点 / 排名</label>
                    <input type="text" class="input resume-sync" data-path="basics.gpaRank" placeholder="如 GPA 3.86 / 前5%" value="${this.escapeHtml(b.gpaRank || '')}">
                  </div>
                  <div>
                    <label class="form-label">外语水平</label>
                    <input type="text" class="input resume-sync" data-path="basics.englishLevel" placeholder="如 CET-6 565" value="${this.escapeHtml(b.englishLevel || '')}">
                  </div>
                </div>
              </div>

              <!-- 教育经历 -->
              <div class="form-section-card">
                <div class="section-header-row">
                  <div class="section-title">🎓 教育背景</div>
                  <button type="button" class="btn btn-outline btn-xs" id="btn-add-edu">➕ 添加高校</button>
                </div>
                <div id="edu-list-wrap">
                  ${(d.education || []).map((edu, idx) => `
                    <div class="sub-form-item" data-idx="${idx}">
                      <div class="sub-item-header">
                        <span style="font-weight:700; font-size:12px;">教育经历 #${idx + 1}</span>
                        <button type="button" class="btn-text-del btn-del-edu" data-idx="${idx}">删除</button>
                      </div>
                      <div class="form-row">
                        <input type="text" class="input sm edu-sync" data-field="school" data-idx="${idx}" placeholder="高校名称" value="${this.escapeHtml(edu.school || '')}">
                        <input type="text" class="input sm edu-sync" data-field="major" data-idx="${idx}" placeholder="专业与学院" value="${this.escapeHtml(edu.major || '')}">
                      </div>
                      <div class="form-row" style="margin-top:6px;">
                        <input type="text" class="input sm edu-sync" data-field="degree" data-idx="${idx}" placeholder="学历学位" value="${this.escapeHtml(edu.degree || '')}">
                        <input type="text" class="input sm edu-sync" data-field="period" data-idx="${idx}" placeholder="起止时间 (如 2022.09 - 至今)" value="${this.escapeHtml(edu.period || '')}">
                      </div>
                      <div style="margin-top:6px;">
                        <input type="text" class="input sm edu-sync" data-field="desc" data-idx="${idx}" placeholder="核心课程/学业位次说明" value="${this.escapeHtml(edu.desc || '')}">
                      </div>
                    </div>
                  `).join('')}
                </div>
              </div>

              <!-- 重点经历 (实习/规培/工程/工作) -->
              <div class="form-section-card">
                <div class="section-header-row">
                  <div class="section-title">💼 实践与工作经历</div>
                  <button type="button" class="btn btn-outline btn-xs" id="btn-add-exp">➕ 添加经历</button>
                </div>
                <div id="exp-list-wrap">
                  ${(d.experiences || []).map((exp, idx) => `
                    <div class="sub-form-item" data-idx="${idx}">
                      <div class="sub-item-header">
                        <span style="font-weight:700; font-size:12px;">经历 #${idx + 1}</span>
                        <button type="button" class="btn-text-del btn-del-exp" data-idx="${idx}">删除</button>
                      </div>
                      <div class="form-row">
                        <input type="text" class="input sm exp-sync" data-field="org" data-idx="${idx}" placeholder="单位/机构/医院名称" value="${this.escapeHtml(exp.org || '')}">
                        <input type="text" class="input sm exp-sync" data-field="role" data-idx="${idx}" placeholder="职责角色/岗位" value="${this.escapeHtml(exp.role || '')}">
                      </div>
                      <div style="margin-top:6px;">
                        <input type="text" class="input sm exp-sync" data-field="period" data-idx="${idx}" placeholder="起止时间 (如 2024.03 - 至今)" value="${this.escapeHtml(exp.period || '')}">
                      </div>
                      <div style="margin-top:6px;">
                        <textarea class="textarea sm exp-sync-bullets" data-idx="${idx}" rows="2" placeholder="工作内容与量化成果 (每行一项)">${(exp.bullets || []).join('\n')}</textarea>
                      </div>
                    </div>
                  `).join('')}
                </div>
              </div>

              <!-- 科研课题与重点项目 -->
              <div class="form-section-card">
                <div class="section-header-row">
                  <div class="section-title">🔬 科研大创与重点项目</div>
                  <button type="button" class="btn btn-outline btn-xs" id="btn-add-proj">➕ 添加项目</button>
                </div>
                <div id="proj-list-wrap">
                  ${(d.projects || []).map((p, idx) => `
                    <div class="sub-form-item" data-idx="${idx}">
                      <div class="sub-item-header">
                        <span style="font-weight:700; font-size:12px;">项目/课题 #${idx + 1}</span>
                        <button type="button" class="btn-text-del btn-del-proj" data-idx="${idx}">删除</button>
                      </div>
                      <div class="form-row">
                        <input type="text" class="input sm proj-sync" data-field="name" data-idx="${idx}" placeholder="课题或项目全称" value="${this.escapeHtml(p.name || '')}">
                        <input type="text" class="input sm proj-sync" data-field="role" data-idx="${idx}" placeholder="承担角色 (如主要成员/负责人)" value="${this.escapeHtml(p.role || '')}">
                      </div>
                      <div class="form-row" style="margin-top:6px;">
                        <input type="text" class="input sm proj-sync" data-field="period" data-idx="${idx}" placeholder="起止时间" value="${this.escapeHtml(p.period || '')}">
                        <input type="text" class="input sm proj-sync" data-field="keywords" data-idx="${idx}" placeholder="关键词 (如 PCR, 骨缺损, C++)" value="${this.escapeHtml(p.keywords || '')}">
                      </div>
                      <div style="margin-top:6px;">
                        <textarea class="textarea sm proj-sync-bullets" data-idx="${idx}" rows="2" placeholder="研究重点与成果 (每行一项)">${(p.bullets || []).join('\n')}</textarea>
                      </div>
                    </div>
                  `).join('')}
                </div>
              </div>

              <!-- 荣誉奖项 -->
              <div class="form-section-card">
                <div class="section-header-row">
                  <div class="section-title">🏆 荣誉表彰与奖项</div>
                  <button type="button" class="btn btn-outline btn-xs" id="btn-add-honor">➕ 添加奖项</button>
                </div>
                <div id="honor-list-wrap">
                  ${(d.honors || []).map((h, idx) => `
                    <div class="sub-form-item" data-idx="${idx}">
                      <div class="sub-item-header">
                        <span style="font-weight:700; font-size:12px;">奖项 #${idx + 1}</span>
                        <button type="button" class="btn-text-del btn-del-honor" data-idx="${idx}">删除</button>
                      </div>
                      <div class="form-row">
                        <input type="text" class="input sm honor-sync" data-field="title" data-idx="${idx}" placeholder="奖项全称" value="${this.escapeHtml(h.title || '')}">
                        <input type="text" class="input sm honor-sync" data-field="level" data-idx="${idx}" placeholder="级别 (如国家级/校级)" value="${this.escapeHtml(h.level || '')}">
                      </div>
                      <div class="form-row" style="margin-top:6px;">
                        <input type="text" class="input sm honor-sync" data-field="date" data-idx="${idx}" placeholder="年份/日期" value="${this.escapeHtml(h.date || '')}">
                        <input type="text" class="input sm honor-sync" data-field="desc" data-idx="${idx}" placeholder="简要说明" value="${this.escapeHtml(h.desc || '')}">
                      </div>
                    </div>
                  `).join('')}
                </div>
              </div>

              <!-- 专业技能与自我陈述 -->
              <div class="form-section-card">
                <div class="section-title">⚡ 技能矩阵与自述</div>
                <div style="margin-top:8px;">
                  <label class="form-label">专业技能清单 (每行一项)</label>
                  <textarea class="textarea sm" id="input-skills-matrix" rows="3" placeholder="例如：\n临床技能: 严格无菌缝合、翻瓣与印模制取\n科研素养: 熟悉文献检索、统计软件与实验设计">${(d.skills || []).join('\n')}</textarea>
                </div>
                <div style="margin-top:8px;">
                  <label class="form-label">综合陈述 / 导师攻读设想</label>
                  <textarea class="textarea sm resume-sync" data-path="selfEvaluation" rows="3" placeholder="总结个人优势、学术志向或导师课题攻读设想">${this.escapeHtml(d.selfEvaluation || '')}</textarea>
                </div>
              </div>

            </div>
          </div>

          <!-- 右侧：真实 1:1 比例 A4 纸张预览 (A4 Page Sheet) -->
          <div class="resume-preview-panel" id="resume-preview-pane">
            <div class="a4-preview-viewport" id="a4-preview-viewport">
              <div class="a4-page-sheet style-${d.style}" id="a4-print-target">
                ${this.renderA4SheetHtml()}
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    this.bindEditorEvents(container);
  }

  // =========================================================================
  // 4. A4 纸张 HTML 排版引擎
  // =========================================================================
  renderA4SheetHtml() {
    const d = this.resumeData;
    const b = d.basics || {};
    const hasAvatar = !!d.avatar;

    const contactParts = [
      b.gender && `${b.gender}`,
      b.birthDate && `${b.birthDate}`,
      b.politicalStatus && `${b.politicalStatus}`,
      b.phone && `📞 ${b.phone}`,
      b.email && `✉️ ${b.email}`,
      b.englishLevel && `🔤 ${b.englishLevel}`,
      b.gpaRank && `⭐ ${b.gpaRank}`
    ].filter(Boolean);

    return `
      <!-- 头部 -->
      <div class="rp-header">
        <div class="rp-header-main">
          <div class="rp-name-row">
            <h1 class="rp-name">${this.escapeHtml(b.name || '个人简历')}</h1>
            ${b.target ? `<span class="rp-target-badge">🎯 ${this.escapeHtml(b.target)}</span>` : ''}
          </div>
          <div class="rp-contact-row">
            ${contactParts.join(' &nbsp;|&nbsp; ')}
          </div>
        </div>
        ${hasAvatar ? `
          <div class="rp-header-avatar">
            <img src="${d.avatar}" alt="avatar" />
          </div>
        ` : ''}
      </div>

      <!-- 教育背景 -->
      ${(d.education && d.education.length > 0) ? `
        <div class="rp-section-title">
          <span>🎓 教育背景</span>
        </div>
        ${d.education.map(edu => `
          <div style="margin-bottom:6pt;">
            <div class="rp-item-row">
              <span class="rp-bold">${this.escapeHtml(edu.school)} · ${this.escapeHtml(edu.major || '')}</span>
              <span class="rp-meta">${this.escapeHtml(edu.period || '')}</span>
            </div>
            <div class="rp-item-row">
              <span style="font-size:8.5pt; color:#4b5563;">${this.escapeHtml(edu.degree || '')} ${edu.gpa ? `&nbsp;|&nbsp; ${this.escapeHtml(edu.gpa)}` : ''}</span>
            </div>
            ${edu.desc ? `<div class="rp-desc-text">${this.escapeHtml(edu.desc)}</div>` : ''}
          </div>
        `).join('')}
      ` : ''}

      <!-- 重点实践与工作经历 -->
      ${(d.experiences && d.experiences.length > 0) ? `
        <div class="rp-section-title">
          <span>💼 重点经历与工作实践</span>
        </div>
        ${d.experiences.map(exp => `
          <div style="margin-bottom:6pt;">
            <div class="rp-item-row">
              <span class="rp-bold">${this.escapeHtml(exp.org)} · ${this.escapeHtml(exp.role || '')}</span>
              <span class="rp-meta">${this.escapeHtml(exp.period || '')}</span>
            </div>
            ${(exp.bullets && exp.bullets.length > 0) ? `
              <ul class="rp-bullets">
                ${exp.bullets.map(bullet => `<li>${this.escapeHtml(bullet)}</li>`).join('')}
              </ul>
            ` : ''}
          </div>
        `).join('')}
      ` : ''}

      <!-- 科研大创与重点项目 -->
      ${(d.projects && d.projects.length > 0) ? `
        <div class="rp-section-title">
          <span>🔬 科研课题与创新项目</span>
        </div>
        ${d.projects.map(p => `
          <div style="margin-bottom:6pt;">
            <div class="rp-item-row">
              <span class="rp-bold">${this.escapeHtml(p.name)}</span>
              <span class="rp-meta">${this.escapeHtml(p.period || '')}</span>
            </div>
            <div class="rp-item-row">
              <span style="font-size:8.5pt; color:#4b5563;">角色：${this.escapeHtml(p.role || '主要成员')} ${p.keywords ? `&nbsp;|&nbsp; 关键词: ${this.escapeHtml(p.keywords)}` : ''}</span>
            </div>
            ${(p.bullets && p.bullets.length > 0) ? `
              <ul class="rp-bullets">
                ${p.bullets.map(bullet => `<li>${this.escapeHtml(bullet)}</li>`).join('')}
              </ul>
            ` : ''}
          </div>
        `).join('')}
      ` : ''}

      <!-- 荣誉奖励与表彰 -->
      ${(d.honors && d.honors.length > 0) ? `
        <div class="rp-section-title">
          <span>🏆 重点奖项与荣誉表彰</span>
        </div>
        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:4pt 12pt; margin-bottom:6pt;">
          ${d.honors.map(h => `
            <div style="font-size:8.5pt; line-height:1.4;">
              <span class="rp-bold">▪ ${this.escapeHtml(h.title)}</span>
              <span class="rp-meta">(${this.escapeHtml(h.level || '')} · ${this.escapeHtml(h.date || '')})</span>
            </div>
          `).join('')}
        </div>
      ` : ''}

      <!-- 专业技能 -->
      ${(d.skills && d.skills.length > 0) ? `
        <div class="rp-section-title">
          <span>⚡ 专业技能与素养</span>
        </div>
        <ul class="rp-bullets" style="margin-bottom:6pt;">
          ${d.skills.map(s => `<li>${this.escapeHtml(s)}</li>`).join('')}
        </ul>
      ` : ''}

      <!-- 自我评价 / 导师攻读设想 -->
      ${d.selfEvaluation ? `
        <div class="rp-section-title">
          <span>📝 综合陈述与设想</span>
        </div>
        <div class="rp-desc-text" style="font-size:8.5pt; line-height:1.6; color:#374151;">
          ${this.escapeHtml(d.selfEvaluation)}
        </div>
      ` : ''}
    `;
  }

  // =========================================================================
  // 5. 工作台事件绑定 (极速响应与无缝自动保存)
  // =========================================================================
  bindEditorEvents(container) {
    // 返回书架
    container.querySelector('#btn-back-to-shelf')?.addEventListener('click', () => {
      this.saveCurrent();
      this.viewMode = 'bookshelf';
      this.render(container);
    });

    // 风格即时切换
    container.querySelector('#select-editor-style')?.addEventListener('change', (e) => {
      this.resumeData.style = e.target.value;
      this.saveCurrent();
      this.refreshPreview();
    });

    // 导出 Word
    container.querySelector('#btn-export-word')?.addEventListener('click', () => {
      this.exportWord();
    });

    // 打印导出标准 A4 PDF (带智能文件命名与 100% 格式同步)
    container.querySelector('#btn-export-pdf')?.addEventListener('click', () => {
      const b = this.resumeData.basics || {};
      const ownerName = b.name || (this.currentPerson === 'yan' ? '王岩' : '杜秋慧');
      const styleMeta = this.getStyleMeta(this.resumeData.style);
      const originalTitle = document.title;
      document.title = `${ownerName}_${styleMeta.tagShort.replace(/[^\u4e00-\u9fa5]/g, '')}简历_A4规范`;
      window.print();
      setTimeout(() => {
        document.title = originalTitle;
      }, 1200);
    });

    // 移动端 Tab 切换
    container.querySelector('#btn-mobile-tab-edit')?.addEventListener('click', () => {
      this.mobileTab = 'edit';
      this.render(container);
    });
    container.querySelector('#btn-mobile-tab-preview')?.addEventListener('click', () => {
      this.mobileTab = 'preview';
      this.render(container);
    });

    // 证件照瞬时上传 (极速硬件压缩，用户 0 等待看到照片，静默后台同步云端)
    const avatarFileInput = container.querySelector('#input-avatar-file');
    container.querySelector('#btn-trigger-upload-avatar')?.addEventListener('click', () => {
      avatarFileInput?.click();
    });

    avatarFileInput?.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        // 1. 瞬时极速压缩 (使用轻量 ObjectURL，无需读取大体积 Base64，15ms 内完成)
        const base64 = await this.compressAvatarFast(file);
        
        // 2. 毫秒级即时更新界面，用户零等待看到照片！
        this.resumeData.avatar = base64;
        this.saveCurrent();
        this.render(container);
        window.spaceApp?.showToast('✨ 证件照已导入就绪！', false);

        // 3. 后台静默将轻量压缩图 (~30KB) 同步至云端，绝不阻断界面与等待
        window.spaceStore.uploadPhoto(base64, 'resume_avatar', `avatar_${Date.now()}.jpg`)
          .then(cloudUrl => {
            if (cloudUrl) {
              this.resumeData.avatar = cloudUrl;
              this.saveCurrent();
            }
          })
          .catch(() => {});
      } catch (err) {
        window.spaceApp?.showToast('图片导入失败，请重试', true);
      }
    });

    // 切换图片外链输入框
    container.querySelector('#btn-toggle-avatar-url')?.addEventListener('click', () => {
      this.showAvatarUrl = !this.showAvatarUrl;
      this.render(container);
    });

    // 应用外链
    container.querySelector('#btn-apply-avatar-url')?.addEventListener('click', () => {
      const url = container.querySelector('#input-avatar-url')?.value.trim();
      if (!url) {
        window.spaceApp?.showToast('请先输入有效的图片链接', true);
        return;
      }
      this.resumeData.avatar = url;
      this.saveCurrent();
      this.render(container);
      window.spaceApp?.showToast('外链证件照已应用！');
    });

    // 移除照片
    container.querySelector('#btn-remove-avatar')?.addEventListener('click', () => {
      this.resumeData.avatar = '';
      this.saveCurrent();
      this.render(container);
      window.spaceApp?.showToast('已移除证件照');
    });

    // 字段双向同步
    container.querySelectorAll('.resume-sync').forEach(input => {
      input.addEventListener('input', (e) => {
        const path = e.target.dataset.path;
        const val = e.target.value;
        this.setObjectPath(this.resumeData, path, val);
        this.triggerAutoSave();
        this.refreshPreview();
      });
    });

    // 技能文本域
    container.querySelector('#input-skills-matrix')?.addEventListener('input', (e) => {
      const lines = e.target.value.split('\n').map(l => l.trim()).filter(Boolean);
      this.resumeData.skills = lines;
      this.triggerAutoSave();
      this.refreshPreview();
    });

    // --- 教育经历 ---
    container.querySelector('#btn-add-edu')?.addEventListener('click', () => {
      if (!this.resumeData.education) this.resumeData.education = [];
      this.resumeData.education.push({ school: '高校名称', major: '专业', degree: '学士/硕士', period: '2023.09 - 至今', desc: '' });
      this.saveCurrent();
      this.render(container);
    });

    container.querySelectorAll('.btn-del-edu').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.idx, 10);
        this.resumeData.education.splice(idx, 1);
        this.saveCurrent();
        this.render(container);
      });
    });

    container.querySelectorAll('.edu-sync').forEach(input => {
      input.addEventListener('input', (e) => {
        const idx = parseInt(e.target.dataset.idx, 10);
        const field = e.target.dataset.field;
        if (this.resumeData.education?.[idx]) {
          this.resumeData.education[idx][field] = e.target.value;
          this.triggerAutoSave();
          this.refreshPreview();
        }
      });
    });

    // --- 实践经历 ---
    container.querySelector('#btn-add-exp')?.addEventListener('click', () => {
      if (!this.resumeData.experiences) this.resumeData.experiences = [];
      this.resumeData.experiences.push({ org: '单位/机构名称', role: '岗位角色', period: '2024.03 - 至今', bullets: ['工作内容与职责描述'] });
      this.saveCurrent();
      this.render(container);
    });

    container.querySelectorAll('.btn-del-exp').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.idx, 10);
        this.resumeData.experiences.splice(idx, 1);
        this.saveCurrent();
        this.render(container);
      });
    });

    container.querySelectorAll('.exp-sync').forEach(input => {
      input.addEventListener('input', (e) => {
        const idx = parseInt(e.target.dataset.idx, 10);
        const field = e.target.dataset.field;
        if (this.resumeData.experiences?.[idx]) {
          this.resumeData.experiences[idx][field] = e.target.value;
          this.triggerAutoSave();
          this.refreshPreview();
        }
      });
    });

    container.querySelectorAll('.exp-sync-bullets').forEach(textarea => {
      textarea.addEventListener('input', (e) => {
        const idx = parseInt(e.target.dataset.idx, 10);
        if (this.resumeData.experiences?.[idx]) {
          this.resumeData.experiences[idx].bullets = e.target.value.split('\n').map(l => l.trim()).filter(Boolean);
          this.triggerAutoSave();
          this.refreshPreview();
        }
      });
    });

    // --- 科研项目 ---
    container.querySelector('#btn-add-proj')?.addEventListener('click', () => {
      if (!this.resumeData.projects) this.resumeData.projects = [];
      this.resumeData.projects.push({ name: '课题/项目全称', role: '承担角色', period: '2024.03 - 至今', keywords: '', bullets: ['项目攻关内容与成果'] });
      this.saveCurrent();
      this.render(container);
    });

    container.querySelectorAll('.btn-del-proj').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.idx, 10);
        this.resumeData.projects.splice(idx, 1);
        this.saveCurrent();
        this.render(container);
      });
    });

    container.querySelectorAll('.proj-sync').forEach(input => {
      input.addEventListener('input', (e) => {
        const idx = parseInt(e.target.dataset.idx, 10);
        const field = e.target.dataset.field;
        if (this.resumeData.projects?.[idx]) {
          this.resumeData.projects[idx][field] = e.target.value;
          this.triggerAutoSave();
          this.refreshPreview();
        }
      });
    });

    container.querySelectorAll('.proj-sync-bullets').forEach(textarea => {
      textarea.addEventListener('input', (e) => {
        const idx = parseInt(e.target.dataset.idx, 10);
        if (this.resumeData.projects?.[idx]) {
          this.resumeData.projects[idx].bullets = e.target.value.split('\n').map(l => l.trim()).filter(Boolean);
          this.triggerAutoSave();
          this.refreshPreview();
        }
      });
    });

    // --- 荣誉奖项 ---
    container.querySelector('#btn-add-honor')?.addEventListener('click', () => {
      if (!this.resumeData.honors) this.resumeData.honors = [];
      this.resumeData.honors.push({ title: '荣誉奖项全称', level: '校级/省部级', date: '2024', desc: '表彰说明' });
      this.saveCurrent();
      this.render(container);
    });

    container.querySelectorAll('.btn-del-honor').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.idx, 10);
        this.resumeData.honors.splice(idx, 1);
        this.saveCurrent();
        this.render(container);
      });
    });

    container.querySelectorAll('.honor-sync').forEach(input => {
      input.addEventListener('input', (e) => {
        const idx = parseInt(e.target.dataset.idx, 10);
        const field = e.target.dataset.field;
        if (this.resumeData.honors?.[idx]) {
          this.resumeData.honors[idx][field] = e.target.value;
          this.triggerAutoSave();
          this.refreshPreview();
        }
      });
    });

    // 初始化时自适应 A4 缩放，确保与打印 PDF 100% 像素级一致
    setTimeout(() => this.adjustA4PreviewScale(), 50);
    window.addEventListener('resize', () => this.adjustA4PreviewScale());
  }

  // 刷新右侧预览
  refreshPreview() {
    const previewEl = document.getElementById('a4-print-target');
    if (previewEl) {
      previewEl.className = `a4-page-sheet style-${this.resumeData.style}`;
      previewEl.innerHTML = this.renderA4SheetHtml();
      this.adjustA4PreviewScale();
    }
  }

  // 立即保存
  saveCurrent() {
    if (this.resumeData && this.activeResumeId) {
      window.spaceStore.saveResumeBook(this.currentPerson, this.resumeData);
      const indicator = document.getElementById('resume-save-indicator');
      if (indicator) indicator.textContent = '✓ 已自动保存';
    }
  }

  // 防抖自动保存
  triggerAutoSave() {
    const indicator = document.getElementById('resume-save-indicator');
    if (indicator) indicator.textContent = '正在保存修改...';
    clearTimeout(this.saveTimer);
    this.saveTimer = setTimeout(() => {
      this.saveCurrent();
    }, 600);
  }

  // 辅助路径设值
  setObjectPath(obj, path, value) {
    const parts = path.split('.');
    let curr = obj;
    for (let i = 0; i < parts.length - 1; i++) {
      if (!curr[parts[i]]) curr[parts[i]] = {};
      curr = curr[parts[i]];
    }
    curr[parts[parts.length - 1]] = value;
  }

  // 证件照规范压缩 (3:4 标准比例，约 35KB，使用 ObjectURL 杜绝大图卡顿)
  compressAvatarFast(file, targetW = 320, targetH = 420) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(url);
        try {
          const canvas = document.createElement('canvas');
          canvas.width = targetW;
          canvas.height = targetH;
          const ctx = canvas.getContext('2d');

          const imgRatio = img.width / img.height;
          const targetRatio = targetW / targetH;
          let sW = img.width;
          let sH = img.height;
          let sX = 0;
          let sY = 0;

          if (imgRatio > targetRatio) {
            sW = img.height * targetRatio;
            sX = (img.width - sW) / 2;
          } else {
            sH = img.width / targetRatio;
            sY = (img.height - sH) / 2;
          }

          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, targetW, targetH);
          ctx.drawImage(img, sX, sY, sW, sH, 0, 0, targetW, targetH);

          resolve(canvas.toDataURL('image/jpeg', 0.88));
        } catch (e) {
          reject(e);
        }
      };
      img.onerror = (e) => {
        URL.revokeObjectURL(url);
        reject(e);
      };
      img.src = url;
    });
  }

  // 兼容旧接口
  compressAvatar(file, targetW = 320, targetH = 420) {
    return this.compressAvatarFast(file, targetW, targetH);
  }

  // 自适应 A4 页面预览等比缩放 (确保移动端/小屏幕也能 100% 像素级对齐实际 A4 PDF 打印版面)
  adjustA4PreviewScale() {
    const panel = document.getElementById('resume-preview-pane');
    const viewport = document.getElementById('a4-preview-viewport');
    const sheet = document.getElementById('a4-print-target');
    if (!panel || !sheet) return;

    // A4 宽度在标准 96DPI 下约为 794px (210mm)
    const a4PixelWidth = 794;
    const a4PixelHeight = 1123;
    const availableWidth = panel.clientWidth - 24;

    if (availableWidth < a4PixelWidth && availableWidth > 120) {
      const scale = availableWidth / a4PixelWidth;
      sheet.style.transform = `scale(${scale})`;
      sheet.style.transformOrigin = 'top center';
      if (viewport) {
        viewport.style.width = '100%';
        viewport.style.height = `${(a4PixelHeight * scale) + 24}px`;
        viewport.style.overflow = 'hidden';
      }
    } else {
      sheet.style.transform = 'none';
      sheet.style.transformOrigin = 'top center';
      if (viewport) {
        viewport.style.width = 'auto';
        viewport.style.height = 'auto';
        viewport.style.overflow = 'visible';
      }
    }
  }

  // 导出标准 Word (.doc) 包含证件照
  exportWord() {
    const d = this.resumeData;
    const b = d.basics || {};
    const hasAvatar = !!d.avatar;

    const wordHtml = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>${this.escapeHtml(b.name || '个人简历')}</title>
        <style>
          body { font-family: 'Microsoft YaHei', SimSun, sans-serif; font-size: 10.5pt; line-height: 1.5; color: #1f2937; }
          .header-table { width: 100%; border: none; margin-bottom: 12pt; border-bottom: 2pt solid #1e3a8a; padding-bottom: 8pt; }
          .header-main { vertical-align: top; }
          .header-avatar { width: 90pt; text-align: right; vertical-align: top; }
          .avatar-img { width: 80pt; height: 106pt; border: 1pt solid #d1d5db; }
          h1 { font-size: 20pt; margin: 0 0 4pt 0; color: #111827; }
          .target { font-size: 11pt; color: #1e40af; font-weight: bold; margin-bottom: 6pt; }
          .contact { font-size: 9pt; color: #4b5563; line-height: 1.6; }
          .section-title { font-size: 11.5pt; font-weight: bold; color: #1e3a8a; border-bottom: 1pt solid #e5e7eb; padding-bottom: 3pt; margin-top: 14pt; margin-bottom: 6pt; }
          .bold { font-weight: bold; color: #111827; }
          .meta { color: #6b7280; font-size: 9pt; float: right; }
          .desc { font-size: 9.5pt; color: #374151; margin-top: 2pt; margin-bottom: 6pt; }
          ul { margin: 2pt 0 6pt 18pt; padding: 0; }
          li { font-size: 9.5pt; color: #374151; margin-bottom: 2pt; }
        </style>
      </head>
      <body>
        <table class="header-table">
          <tr>
            <td class="header-main">
              <h1>${this.escapeHtml(b.name || '个人简历')}</h1>
              <div class="target">🎯 意向目标：${this.escapeHtml(b.target || '')}</div>
              <div class="contact">
                ${[b.phone, b.email, b.school, b.major, b.degree, b.gpaRank, b.englishLevel].filter(Boolean).map(x => this.escapeHtml(x)).join(' | ')}
              </div>
            </td>
            ${hasAvatar ? `
              <td class="header-avatar">
                <img src="${d.avatar}" class="avatar-img" alt="avatar" />
              </td>
            ` : ''}
          </tr>
        </table>

        <!-- 教育背景 -->
        ${(d.education && d.education.length > 0) ? `
          <div class="section-title">教育背景</div>
          ${d.education.map(edu => `
            <div style="margin-bottom: 6pt;">
              <span class="bold">${this.escapeHtml(edu.school)} · ${this.escapeHtml(edu.major || '')} (${this.escapeHtml(edu.degree || '')})</span>
              <span class="meta">${this.escapeHtml(edu.period || '')}</span>
              ${edu.desc ? `<div class="desc">${this.escapeHtml(edu.desc)}</div>` : ''}
            </div>
          `).join('')}
        ` : ''}

        <!-- 实践经历 -->
        ${(d.experiences && d.experiences.length > 0) ? `
          <div class="section-title">实践与工作经历</div>
          ${d.experiences.map(exp => `
            <div style="margin-bottom: 6pt;">
              <span class="bold">${this.escapeHtml(exp.org)} · ${this.escapeHtml(exp.role || '')}</span>
              <span class="meta">${this.escapeHtml(exp.period || '')}</span>
              ${(exp.bullets && exp.bullets.length > 0) ? `
                <ul>${exp.bullets.map(b => `<li>${this.escapeHtml(b)}</li>`).join('')}</ul>
              ` : ''}
            </div>
          `).join('')}
        ` : ''}

        <!-- 项目经历 -->
        ${(d.projects && d.projects.length > 0) ? `
          <div class="section-title">科研大创与重点项目</div>
          ${d.projects.map(p => `
            <div style="margin-bottom: 6pt;">
              <span class="bold">${this.escapeHtml(p.name)} (${this.escapeHtml(p.role || '')})</span>
              <span class="meta">${this.escapeHtml(p.period || '')}</span>
              ${(p.bullets && p.bullets.length > 0) ? `
                <ul>${p.bullets.map(b => `<li>${this.escapeHtml(b)}</li>`).join('')}</ul>
              ` : ''}
            </div>
          `).join('')}
        ` : ''}

        <!-- 荣誉奖励 -->
        ${(d.honors && d.honors.length > 0) ? `
          <div class="section-title">荣誉表彰与奖项</div>
          <ul>
            ${d.honors.map(h => `<li><strong>${this.escapeHtml(h.title)}</strong> (${this.escapeHtml(h.level || '')} · ${this.escapeHtml(h.date || '')}) - ${this.escapeHtml(h.desc || '')}</li>`).join('')}
          </ul>
        ` : ''}

        <!-- 专业技能 -->
        ${(d.skills && d.skills.length > 0) ? `
          <div class="section-title">专业技能与素养</div>
          <ul>
            ${d.skills.map(s => `<li>${this.escapeHtml(s)}</li>`).join('')}
          </ul>
        ` : ''}

        <!-- 综合陈述 -->
        ${d.selfEvaluation ? `
          <div class="section-title">综合陈述</div>
          <div class="desc">${this.escapeHtml(d.selfEvaluation)}</div>
        ` : ''}
      </body>
      </html>
    `;

    const blob = new Blob([wordHtml], { type: 'application/msword;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${b.name || '个人'}_A4简历_${d.style}.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    window.spaceApp?.showToast('Word 简历文档已下载！');
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

window.resumeModule = new ResumeModule();
