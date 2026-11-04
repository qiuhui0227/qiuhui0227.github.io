/**
 * OASIS | Qiuhui & Yan
 * 双人独立简历编辑器 (支持男主/女主切换独立保存 + 证件照上传 + 实时双向渲染 + PDF/Word无损导出)
 */

class ResumeModule {
  constructor() {
    this.currentPerson = 'yan'; // 'yan' (男主) | 'qiuhui' (女主)
    this.currentViewMode = 'split';
    this.saveStatusText = '已全部自动保存';
  }

  loadData() {
    this.resumeData = window.spaceStore.getResume(this.currentPerson);
  }

  render(container) {
    if (!container) return;
    this.loadData();

    container.innerHTML = `
      <div class="resume-wrapper">
        <!-- 顶部操作工具栏 -->
        <div class="resume-toolbar">
          <div class="toolbar-title-group">
            <h3>A4 简历生成与档案库</h3>
            <span class="fine">双人独立档案 · 支持证件照上传与实时矢量排版</span>
          </div>

          <!-- 双人身份切换器 (USV Lab 分段药丸结构) -->
          <div class="person-switcher">
            <button class="person-tab ${this.currentPerson === 'yan' ? 'active' : ''}" data-person="yan">
              👦 王岩 (Yan) 的简历
            </button>
            <button class="person-tab ${this.currentPerson === 'qiuhui' ? 'active' : ''}" data-person="qiuhui">
              👧 杜秋慧 (Qiuhui) 的简历
            </button>
          </div>

          <!-- 手机端模式切换 -->
          <div class="mobile-resume-tabs" style="display:none;">
            <button class="btn btn-sm ${this.currentViewMode === 'edit' ? 'btn-primary' : 'btn-outline'}" id="btn-tab-edit">✏️ 编辑</button>
            <button class="btn btn-sm ${this.currentViewMode === 'preview' ? 'btn-primary' : 'btn-outline'}" id="btn-tab-preview">👁️ A4 预览</button>
          </div>

          <div class="toolbar-actions">
            <span class="fine save-indicator" id="resume-save-indicator">${this.saveStatusText}</span>
            <button class="btn btn-primary btn-sm" id="btn-save-manual" title="立即保存当前简历">
              💾 保存当前简历
            </button>
            <button class="btn btn-outline btn-sm" id="btn-export-word" title="导出为标准 Word 文档">
              导出 Word
            </button>
            <button class="btn btn-outline btn-sm" id="btn-export-pdf" title="浏览器高保真矢量打印 A4 PDF">
              下载 A4 PDF
            </button>
          </div>
        </div>

        <!-- 主分屏工作区 -->
        <div class="resume-workspace ${this.currentViewMode}">
          <!-- 左侧编辑面板 -->
          <div class="resume-editor-panel" id="resume-editor-pane">
            ${this.renderEditorForm()}
          </div>

          <!-- 右侧 A4 真实比例预览 -->
          <div class="resume-preview-panel" id="resume-preview-pane">
            <div class="a4-page-sheet" id="resume-a4-sheet">
              ${this.renderA4Html()}
            </div>
          </div>
        </div>
      </div>
    `;

    this.bindEvents(container);
  }

