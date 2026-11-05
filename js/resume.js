/**
 * OASIS | Qiuhui & Yan
 * 履历文库与 A4 简历书房模块 (Resume Bookshelf & Workshop)
 * 
 * 核心功能特性：
 * 1. 像书本/书架一样多简历体系：男主和女主可以各自创建不同的多份简历。
 * 2. 覆盖主流三大场景风格：
 *    - 💼 校园与名企招聘 (job): 强调重点实习/工程项目、STAR量化成果与技能矩阵
 *    - 🎓 申请奖学金 (scholarship): 强调专业位次、国家级/省校级竞赛荣誉、学生骨干任职与综合测评
 *    - 🔬 找导师学术升学 (advisor): 强调学术志趣、大创科研训练、实验技能与研究生学术设想
 * 3. 基于蓝本复制创建 (Blueprint Copy):
 *    - 创建新简历时，可自由选择已有简历作为蓝本，自动带入基本资料与教育经历，省去重复输入。
 * 4. 普适化、专业标准示范内容：
 *    - 杜绝过度个人隐私或偏门内容，符合高校与职场通用学术范式。
 * 5. 证件照与云端持久化防丢保障：
 *    - 支持本地上传自动高清微损压缩持久化；
 *    - 支持云端图片外链（填入任意图床/CDN链接，跨设备永不丢失）；
 *    - 支持一键导出/导入包含全部简历与照片的完整数据备份。
 */

class ResumeModule {
  constructor() {
    this.currentPerson = 'yan'; // 'yan' | 'qiuhui'
    this.viewMode = 'bookshelf'; // 'bookshelf' (书架模式) | 'editor' (编辑/预览模式)
    this.activeResumeId = null;
    this.resumeData = null;
    this.saveStatusText = '已全部自动保存';
    this.saveTimer = null;
  }