  // 渲染表单
  renderEditorForm() {
    const d = this.resumeData;
    const b = d.basics || {};
    const hasAvatar = !!d.avatar;

    return `
      <form id="resume-main-form" class="resume-form-flow">
        <!-- 1. 基本信息 + 证件照上传 -->
        <div class="form-section-card">
          <div class="section-title">
            <svg class="ico" viewBox="0 0 24 24"><path d="M20 21a8 8 0 0 0-16 0"/><circle cx="12" cy="8" r="4"/></svg>
            <span>个人基本资料与证件照</span>
          </div>

          <!-- 证件照上传操作区 -->
          <div class="avatar-uploader-row">
            <div class="avatar-preview-box" id="avatar-preview-box">
              ${hasAvatar ? `
                <img src="${d.avatar}" class="avatar-real-img" alt="avatar" />
              ` : `
                <div class="avatar-placeholder-box">
                  <svg class="ico" width="28" height="28" viewBox="0 0 24 24"><path d="M20 21a8 8 0 0 0-16 0"/><circle cx="12" cy="8" r="4"/></svg>
                  <span>未上传证件照</span>
                </div>
              `}
            </div>
            <div class="avatar-actions-wrap">
              <div style="font-weight:750; font-size:13px; color:#18354a; margin-bottom:4px;">简历标准证件照</div>
              <div class="fine" style="margin-bottom:8px;">推荐 1寸/2寸 蓝底或白底照片，前端自动完成视网膜清晰度压缩排版。</div>
              <div style="display:flex; gap:8px;">
                <label class="btn btn-outline btn-xs" style="margin:0; cursor:pointer;">
                  <input type="file" id="input-upload-avatar" accept="image/*" style="display:none;">
                  📷 ${hasAvatar ? '更换证件照' : '上传证件照'}
                </label>
                ${hasAvatar ? `
                  <button type="button" class="btn btn-danger btn-xs" id="btn-remove-avatar">移除照片</button>
                ` : ''}
              </div>
            </div>
          </div>

          <div class="form-row">
            <div class="field" style="flex:1;">
              <label>姓名</label>
              <input type="text" class="input resume-sync" data-path="basics.name" value="${this.escapeHtml(b.name || '')}">
            </div>
            <div class="field" style="flex:1;">
              <label>求职意向 / 专业岗位头衔</label>
              <input type="text" class="input resume-sync" data-path="basics.title" value="${this.escapeHtml(b.title || '')}">
            </div>
          </div>

          <div class="form-row">
            <div class="field" style="flex:1;">
              <label>电子邮箱</label>
              <input type="email" class="input resume-sync" data-path="basics.email" value="${this.escapeHtml(b.email || '')}">
            </div>
            <div class="field" style="flex:1;">
              <label>联系电话</label>
              <input type="text" class="input resume-sync" data-path="basics.phone" value="${this.escapeHtml(b.phone || '')}">
            </div>
          </div>

          <div class="form-row">
            <div class="field" style="flex:1;">
              <label>常住地址 / 所在地</label>
              <input type="text" class="input resume-sync" data-path="basics.location" value="${this.escapeHtml(b.location || '')}">
            </div>
            <div class="field" style="flex:1;">
              <label>个人网站 / 个人主页</label>
              <input type="text" class="input resume-sync" data-path="basics.website" value="${this.escapeHtml(b.website || '')}">
            </div>
          </div>

          <div class="field">
            <label>个人亮点概述</label>
            <textarea class="textarea resume-sync" rows="2" data-path="basics.summary">${this.escapeHtml(b.summary || '')}</textarea>
          </div>
        </div>

        <!-- 2. 教育背景 -->
        <div class="form-section-card">
          <div class="section-header-row">
            <div class="section-title">
              <svg class="ico" viewBox="0 0 24 24"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>
              <span>教育经历</span>
            </div>
            <button type="button" class="btn btn-outline btn-xs" id="btn-add-edu">+ 增加经历</button>
          </div>
          <div id="edu-items-wrap">
            ${(d.education || []).map((edu, idx) => `
              <div class="sub-form-item">
                <div class="sub-item-header">
                  <span>教育记录 #${idx + 1}</span>
                  <button type="button" class="btn-text-del btn-del-edu" data-index="${idx}">删除</button>
                </div>
                <div class="form-row">
                  <div class="field" style="flex:1;">
                    <input type="text" class="input sm resume-sync" placeholder="院校名称" value="${this.escapeHtml(edu.school)}" data-path="education.${idx}.school">
                  </div>
                  <div class="field" style="flex:1;">
                    <input type="text" class="input sm resume-sync" placeholder="学历 (如 硕士/本科)" value="${this.escapeHtml(edu.degree)}" data-path="education.${idx}.degree">
                  </div>
                </div>
                <div class="form-row">
                  <div class="field" style="flex:1;">
                    <input type="text" class="input sm resume-sync" placeholder="专业名称" value="${this.escapeHtml(edu.major)}" data-path="education.${idx}.major">
                  </div>
                  <div class="field" style="flex:1;">
                    <input type="text" class="input sm resume-sync" placeholder="起止时间" value="${this.escapeHtml(edu.period)}" data-path="education.${idx}.period">
                  </div>
                </div>
                <div class="field">
                  <input type="text" class="input sm resume-sync" placeholder="主修方向 / 核心科研方向" value="${this.escapeHtml(edu.description || '')}" data-path="education.${idx}.description">
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- 3. 工作经历 -->
        <div class="form-section-card">
          <div class="section-header-row">
            <div class="section-title">
              <svg class="ico" viewBox="0 0 24 24"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
              <span>工作 / 实习经历</span>
            </div>
            <button type="button" class="btn btn-outline btn-xs" id="btn-add-work">+ 增加经历</button>
          </div>
          <div id="work-items-wrap">
            ${(d.work || []).map((w, idx) => `
              <div class="sub-form-item">
                <div class="sub-item-header">
                  <span>工作记录 #${idx + 1}</span>
                  <button type="button" class="btn-text-del btn-del-work" data-index="${idx}">删除</button>
                </div>
                <div class="form-row">
                  <div class="field" style="flex:1;">
                    <input type="text" class="input sm resume-sync" placeholder="单位 / 机构名称" value="${this.escapeHtml(w.company)}" data-path="work.${idx}.company">
                  </div>
                  <div class="field" style="flex:1;">
                    <input type="text" class="input sm resume-sync" placeholder="职位名称" value="${this.escapeHtml(w.position)}" data-path="work.${idx}.position">
                  </div>
                  <div class="field" style="flex:1;">
                    <input type="text" class="input sm resume-sync" placeholder="在职时间" value="${this.escapeHtml(w.period)}" data-path="work.${idx}.period">
                  </div>
                </div>
                <div class="field">
                  <textarea class="textarea resume-sync" rows="2" placeholder="工作职责与业绩突破" data-path="work.${idx}.highlights">${this.escapeHtml(w.highlights || '')}</textarea>
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- 4. 重点项目经历 -->
        <div class="form-section-card">
          <div class="section-header-row">
            <div class="section-title">
              <svg class="ico" viewBox="0 0 24 24"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>
              <span>重点项目经历</span>
            </div>
            <button type="button" class="btn btn-outline btn-xs" id="btn-add-proj">+ 增加项目</button>
          </div>
          <div id="proj-items-wrap">
            ${(d.projects || []).map((p, idx) => `
              <div class="sub-form-item">
                <div class="sub-item-header">
                  <span>项目记录 #${idx + 1}</span>
                  <button type="button" class="btn-text-del btn-del-proj" data-index="${idx}">删除</button>
                </div>
                <div class="form-row">
                  <div class="field" style="flex:2;">
                    <input type="text" class="input sm resume-sync" placeholder="项目全称" value="${this.escapeHtml(p.name)}" data-path="projects.${idx}.name">
                  </div>
                  <div class="field" style="flex:1;">
                    <input type="text" class="input sm resume-sync" placeholder="角色" value="${this.escapeHtml(p.role)}" data-path="projects.${idx}.role">
                  </div>
                  <div class="field" style="flex:1;">
                    <input type="text" class="input sm resume-sync" placeholder="起止时间" value="${this.escapeHtml(p.period)}" data-path="projects.${idx}.period">
                  </div>
                </div>
                <div class="field">
                  <textarea class="textarea resume-sync" rows="2" placeholder="技术架构与交付成果" data-path="projects.${idx}.description">${this.escapeHtml(p.description || '')}</textarea>
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- 5. 技能清单 -->
        <div class="form-section-card">
          <div class="section-title">
            <svg class="ico" viewBox="0 0 24 24"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
            <span>技能矩阵与工程素养</span>
          </div>
          <div class="fine" style="margin-bottom:6px;">每行输入一条技能，排版更具结构美。</div>
          <textarea class="textarea" rows="4" id="resume-skills-input">${(d.skills || []).join('\n')}</textarea>
        </div>
      </form>
    `;
  }

  // 渲染右侧 A4 真实比例预览
  renderA4Html() {
    const d = this.resumeData;
    const b = d.basics || {};
    const hasAvatar = !!d.avatar;

    return `
      <div class="resume-paper" id="resume-print-content">
        <!-- 头部 Header (支持证件照右上角排布) -->
        <header class="rp-header ${hasAvatar ? 'has-avatar' : ''}">
          <div class="rp-header-main">
            <h1 class="rp-name">${this.escapeHtml(b.name || '姓名')}</h1>
            <div class="rp-title">${this.escapeHtml(b.title || '专业工程师 / 岗位头衔')}</div>
            
            <div class="rp-contact-bar">
              ${b.phone ? `<span>📞 ${this.escapeHtml(b.phone)}</span>` : ''}
              ${b.email ? `<span>✉️ ${this.escapeHtml(b.email)}</span>` : ''}
              ${b.location ? `<span>📍 ${this.escapeHtml(b.location)}</span>` : ''}
              ${b.website ? `<span>🌐 ${this.escapeHtml(b.website.replace(/^https?:\/\//, ''))}</span>` : ''}
            </div>

            ${b.summary ? `
              <div class="rp-summary">${this.escapeHtml(b.summary)}</div>
            ` : ''}
          </div>

          ${hasAvatar ? `
            <div class="rp-avatar-box">
              <img src="${d.avatar}" alt="证件照" class="rp-avatar-img">
            </div>
          ` : ''}
        </header>

        <!-- 1. 教育经历 -->
        ${(d.education && d.education.length > 0) ? `
          <section class="rp-section">
            <h2 class="rp-section-title">教育背景</h2>
            <div class="rp-section-content">
              ${d.education.map(e => `
                <div class="rp-item">
                  <div class="rp-item-row">
                    <span class="rp-item-bold">${this.escapeHtml(e.school)}</span>
                    <span class="rp-item-mid">${this.escapeHtml(e.degree)} · ${this.escapeHtml(e.major)}</span>
                    <span class="rp-item-date">${this.escapeHtml(e.period)}</span>
                  </div>
                  ${e.description ? `<div class="rp-item-sub">${this.escapeHtml(e.description)}</div>` : ''}
                </div>
              `).join('')}
            </div>
          </section>
        ` : ''}

        <!-- 2. 工作经历 -->
        ${(d.work && d.work.length > 0) ? `
          <section class="rp-section">
            <h2 class="rp-section-title">工作与实习经历</h2>
            <div class="rp-section-content">
              ${d.work.map(w => `
                <div class="rp-item">
                  <div class="rp-item-row">
                    <span class="rp-item-bold">${this.escapeHtml(w.company)}</span>
                    <span class="rp-item-mid">${this.escapeHtml(w.position)}</span>
                    <span class="rp-item-date">${this.escapeHtml(w.period)}</span>
                  </div>
                  ${w.highlights ? `<div class="rp-item-desc">${this.escapeHtml(w.highlights)}</div>` : ''}
                </div>
              `).join('')}
            </div>
          </section>
        ` : ''}

        <!-- 3. 重点项目 -->
        ${(d.projects && d.projects.length > 0) ? `
          <section class="rp-section">
            <h2 class="rp-section-title">重点项目经历</h2>
            <div class="rp-section-content">
              ${d.projects.map(p => `
                <div class="rp-item">
                  <div class="rp-item-row">
                    <span class="rp-item-bold">${this.escapeHtml(p.name)}</span>
                    <span class="rp-item-mid">${this.escapeHtml(p.role)}</span>
                    <span class="rp-item-date">${this.escapeHtml(p.period)}</span>
                  </div>
                  ${p.description ? `<div class="rp-item-desc">${this.escapeHtml(p.description)}</div>` : ''}
                </div>
              `).join('')}
            </div>
          </section>
        ` : ''}

        <!-- 4. 专业技能 -->
        ${(d.skills && d.skills.length > 0) ? `
          <section class="rp-section">
            <h2 class="rp-section-title">技能矩阵与工程素养</h2>
            <div class="rp-section-content">
              <ul class="rp-skills-list">
                ${d.skills.map(s => `<li>${this.escapeHtml(s)}</li>`).join('')}
              </ul>
            </div>
          </section>
        ` : ''}
      </div>
    `;
  }

  bindEvents(container) {
    // 切换男主/女主简历
    container.querySelectorAll('.person-tab').forEach(btn => {
      btn.addEventListener('click', () => {
        this.saveCurrentData();
        this.currentPerson = btn.dataset.person;
        this.saveStatusText = `已切换至 ${this.currentPerson === 'yan' ? '王岩' : '秋慧'} 的简历`;
        this.render(container);
      });
    });

    // 监听所有输入自动同步并持久化
    container.querySelectorAll('.resume-sync').forEach(input => {
      input.addEventListener('input', (e) => {
        this.updateDataByPath(e.target.dataset.path, e.target.value);
        this.refreshPreview(container);
        this.triggerAutoSave();
      });
    });

    // 技能文本框
    const skillsInput = container.querySelector('#resume-skills-input');
    skillsInput?.addEventListener('input', (e) => {
      this.resumeData.skills = e.target.value.split('\n').filter(s => s.trim().length > 0);
      this.refreshPreview(container);
      this.triggerAutoSave();
    });

    // 上传证件照
    const avatarInput = container.querySelector('#input-upload-avatar');
    avatarInput?.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const compressed = await this.compressAvatar(file);
      this.resumeData.avatar = compressed.dataUrl;
      this.saveCurrentData();
      window.spaceApp?.showToast('证件照已上传并同步保存！');
      this.render(container);
    });

    // 移除证件照
    container.querySelector('#btn-remove-avatar')?.addEventListener('click', () => {
      this.resumeData.avatar = '';
      this.saveCurrentData();
      window.spaceApp?.showToast('已移除证件照');
      this.render(container);
    });

    // 手动点击保存按钮
    container.querySelector('#btn-save-manual')?.addEventListener('click', () => {
      this.saveCurrentData();
      const personName = this.currentPerson === 'yan' ? '王岩' : '秋慧';
      window.spaceApp?.showToast(`已成功保存【${personName}】的简历！`);
    });

    // 增删项目
    container.querySelector('#btn-add-edu')?.addEventListener('click', () => {
      if (!this.resumeData.education) this.resumeData.education = [];
      this.resumeData.education.push({ school: '院校名称', degree: '工学硕士', major: '主修专业', period: '2023.09 - 2026.06', description: '' });
      this.saveCurrentData();
      this.render(container);
    });
    container.querySelectorAll('.btn-del-edu').forEach(btn => {
      btn.addEventListener('click', () => {
        this.resumeData.education.splice(parseInt(btn.dataset.index, 10), 1);
        this.saveCurrentData();
        this.render(container);
      });
    });

    container.querySelector('#btn-add-work')?.addEventListener('click', () => {
      if (!this.resumeData.work) this.resumeData.work = [];
      this.resumeData.work.push({ company: '单位 / 实验室', position: '职位头衔', period: '2024.01 - 至今', highlights: '' });
      this.saveCurrentData();
      this.render(container);
    });
    container.querySelectorAll('.btn-del-work').forEach(btn => {
      btn.addEventListener('click', () => {
        this.resumeData.work.splice(parseInt(btn.dataset.index, 10), 1);
        this.saveCurrentData();
        this.render(container);
      });
    });

    container.querySelector('#btn-add-proj')?.addEventListener('click', () => {
      if (!this.resumeData.projects) this.resumeData.projects = [];
      this.resumeData.projects.push({ name: '项目全称', role: '研发主创', period: '2025.01 - 2025.06', description: '' });
      this.saveCurrentData();
      this.render(container);
    });
    container.querySelectorAll('.btn-del-proj').forEach(btn => {
      btn.addEventListener('click', () => {
        this.resumeData.projects.splice(parseInt(btn.dataset.index, 10), 1);
        this.saveCurrentData();
        this.render(container);
      });
    });

    // 导出 PDF
    container.querySelector('#btn-export-pdf')?.addEventListener('click', () => {
      window.print();
    });

    // 导出 Word
    container.querySelector('#btn-export-word')?.addEventListener('click', () => {
      this.exportWord();
    });

    // 手机端 Tab 切换
    const btnTabEdit = container.querySelector('#btn-tab-edit');
    const btnTabPrev = container.querySelector('#btn-tab-preview');
    if (btnTabEdit && btnTabPrev) {
      btnTabEdit.addEventListener('click', () => {
        this.currentViewMode = 'edit';
        this.render(container);
      });
      btnTabPrev.addEventListener('click', () => {
        this.currentViewMode = 'preview';
        this.render(container);
      });
    }
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

          // 居中裁剪适应
          const imgRatio = img.width / img.height;
          const targetRatio = targetW / targetH;
          let renderW, renderH, offsetX, offsetY;

          if (imgRatio > targetRatio) {
            renderH = targetH;
            renderW = targetH * imgRatio;
            offsetX = -(renderW - targetW) / 2;
            offsetY = 0;
          } else {
            renderW = targetW;
            renderH = targetW / imgRatio;
            offsetX = 0;
            offsetY = -(renderH - targetH) / 2;
          }

          ctx.drawImage(img, offsetX, offsetY, renderW, renderH);
          let dataUrl = canvas.toDataURL('image/webp', 0.88);
          if (!dataUrl.startsWith('data:image/webp')) {
            dataUrl = canvas.toDataURL('image/jpeg', 0.88);
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

  updateDataByPath(path, value) {
    if (!path) return;
    const parts = path.split('.');
    let cur = this.resumeData;
    for (let i = 0; i < parts.length - 1; i++) {
      if (!cur[parts[i]]) cur[parts[i]] = {};
      cur = cur[parts[i]];
    }
    cur[parts[parts.length - 1]] = value;
  }

  triggerAutoSave() {
    clearTimeout(this.autoSaveTimer);
    this.autoSaveTimer = setTimeout(() => {
      this.saveCurrentData();
      const indicator = document.getElementById('resume-save-indicator');
      if (indicator) {
        const timeStr = new Date().toTimeString().split(' ')[0];
        indicator.innerText = `已自动保存 (${timeStr})`;
      }
    }, 400);
  }

  saveCurrentData() {
    window.spaceStore.saveResume(this.currentPerson, this.resumeData);
  }

  refreshPreview(container) {
    const sheet = container.querySelector('#resume-a4-sheet');
    if (sheet) sheet.innerHTML = this.renderA4Html();
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
        <title>${b.name || '个人简历'}</title>
        <style>
          body { font-family: 'Microsoft YaHei', SimSun, sans-serif; font-size: 10.5pt; line-height: 1.5; color: #1b3442; }
          .header-table { width: 100%; border: none; margin-bottom: 12pt; border-bottom: 2pt solid #18354a; padding-bottom: 8pt; }
          .header-main { vertical-align: top; }
          .header-avatar { width: 90pt; text-align: right; vertical-align: top; }
          .avatar-img { width: 80pt; height: 106pt; border: 1pt solid #dce5e9; border-radius: 4pt; }
          h1 { font-size: 20pt; margin: 0 0 4pt 0; color: #15354a; }
          .title { font-size: 11pt; color: #1b7659; font-weight: bold; margin-bottom: 6pt; }
          .contact { font-size: 9pt; color: #557180; line-height: 1.6; }
          .summary { font-size: 9pt; color: #344c59; margin-top: 6pt; background: #f4f7f8; padding: 6pt; }
          .section-title { font-size: 11.5pt; font-weight: bold; color: #18354a; border-bottom: 1pt solid #dce5e9; padding-bottom: 3pt; margin-top: 14pt; margin-bottom: 6pt; }
          .bold { font-weight: bold; color: #15354a; }
          .date { color: #718894; float: right; }
          .desc { font-size: 9.5pt; color: #47616f; margin-top: 2pt; margin-bottom: 6pt; }
          ul { margin: 2pt 0 6pt 18pt; padding: 0; }
          li { font-size: 9.5pt; color: #374151; margin-bottom: 2pt; }
        </style>
      </head>
      <body>
        <table class="header-table">
          <tr>
            <td class="header-main">
              <h1>${b.name || '个人简历'}</h1>
              <div class="title">${b.title || ''}</div>
              <div class="contact">
                ${[b.phone, b.email, b.location, b.website].filter(Boolean).join(' | ')}
              </div>
              ${b.summary ? `<div class="summary"><strong>个人概述：</strong>${b.summary}</div>` : ''}
            </td>
            ${hasAvatar ? `
              <td class="header-avatar">
                <img src="${d.avatar}" class="avatar-img" alt="avatar" />
              </td>
            ` : ''}
          </tr>
        </table>

        <!-- 教育经历 -->
        ${(d.education && d.education.length > 0) ? `
          <div class="section-title">教育背景</div>
          ${d.education.map(e => `
            <div>
              <span class="bold">${e.school}</span> | ${e.degree} · ${e.major}
              <span class="date">${e.period}</span>
              ${e.description ? `<div class="desc">${e.description}</div>` : ''}
            </div>
          `).join('')}
        ` : ''}

        <!-- 工作经历 -->
        ${(d.work && d.work.length > 0) ? `
          <div class="section-title">工作与实习经历</div>
          ${d.work.map(w => `
            <div>
              <span class="bold">${w.company}</span> | ${w.position}
              <span class="date">${w.period}</span>
              ${w.highlights ? `<div class="desc">${w.highlights}</div>` : ''}
            </div>
          `).join('')}
        ` : ''}

        <!-- 重点项目 -->
        ${(d.projects && d.projects.length > 0) ? `
          <div class="section-title">重点项目经历</div>
          ${d.projects.map(p => `
            <div>
              <span class="bold">${p.name}</span> | ${p.role}
              <span class="date">${p.period}</span>
              ${p.description ? `<div class="desc">${p.description}</div>` : ''}
            </div>
          `).join('')}
        ` : ''}

        <!-- 专业技能 -->
        ${(d.skills && d.skills.length > 0) ? `
          <div class="section-title">技能矩阵与工程素养</div>
          <ul>
            ${d.skills.map(s => `<li>${s}</li>`).join('')}
          </ul>
        ` : ''}
      </body>
      </html>
    `;

    const blob = new Blob(['\ufeff' + wordHtml], { type: 'application/msword;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${b.name || '个人'}_A4简历.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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