  // --- 风格元数据 ---
  getStyleMeta(style) {
    switch (style) {
      case 'job':
        return {
          key: 'job',
          name: '💼 校园/名企招聘',
          tag: '名企招聘版',
          color: '#1e3a8a',
          desc: '成果导向 · STAR工程项目经历 · 核心技能矩阵'
        };
      case 'scholarship':
        return {
          key: 'scholarship',
          name: '🎓 申请奖学金',
          tag: '奖学金申报版',
          color: '#881337',
          desc: '学业位次 · 国家级/省校级荣誉表彰 · 骨干奉献'
        };
      case 'advisor':
      default:
        return {
          key: 'advisor',
          name: '🔬 找导师学术简历',
          tag: '联系导师学术版',
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
  // 1. 简历书架视图 (Bookshelf View)
  // =========================================================================
  renderBookshelf(container) {
    const books = window.spaceStore.getResumeBooks();
    const yanList = books.yan || [];
    const qhList = books.qiuhui || [];
    const currentList = this.currentPerson === 'yan' ? yanList : qhList;

    container.innerHTML = `
      <div class="resume-wrapper">
        <!-- 顶部操作导航栏 -->
        <div class="resume-toolbar">
          <div class="toolbar-title-group">
            <h3>履历文库 · A4 简历书房</h3>
            <span class="fine">像书本一样管理与创作不同风格的求职、奖学金与联系导师简历</span>
          </div>

          <!-- 双人身份书架切换器 -->
          <div class="person-switcher">
            <button class="person-tab ${this.currentPerson === 'yan' ? 'active' : ''}" data-person="yan">
              👦 王岩的简历文集 (${yanList.length})
            </button>
            <button class="person-tab ${this.currentPerson === 'qiuhui' ? 'active' : ''}" data-person="qiuhui">
              👧 杜秋慧的简历文集 (${qhList.length})
            </button>
          </div>

          <div class="toolbar-actions">
            <button class="btn btn-primary btn-sm" id="btn-create-new-resume">
              ➕ 创建新简历 (基于蓝本)
            </button>
            <button class="btn btn-outline btn-sm" id="btn-export-all-books" title="一键导出全部简历与照片数据">
              💾 备份文集
            </button>
            <input type="file" id="input-import-books" accept=".json" style="display:none;">
            <button class="btn btn-outline btn-sm" id="btn-trigger-import-books" title="从备份文件导入恢复简历">
              📥 导入恢复
            </button>
          </div>
        </div>

        <!-- 书架统计与导读横幅 -->
        <div class="resume-shelf-banner">
          <div class="shelf-stats-info">
            <h4>📖 ${this.currentPerson === 'yan' ? '王岩' : '杜秋慧'} 的专属档案库 (共 ${currentList.length} 份简历档案)</h4>
            <p>可针对不同目标场景（名企求职、评优评奖、联系名师课题组）维护独立简历。新建时可选择已有简历为蓝本，自动填入姓名、高校、联系方式等基础资料。</p>
          </div>
          <div>
            <button class="btn btn-outline btn-sm" id="btn-quick-new-resume">
              ⚡ 快速以第一份为蓝本新建
            </button>
          </div>
        </div>

        <!-- 简历书卷卡片网格 -->
        <div class="resume-bookshelf-grid">
          ${currentList.map(resume => {
            const styleMeta = this.getStyleMeta(resume.style);
            const b = resume.basics || {};
            const hasAvatar = !!resume.avatar;

            return `
              <div class="resume-book-card style-${resume.style}" data-id="${resume.id}">
                <div class="book-spine-line"></div>
                <div>
                  <div class="book-card-header">
                    <span class="book-style-badge">
                      ${styleMeta.name}
                    </span>
                    <span class="book-date-text">更新于 ${resume.updatedAt || '近期'}</span>
                  </div>

                  <div class="book-card-title">${this.escapeHtml(resume.title)}</div>

                  <div class="book-card-target">
                    <strong>意向目标：</strong>${this.escapeHtml(b.target || '待完善目标')}
                  </div>

                  <div class="book-card-pills">
                    ${b.school ? `<span class="book-pill-tag">🏫 ${this.escapeHtml(b.school.split('·')[0].trim())}</span>` : ''}
                    ${b.major ? `<span class="book-pill-tag">📚 ${this.escapeHtml(b.major.split('/')[0].trim())}</span>` : ''}
                    ${b.degree ? `<span class="book-pill-tag">🎓 ${this.escapeHtml(b.degree)}</span>` : ''}
                    ${hasAvatar ? `<span class="book-pill-tag" style="color:#1b7659; background:#eaf6f1;">📷 已附证件照</span>` : ''}
                  </div>
                </div>

                <div class="book-card-footer">
                  <div style="display:flex; gap:6px;">
                    <button class="btn btn-primary btn-xs btn-open-resume" data-id="${resume.id}">
                      📖 打开编辑/预览
                    </button>
                    <button class="btn btn-outline btn-xs btn-copy-blueprint" data-id="${resume.id}" title="以此简历为蓝本复制新建">
                      📑 以此为蓝本
                    </button>
                  </div>
                  <div>
                    <button class="btn btn-outline btn-xs btn-del-resume" data-id="${resume.id}" title="从书架移除" style="color:#b05252; border-color:#fad5d5;">
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;

    this.bindBookshelfEvents(container);
  }

  bindBookshelfEvents(container) {
    // 身份切换
    container.querySelectorAll('.person-tab').forEach(btn => {
      btn.addEventListener('click', () => {
        this.currentPerson = btn.dataset.person;
        this.render(container);
      });
    });

    // 打开编辑/预览
    container.querySelectorAll('.btn-open-resume').forEach(btn => {
      btn.addEventListener('click', () => {
        this.activeResumeId = btn.dataset.id;
        this.viewMode = 'editor';
        this.render(container);
      });
    });

    // 以某简历为蓝本新建
    container.querySelectorAll('.btn-copy-blueprint').forEach(btn => {
      btn.addEventListener('click', () => {
        this.openBlueprintModal(btn.dataset.id);
      });
    });

    // 顶部创建新简历
    container.querySelector('#btn-create-new-resume')?.addEventListener('click', () => {
      this.openBlueprintModal();
    });

    // 快速以当前第一份为蓝本新建
    container.querySelector('#btn-quick-new-resume')?.addEventListener('click', () => {
      const books = window.spaceStore.getResumeBooks();
      const list = books[this.currentPerson] || [];
      this.openBlueprintModal(list[0]?.id || null);
    });

    // 删除简历
    container.querySelectorAll('.btn-del-resume').forEach(btn => {
      btn.addEventListener('click', () => {
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

    // 备份文集
    container.querySelector('#btn-export-all-books')?.addEventListener('click', () => {
      const books = window.spaceStore.getResumeBooks();
      const dataStr = JSON.stringify({
        oasis_resume_books_backup: true,
        version: '20261105_v6',
        exportAt: new Date().toISOString(),
        books: books
      }, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `OASIS_Resume_Library_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      window.spaceApp?.showToast('文集数据与照片已全部导出备份！');
    });

    // 导入恢复
    const fileInput = container.querySelector('#input-import-books');
    container.querySelector('#btn-trigger-import-books')?.addEventListener('click', () => {
      fileInput?.click();
    });

    fileInput?.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const parsed = JSON.parse(ev.target.result);
          const incomingBooks = parsed.books || parsed;
          if (incomingBooks && (incomingBooks.yan || incomingBooks.qiuhui)) {
            window.spaceStore.saveResumeBooks(incomingBooks);
            window.spaceApp?.showToast('简历文集恢复成功！');
            this.render(container);
          } else {
            window.spaceApp?.showToast('导入文件格式不符，请选择正确的文集备份文件。', true);
          }
        } catch (err) {
          window.spaceApp?.showToast('解析文件失败，文件可能已损坏。', true);
        }
      };
      reader.readAsText(file);
    });
  }

  // =========================================================================
  // 2. 蓝本创建弹窗 (Blueprint Creation Modal)
  // =========================================================================
  openBlueprintModal(blueprintId = null) {
    const books = window.spaceStore.getResumeBooks();
    const allResumes = [];
    (books.yan || []).forEach(r => allResumes.push({ ...r, ownerName: '王岩' }));
    (books.qiuhui || []).forEach(r => allResumes.push({ ...r, ownerName: '杜秋慧' }));

    const selectedBlueprint = allResumes.find(r => r.id === blueprintId) || null;
    const defaultOwner = selectedBlueprint ? selectedBlueprint.owner : this.currentPerson;
    const defaultTitle = selectedBlueprint ? `${selectedBlueprint.title} (新版)` : '2026 个人发展与求职简历';

    const modalHtml = `
      <div class="overlay" id="blueprint-modal">
        <div class="sheet blueprint-modal-box">
          <div class="sheet-head">
            <h3>➕ 创作新简历 (基于蓝本)</h3>
            <button class="logout" id="blueprint-modal-close" style="font-size:18px;">✕</button>
          </div>

          <form id="blueprint-form" class="login-form">
            <div class="blueprint-tip-banner">
              <strong>💡 蓝本复用优势：</strong> 选择已有简历作为蓝本后，系统将自动把其姓名、出生年月、高校教育经历、联系方式及证件照提前预填入新简历中，免去繁琐的重复录入！
            </div>

            <div>
              <label class="form-label">简历归属主人 *</label>
              <select name="owner" class="select" id="blueprint-owner-select" required>
                <option value="yan" ${defaultOwner === 'yan' ? 'selected' : ''}>👦 王岩 (Yan)</option>
                <option value="qiuhui" ${defaultOwner === 'qiuhui' ? 'selected' : ''}>👧 杜秋慧 (Qiuhui)</option>
              </select>
            </div>

            <div>
              <label class="form-label">简历名称 / 卷宗标题 *</label>
              <input type="text" name="title" class="input" value="${this.escapeHtml(defaultTitle)}" placeholder="例如：2026春招大厂技术岗、北大口腔找导师学术简历" required>
            </div>

            <div class="form-row">
              <div>
                <label class="form-label">风格场景预设 *</label>
                <select name="style" class="select" id="blueprint-style-select" required>
                  <option value="job" ${selectedBlueprint?.style === 'job' ? 'selected' : ''}>💼 校园/名企求职简历</option>
                  <option value="scholarship" ${selectedBlueprint?.style === 'scholarship' ? 'selected' : ''}>🎓 申请奖学金/评优申报</option>
                  <option value="advisor" ${(selectedBlueprint?.style === 'advisor' || !selectedBlueprint) ? 'selected' : ''}>🔬 找导师学术联系简历</option>
                </select>
              </div>

              <div>
                <label class="form-label">选择蓝本 (自动提取基础信息) *</label>
                <select name="blueprintId" class="select" id="blueprint-source-select">
                  <option value="blank">📄 从头创建 (使用普适空白标准模板)</option>
                  ${allResumes.map(r => `
                    <option value="${r.id}" ${r.id === blueprintId ? 'selected' : ''}>
                      📑 [${r.ownerName}] ${this.escapeHtml(r.title)}
                    </option>
                  `).join('')}
                </select>
              </div>
            </div>

            <div style="display:flex; justify-content:flex-end; gap:10px; margin-top:16px;">
              <button type="button" class="btn btn-outline" id="blueprint-modal-cancel">取消</button>
              <button type="submit" class="btn btn-primary">立即创建并进入编辑</button>
            </div>
          </form>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);
    const modalEl = document.getElementById('blueprint-modal');
    const close = () => modalEl && modalEl.remove();

    modalEl.querySelector('#blueprint-modal-close')?.addEventListener('click', close);
    modalEl.querySelector('#blueprint-modal-cancel')?.addEventListener('click', close);

    modalEl.querySelector('#blueprint-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const targetOwner = fd.get('owner');
      const title = fd.get('title').trim();
      const style = fd.get('style');
      const bId = fd.get('blueprintId');

      let newResume = null;
      const defaults = window.spaceStore.getDefaultResumeBooks();
      const baseTemplates = defaults[targetOwner] || defaults.yan;
      const matchedStyleTemplate = baseTemplates.find(t => t.style === style) || baseTemplates[0];

      // 深拷贝基础模板
      newResume = JSON.parse(JSON.stringify(matchedStyleTemplate));
      newResume.id = 'res_' + targetOwner + '_' + Date.now();
      newResume.owner = targetOwner;
      newResume.title = title;
      newResume.style = style;
      newResume.updatedAt = new Date().toISOString().split('T')[0];

      // 若指定了蓝本简历，则克隆蓝本的个人资料与教育经历
      if (bId && bId !== 'blank') {
        const blueprint = allResumes.find(r => r.id === bId);
        if (blueprint) {
          if (blueprint.basics) {
            newResume.basics = { ...newResume.basics, ...JSON.parse(JSON.stringify(blueprint.basics)) };
          }
          if (blueprint.avatar) {
            newResume.avatar = blueprint.avatar;
          }
          if (Array.isArray(blueprint.education) && blueprint.education.length > 0) {
            newResume.education = JSON.parse(JSON.stringify(blueprint.education));
          }
          // 若风格相同，连同重点项目与荣誉也一并继承
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
      window.spaceApp?.showToast(`已成功创建新简历【${title}】并进入工作台！`);
    });
  }

  // =========================================================================
  // 3. 双栏工作台视图 (Editor & A4 Paper Preview)
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
        <!-- 顶部工作台导航条 -->
        <div class="resume-toolbar">
          <div style="display:flex; align-items:center; gap:10px;">
            <button class="btn btn-outline btn-sm" id="btn-back-to-shelf">
              ← 返回简历书架
            </button>
            <div>
              <h3 style="display:inline-flex; align-items:center; gap:6px;">
                <span>${this.escapeHtml(d.title)}</span>
                <span class="book-style-badge" style="font-size:10px;">${styleMeta.name}</span>
              </h3>
            </div>
          </div>

          <!-- 风格即时切换 -->
          <div style="display:inline-flex; align-items:center; gap:6px;">
            <span class="fine">风格场景:</span>
            <select id="select-editor-style" class="select" style="height:32px; font-size:11.5px; padding:2px 8px;">
              <option value="job" ${d.style === 'job' ? 'selected' : ''}>💼 校园/名企求职</option>
              <option value="scholarship" ${d.style === 'scholarship' ? 'selected' : ''}>🎓 申请奖学金申报</option>
              <option value="advisor" ${d.style === 'advisor' ? 'selected' : ''}>🔬 找导师学术自述</option>
            </select>
          </div>

          <div class="toolbar-actions">
            <span class="fine save-indicator" id="resume-save-indicator">${this.saveStatusText}</span>
            <button class="btn btn-primary btn-sm" id="btn-save-manual">
              💾 保存
            </button>
            <button class="btn btn-outline btn-sm" id="btn-clone-current-blueprint" title="以当前内容为新蓝本存入书架">
              📑 另存为蓝本
            </button>
            <button class="btn btn-outline btn-sm" id="btn-export-word">
              📄 导出 Word
            </button>
            <button class="btn btn-outline btn-sm" id="btn-export-pdf" title="调用浏览器高清矢量打印 A4 PDF">
              🖨️ 打印 / 存为 PDF
            </button>
          </div>
        </div>

        <!-- 双栏工作台 -->
        <div class="resume-workspace">
          <!-- 左侧：表单配置面板 -->
          <div class="resume-editor-panel">
            <div class="resume-form-flow">

              <!-- 证件照与云端持久化管理卡片 -->
              <div class="form-section-card">
                <div class="section-header-row">
                  <div class="section-title">📷 证件照与永久云端加载</div>
                  ${hasAvatar ? `<button class="btn-text-del" id="btn-remove-avatar">移除照片</button>` : ''}
                </div>
                <div class="avatar-manager-card">
                  <div class="avatar-preview-box">
                    ${hasAvatar ? `<img src="${d.avatar}" class="avatar-real-img" alt="avatar" />` : `<div class="avatar-placeholder-box">👤</div>`}
                  </div>
                  <div class="avatar-controls">
                    <div>
                      <input type="file" id="input-avatar-file" accept="image/*" style="display:none;">
                      <button type="button" class="btn btn-outline btn-xs" id="btn-trigger-upload-avatar">
                        📷 上传本地证件照 (自动高清微损压缩)
                      </button>
                    </div>
                    <div>
                      <div class="fine" style="margin-bottom:3px;">或填入任意云端/免费图床图片链接 (换设备永不丢失)：</div>
                      <div class="avatar-url-input-wrap">
                        <input type="url" id="input-avatar-url" class="input" placeholder="https://... (支持微信/GitHub/ImgBB等公开图片)" value="${hasAvatar && d.avatar.startsWith('http') ? d.avatar : ''}">
                        <button type="button" class="btn btn-outline btn-xs" id="btn-apply-avatar-url">应用</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 基本信息 -->
              <div class="form-section-card">
                <div class="section-title">👤 基本信息 (普适通用规范)</div>
                <div class="form-row" style="margin-top:8px;">
                  <div>
                    <label class="form-label">姓名 *</label>
                    <input type="text" class="input resume-sync" data-path="basics.name" value="${this.escapeHtml(b.name || '')}">
                  </div>
                  <div>
                    <label class="form-label">性别 / 出生年月</label>
                    <div style="display:flex; gap:6px;">
                      <input type="text" class="input resume-sync" data-path="basics.gender" placeholder="男/女" value="${this.escapeHtml(b.gender || '')}" style="width:60px;">
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
                    <label class="form-label">毕业/在读高校</label>
                    <input type="text" class="input resume-sync" data-path="basics.school" value="${this.escapeHtml(b.school || '')}">
                  </div>
                  <div>
                    <label class="form-label">主修专业与学历层次</label>
                    <input type="text" class="input resume-sync" data-path="basics.major" placeholder="专业名 / 学士/硕士" value="${this.escapeHtml(b.major || '')}">
                  </div>
                </div>

                <div style="margin-top:8px;">
                  <label class="form-label">意向岗位 / 奖学金级别 / 意向研究方向导师 *</label>
                  <input type="text" class="input resume-sync" data-path="basics.target" value="${this.escapeHtml(b.target || '')}">
                </div>

                <div class="form-row" style="margin-top:8px;">
                  <div>
                    <label class="form-label">政治面貌</label>
                    <input type="text" class="input resume-sync" data-path="basics.politicalStatus" placeholder="中共党员/共青团员" value="${this.escapeHtml(b.politicalStatus || '')}">
                  </div>
                  <div>
                    <label class="form-label">学业绩点 / 排名</label>
                    <input type="text" class="input resume-sync" data-path="basics.gpaRank" placeholder="如 GPA 3.85 / 前5%" value="${this.escapeHtml(b.gpaRank || '')}">
                  </div>
                  <div>
                    <label class="form-label">外语水平</label>
                    <input type="text" class="input resume-sync" data-path="basics.englishLevel" placeholder="如 CET-6 560+" value="${this.escapeHtml(b.englishLevel || '')}">
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
                        <input type="text" class="input sm edu-sync" data-field="degree" data-idx="${idx}" placeholder="学位学历 (如学士/硕士)" value="${this.escapeHtml(edu.degree || '')}">
                        <input type="text" class="input sm edu-sync" data-field="period" data-idx="${idx}" placeholder="时间起止 (如 2022.09 - 2026.06)" value="${this.escapeHtml(edu.period || '')}">
                      </div>
                      <div style="margin-top:6px;">
                        <input type="text" class="input sm edu-sync" data-field="desc" data-idx="${idx}" placeholder="核心课程/荣誉说明" value="${this.escapeHtml(edu.desc || '')}">
                      </div>
                    </div>
                  `).join('')}
                </div>
              </div>

              <!-- 重点经历 (实习/规培/工程/工作) -->
              <div class="form-section-card">
                <div class="section-header-row">
                  <div class="section-title">💼 重点实践与工作经历</div>
                  <button type="button" class="btn btn-outline btn-xs" id="btn-add-exp">➕ 添加经历</button>
                </div>
                <div id="exp-list-wrap">
                  ${(d.experiences || []).map((exp, idx) => `
                    <div class="sub-form-item" data-idx="${idx}">
                      <div class="sub-item-header">
                        <span style="font-weight:700; font-size:12px;">实践/实习经历 #${idx + 1}</span>
                        <button type="button" class="btn-text-del btn-del-exp" data-idx="${idx}">删除</button>
                      </div>
                      <div class="form-row">
                        <input type="text" class="input sm exp-sync" data-field="org" data-idx="${idx}" placeholder="单位/机构/医院名称" value="${this.escapeHtml(exp.org || '')}">
                        <input type="text" class="input sm exp-sync" data-field="role" data-idx="${idx}" placeholder="岗位/职责角色" value="${this.escapeHtml(exp.role || '')}">
                      </div>
                      <div style="margin-top:6px;">
                        <input type="text" class="input sm exp-sync" data-field="period" data-idx="${idx}" placeholder="起止时间 (如 2024.03 - 2025.01)" value="${this.escapeHtml(exp.period || '')}">
                      </div>
                      <div style="margin-top:6px;">
                        <textarea class="textarea sm exp-sync-bullets" data-idx="${idx}" rows="3" placeholder="工作内容与量化成果 (每行一项，支持STAR法则描述)">${(exp.bullets || []).join('\n')}</textarea>
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
                        <input type="text" class="input sm proj-sync" data-field="name" data-idx="${idx}" placeholder="课题或项目名称" value="${this.escapeHtml(p.name || '')}">
                        <input type="text" class="input sm proj-sync" data-field="role" data-idx="${idx}" placeholder="承担角色 (如课题负责人/核心成员)" value="${this.escapeHtml(p.role || '')}">
                      </div>
                      <div class="form-row" style="margin-top:6px;">
                        <input type="text" class="input sm proj-sync" data-field="period" data-idx="${idx}" placeholder="起止时间" value="${this.escapeHtml(p.period || '')}">
                        <input type="text" class="input sm proj-sync" data-field="keywords" data-idx="${idx}" placeholder="关键词 (如 PCR, C++, ROS)" value="${this.escapeHtml(p.keywords || '')}">
                      </div>
                      <div style="margin-top:6px;">
                        <textarea class="textarea sm proj-sync-bullets" data-idx="${idx}" rows="2" placeholder="工作重点与研究成果 (每行一项)">${(p.bullets || []).join('\n')}</textarea>
                      </div>
                    </div>
                  `).join('')}
                </div>
              </div>

              <!-- 荣誉奖项与学术论文 -->
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

              <!-- 专业技能与自我评价 -->
              <div class="form-section-card">
                <div class="section-title">⚡ 技能矩阵与综合评价</div>
                <div style="margin-top:8px;">
                  <label class="form-label">专业技能清单 (每行一项)</label>
                  <textarea class="textarea sm" id="input-skills-matrix" rows="3" placeholder="例如：\n临床技能: 严格遵循无菌原则，掌握规范缝合与印模制取\n编程语言: 熟练掌握 C/C++、Python、Linux Shell">${(d.skills || []).join('\n')}</textarea>
                </div>
                <div style="margin-top:8px;">
                  <label class="form-label">综合自我评价 / 导师攻读设想</label>
                  <textarea class="textarea sm resume-sync" data-path="selfEvaluation" rows="4" placeholder="总结个人优势、学术志向或职业规划">${this.escapeHtml(d.selfEvaluation || '')}</textarea>
                </div>
              </div>

            </div>
          </div>

          <!-- 右侧：真实 1:1 比例 A4 纸张预览 (A4 Page Sheet) -->
          <div class="resume-preview-panel">
            <div class="a4-page-sheet style-${d.style}" id="a4-print-target">
              ${this.renderA4SheetHtml()}
            </div>
          </div>
        </div>
      </div>
    `;

    this.bindEditorEvents(container);
  }

  // =========================================================================
  // 4. A4 纸张 HTML 排版引擎 (按三种风格精细化呈现)
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
      b.nativePlace && `📍 ${b.nativePlace}`,
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
                ${exp.bullets.map(b => `<li>${this.escapeHtml(b)}</li>`).join('')}
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
                ${p.bullets.map(b => `<li>${this.escapeHtml(b)}</li>`).join('')}
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

      <!-- 学术论文与成果 (若有) -->
      ${(d.publications && d.publications.length > 0) ? `
        <div class="rp-section-title">
          <span>📑 学术成果与学术论文</span>
        </div>
        <ul class="rp-bullets" style="margin-bottom:6pt;">
          ${d.publications.map(pub => `
            <li>
              <strong>${this.escapeHtml(pub.authors || '')}</strong>: 《${this.escapeHtml(pub.title || '')}》, <em>${this.escapeHtml(pub.journal || '')}</em> (${this.escapeHtml(pub.year || '')}) - [${this.escapeHtml(pub.status || '已发表')}]
            </li>
          `).join('')}
        </ul>
      ` : ''}

      <!-- 技能矩阵与专业素养 -->
      ${(d.skills && d.skills.length > 0) ? `
        <div class="rp-section-title">
          <span>⚡ 专业技能与综合素养</span>
        </div>
        <ul class="rp-bullets" style="margin-bottom:6pt;">
          ${d.skills.map(s => `<li>${this.escapeHtml(s)}</li>`).join('')}
        </ul>
      ` : ''}

      <!-- 自我评价 / 导师攻读设想 -->
      ${d.selfEvaluation ? `
        <div class="rp-section-title">
          <span>📝 综合陈述与发展规划</span>
        </div>
        <div class="rp-desc-text" style="font-size:8.5pt; line-height:1.6; color:#374151;">
          ${this.escapeHtml(d.selfEvaluation)}
        </div>
      ` : ''}
    `;
  }

  // =========================================================================
  // 5. 工作台事件绑定 (双向同步、证件照管理、Word导出、打印)
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

    // 手动保存
    container.querySelector('#btn-save-manual')?.addEventListener('click', () => {
      this.saveCurrent();
      window.spaceApp?.showToast('简历已成功保存！');
    });

    // 另存为新蓝本
    container.querySelector('#btn-clone-current-blueprint')?.addEventListener('click', () => {
      const cloned = JSON.parse(JSON.stringify(this.resumeData));
      cloned.id = 'res_' + this.currentPerson + '_' + Date.now();
      cloned.title = `${this.resumeData.title} (蓝本副本)`;
      window.spaceStore.createResumeBook(this.currentPerson, cloned);
      window.spaceApp?.showToast(`已成功将当前简历另存为新蓝本【${cloned.title}】！`);
    });

    // 导出 Word
    container.querySelector('#btn-export-word')?.addEventListener('click', () => {
      this.exportWord();
    });

    // 打印 PDF
    container.querySelector('#btn-export-pdf')?.addEventListener('click', () => {
      window.print();
    });

    // 本地证件照上传
    const avatarFileInput = container.querySelector('#input-avatar-file');
    container.querySelector('#btn-trigger-upload-avatar')?.addEventListener('click', () => {
      avatarFileInput?.click();
    });

    avatarFileInput?.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        const base64 = await this.compressAvatar(file);
        this.resumeData.avatar = base64;
        this.saveCurrent();
        this.render(container);
        window.spaceApp?.showToast('本地证件照已压缩并安全保存！');
      } catch (err) {
        window.spaceApp?.showToast('图片处理失败，请重试。', true);
      }
    });

    // 云端外链应用
    container.querySelector('#btn-apply-avatar-url')?.addEventListener('click', () => {
      const url = container.querySelector('#input-avatar-url')?.value.trim();
      if (!url) {
        window.spaceApp?.showToast('请先输入有效的图片链接', true);
        return;
      }
      this.resumeData.avatar = url;
      this.saveCurrent();
      this.render(container);
      window.spaceApp?.showToast('云端证件照链接已应用，换设备永久加载！');
    });

    // 移除证件照
    container.querySelector('#btn-remove-avatar')?.addEventListener('click', () => {
      this.resumeData.avatar = '';
      this.saveCurrent();
      this.render(container);
      window.spaceApp?.showToast('已移除证件照');
    });

    // 双向绑定常规输入框
    container.querySelectorAll('.resume-sync').forEach(input => {
      input.addEventListener('input', (e) => {
        const path = e.target.dataset.path;
        const val = e.target.value;
        this.setObjectPath(this.resumeData, path, val);
        this.triggerAutoSave();
        this.refreshPreview();
      });
    });

    // 技能矩阵文本域
    container.querySelector('#input-skills-matrix')?.addEventListener('input', (e) => {
      const lines = e.target.value.split('\n').map(l => l.trim()).filter(Boolean);
      this.resumeData.skills = lines;
      this.triggerAutoSave();
      this.refreshPreview();
    });

    // --- 教育经历交互 ---
    container.querySelector('#btn-add-edu')?.addEventListener('click', () => {
      if (!this.resumeData.education) this.resumeData.education = [];
      this.resumeData.education.push({ school: '高校名称', major: '专业', degree: '学士/硕士', period: '2023.09 - 2026.06', desc: '' });
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

    // --- 实践经历交互 ---
    container.querySelector('#btn-add-exp')?.addEventListener('click', () => {
      if (!this.resumeData.experiences) this.resumeData.experiences = [];
      this.resumeData.experiences.push({ org: '单位/机构名称', role: '岗位角色', period: '2024.03 - 至今', bullets: ['工作成果与职责描述'] });
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

    // --- 科研项目交互 ---
    container.querySelector('#btn-add-proj')?.addEventListener('click', () => {
      if (!this.resumeData.projects) this.resumeData.projects = [];
      this.resumeData.projects.push({ name: '课题/项目全称', role: '主要负责人', period: '2024.03 - 2025.04', keywords: '', bullets: ['项目攻关内容与成果'] });
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

    // --- 荣誉奖项交互 ---
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
  }

  // 刷新预览区
  refreshPreview() {
    const previewEl = document.getElementById('a4-print-target');
    if (previewEl) {
      previewEl.className = `a4-page-sheet style-${this.resumeData.style}`;
      previewEl.innerHTML = this.renderA4SheetHtml();
    }
  }

  // 立即保存到存储
  saveCurrent() {
    if (this.resumeData && this.activeResumeId) {
      window.spaceStore.saveResumeBook(this.currentPerson, this.resumeData);
      const indicator = document.getElementById('resume-save-indicator');
      if (indicator) indicator.textContent = '已全部自动保存';
    }
  }

  // 触发防抖自动保存
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

  // 证件照规范压缩 (3:4 标准比例，~40KB 极清)
  compressAvatar(file, targetW = 300, targetH = 400) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = targetW;
          canvas.height = targetH;
          const ctx = canvas.getContext('2d');

          // 居中裁剪适应 3:4 比例
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
        };
        img.onerror = reject;
        img.src = e.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
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
    window.spaceApp?.showToast('Word 简历文档已生成下载！');
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
