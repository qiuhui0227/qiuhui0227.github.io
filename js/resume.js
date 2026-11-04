/**
 * OASIS | Qiuhui & Yan
 * 简历编辑器模块 (左右实时渲染 + A4 极简专业排版 + 纯前端无损 PDF 与 Word 导出)
 */

class ResumeModule {
  constructor() {
    this.resumeData = window.spaceStore.getResume();
    this.currentViewMode = 'split'; // 'split' (PC宽屏) | 'edit' (手机端编辑) | 'preview' (手机端预览)
  }

  render(container) {
    if (!container) return;
    this.resumeData = window.spaceStore.getResume();

    container.innerHTML = `
      <div class="resume-wrapper">
        <!-- 顶部操作工具栏 -->
        <div class="resume-toolbar card-glass">
          <div class="toolbar-title-group">
            <h3>📄 极简现代 · A4 简历生成器</h3>
            <span class="text-muted">实时双向渲染 · 离线私密无损导出</span>
          </div>

          <!-- 手机端专用模式切换器 -->
          <div class="mobile-resume-tabs">
            <button class="btn btn-sm ${this.currentViewMode === 'edit' ? 'btn-primary' : 'btn-outline'}" id="btn-tab-edit">✏️ 编辑模式</button>
            <button class="btn btn-sm ${this.currentViewMode === 'preview' ? 'btn-primary' : 'btn-outline'}" id="btn-tab-preview">👁️ A4 预览</button>
          </div>

          <div class="toolbar-actions">
            <button class="btn btn-outline" id="btn-reset-resume" title="重置为示范模板">
              🔄 恢复范例
            </button>
            <button class="btn btn-outline" id="btn-export-word" title="下载标准 Word (.docx/.doc) 文件">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
              导出 Word 文档
            </button>
            <button class="btn btn-primary" id="btn-export-pdf" title="浏览器高保真矢量打印为 A4 PDF">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9V2h12v7"></path><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
              下载 A4 PDF
            </button>
          </div>
        </div>

        <!-- 主工作区分屏布局 -->
        <div class="resume-workspace ${this.currentViewMode}">
          <!-- 左侧：模块化表单编辑面板 -->
          <div class="resume-editor-panel card-glass" id="resume-editor-pane">
            ${this.renderEditorForm()}
          </div>

          <!-- 右侧：A4 真实比例高保真排版预览 -->
          <div class="resume-preview-panel" id="resume-preview-pane">
            <div class="a4-page-sheet shadow-lg" id="resume-a4-sheet">
              ${this.renderA4Html()}
            </div>
          </div>
        </div>
      </div>
    `;

    this.bindEvents(container);
  }

  // 渲染左侧表单
  renderEditorForm() {
    const d = this.resumeData;
    const b = d.basics || {};

    return `
      <form id="resume-main-form" class="resume-form-flow">
        <!-- 1. 基本信息 -->
        <div class="form-section-card">
          <div class="section-title">
            <span class="icon">👤</span> 个人基本资料
          </div>
          <div class="form-row">
            <div class="form-group flex-1">
              <label>姓名</label>
              <input type="text" class="input resume-sync" data-path="basics.name" value="${this.escapeHtml(b.name || '')}">
            </div>
            <div class="form-group flex-1">
              <label>求职意向 / 职位头衔</label>
              <input type="text" class="input resume-sync" data-path="basics.title" value="${this.escapeHtml(b.title || '')}">
            </div>
          </div>
          <div class="form-row">
            <div class="form-group flex-1">
              <label>邮箱</label>
              <input type="email" class="input resume-sync" data-path="basics.email" value="${this.escapeHtml(b.email || '')}">
            </div>
            <div class="form-group flex-1">
              <label>电话</label>
              <input type="text" class="input resume-sync" data-path="basics.phone" value="${this.escapeHtml(b.phone || '')}">
            </div>
          </div>
          <div class="form-row">
            <div class="form-group flex-1">
              <label>所在地</label>
              <input type="text" class="input resume-sync" data-path="basics.location" value="${this.escapeHtml(b.location || '')}">
            </div>
            <div class="form-group flex-1">
              <label>个人主页 / 博客</label>
              <input type="text" class="input resume-sync" data-path="basics.website" value="${this.escapeHtml(b.website || '')}">
            </div>
          </div>
          <div class="form-group">
            <label>个人亮点总结</label>
            <textarea class="input textarea resume-sync" rows="2" data-path="basics.summary">${this.escapeHtml(b.summary || '')}</textarea>
          </div>
        </div>

        <!-- 2. 教育背景 -->
        <div class="form-section-card">
          <div class="section-header-row">
            <div class="section-title"><span class="icon">🎓</span> 教育经历</div>
            <button type="button" class="btn btn-xs btn-outline" id="btn-add-edu">+ 添加一条</button>
          </div>
          <div id="edu-items-wrap">
            ${(d.education || []).map((edu, idx) => `
              <div class="sub-form-item" data-index="${idx}">
                <div class="sub-item-header">
                  <span>经历 #${idx + 1}</span>
                  <button type="button" class="btn-text-del btn-del-edu" data-index="${idx}">删除</button>
                </div>
                <div class="form-row">
                  <div class="form-group flex-1">
                    <input type="text" class="input input-sm" placeholder="学校名称" value="${this.escapeHtml(edu.school)}" data-path="education.${idx}.school">
                  </div>
                  <div class="form-group flex-1">
                    <input type="text" class="input input-sm" placeholder="学历 (如 硕士/本科)" value="${this.escapeHtml(edu.degree)}" data-path="education.${idx}.degree">
                  </div>
                </div>
                <div class="form-row">
                  <div class="form-group flex-1">
                    <input type="text" class="input input-sm" placeholder="专业方向" value="${this.escapeHtml(edu.major)}" data-path="education.${idx}.major">
                  </div>
                  <div class="form-group flex-1">
                    <input type="text" class="input input-sm" placeholder="起止时间 (如 2023.09 - 2026.06)" value="${this.escapeHtml(edu.period)}" data-path="education.${idx}.period">
                  </div>
                </div>
                <div class="form-group">
                  <input type="text" class="input input-sm" placeholder="核心科研/主修课程或排名" value="${this.escapeHtml(edu.description || '')}" data-path="education.${idx}.description">
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- 3. 工作经历 -->
        <div class="form-section-card">
          <div class="section-header-row">
            <div class="section-title"><span class="icon">💼</span> 工作 / 实习经历</div>
            <button type="button" class="btn btn-xs btn-outline" id="btn-add-work">+ 添加一条</button>
          </div>
          <div id="work-items-wrap">
            ${(d.work || []).map((w, idx) => `
              <div class="sub-form-item" data-index="${idx}">
                <div class="sub-item-header">
                  <span>经历 #${idx + 1}</span>
                  <button type="button" class="btn-text-del btn-del-work" data-index="${idx}">删除</button>
                </div>
                <div class="form-row">
                  <div class="form-group flex-1">
                    <input type="text" class="input input-sm" placeholder="单位 / 实验室名称" value="${this.escapeHtml(w.company)}" data-path="work.${idx}.company">
                  </div>
                  <div class="form-group flex-1">
                    <input type="text" class="input input-sm" placeholder="职位名称" value="${this.escapeHtml(w.position)}" data-path="work.${idx}.position">
                  </div>
                  <div class="form-group flex-1">
                    <input type="text" class="input input-sm" placeholder="时间 (如 2024.03 - 至今)" value="${this.escapeHtml(w.period)}" data-path="work.${idx}.period">
                  </div>
                </div>
                <div class="form-group">
                  <textarea class="input textarea input-sm" rows="2" placeholder="核心工作职责、技术突破与交付业绩" data-path="work.${idx}.highlights">${this.escapeHtml(w.highlights || '')}</textarea>
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- 4. 项目经历 -->
        <div class="form-section-card">
          <div class="section-header-row">
            <div class="section-title"><span class="icon">🚀</span> 重点项目经历</div>
            <button type="button" class="btn btn-xs btn-outline" id="btn-add-proj">+ 添加一条</button>
          </div>
          <div id="proj-items-wrap">
            ${(d.projects || []).map((p, idx) => `
              <div class="sub-form-item" data-index="${idx}">
                <div class="sub-item-header">
                  <span>项目 #${idx + 1}</span>
                  <button type="button" class="btn-text-del btn-del-proj" data-index="${idx}">删除</button>
                </div>
                <div class="form-row">
                  <div class="form-group flex-2">
                    <input type="text" class="input input-sm" placeholder="项目全称" value="${this.escapeHtml(p.name)}" data-path="projects.${idx}.name">
                  </div>
                  <div class="form-group flex-1">
                    <input type="text" class="input input-sm" placeholder="担任角色" value="${this.escapeHtml(p.role)}" data-path="projects.${idx}.role">
                  </div>
                  <div class="form-group flex-1">
                    <input type="text" class="input input-sm" placeholder="起止时间" value="${this.escapeHtml(p.period)}" data-path="projects.${idx}.period">
                  </div>
                </div>
                <div class="form-group">
                  <textarea class="input textarea input-sm" rows="2" placeholder="项目技术栈、架构设计、具体贡献与量化指标" data-path="projects.${idx}.description">${this.escapeHtml(p.description || '')}</textarea>
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- 5. 技能清单 -->
        <div class="form-section-card">
          <div class="section-title"><span class="icon">⚡</span> 技能矩阵与工程素养</div>
          <p class="form-tip">每行输入一条技能分类，排版更优雅。</p>
          <textarea class="input textarea" rows="4" id="resume-skills-input" placeholder="技术栈: C/C++, Python...&#10;专业领域: 运动控制规划, 传感器融合...">${(d.skills || []).join('\n')}</textarea>
        </div>
      </form>
    `;
  }

  // 渲染 A4 真实比例预览页面
  renderA4Html() {
    const d = this.resumeData;
    const b = d.basics || {};

    return `
      <div class="resume-paper" id="resume-print-content">
        <!-- 头部 Header -->
        <header class="rp-header">
          <h1 class="rp-name">${this.escapeHtml(b.name || '姓名')}</h1>
          <div class="rp-title">${this.escapeHtml(b.title || '专业工程师 / 岗位头衔')}</div>
          
          <div class="rp-contact-bar">
            ${b.phone ? `<span>📞 ${this.escapeHtml(b.phone)}</span>` : ''}
            ${b.email ? `<span>✉️ ${this.escapeHtml(b.email)}</span>` : ''}
            ${b.location ? `<span>📍 ${this.escapeHtml(b.location)}</span>` : ''}
            ${b.website ? `<span>🌐 <a href="${this.escapeHtml(b.website)}" target="_blank">${this.escapeHtml(b.website.replace(/^https?:\/\//, ''))}</a></span>` : ''}
          </div>

          ${b.summary ? `
            <div class="rp-summary">${this.escapeHtml(b.summary)}</div>
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
            <h2 class="rp-section-title">工作 / 实习经历</h2>
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
            <h2 class="rp-section-title">技能矩阵</h2>
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

  // 绑定各类交互与导出
  bindEvents(container) {
    // 监听实时输入与自动同步
    container.querySelectorAll('.resume-sync, [data-path]').forEach(input => {
      input.addEventListener('input', (e) => {
        this.updateDataByPath(e.target.dataset.path, e.target.value);
        this.refreshPreview(container);
      });
    });

    // 技能文本框
    const skillsInput = container.querySelector('#resume-skills-input');
    if (skillsInput) {
      skillsInput.addEventListener('input', (e) => {
        this.resumeData.skills = e.target.value.split('\n').filter(s => s.trim().length > 0);
        window.spaceStore.saveResume(this.resumeData);
        this.refreshPreview(container);
      });
    }

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

    // 添加教育经历
    container.querySelector('#btn-add-edu')?.addEventListener('click', () => {
      if (!this.resumeData.education) this.resumeData.education = [];
      this.resumeData.education.push({ school: '学校名称', degree: '本科/硕士', major: '专业名称', period: '2020.09 - 2024.06', description: '' });
      window.spaceStore.saveResume(this.resumeData);
      this.render(container);
    });

    // 删除教育经历
    container.querySelectorAll('.btn-del-edu').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.index, 10);
        this.resumeData.education.splice(idx, 1);
        window.spaceStore.saveResume(this.resumeData);
        this.render(container);
      });
    });

    // 添加工作经历
    container.querySelector('#btn-add-work')?.addEventListener('click', () => {
      if (!this.resumeData.work) this.resumeData.work = [];
      this.resumeData.work.push({ company: '公司 / 机构名', position: '职位名称', period: '2024.01 - 至今', highlights: '' });
      window.spaceStore.saveResume(this.resumeData);
      this.render(container);
    });

    // 删除工作经历
    container.querySelectorAll('.btn-del-work').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.index, 10);
        this.resumeData.work.splice(idx, 1);
        window.spaceStore.saveResume(this.resumeData);
        this.render(container);
      });
    });

    // 添加重点项目
    container.querySelector('#btn-add-proj')?.addEventListener('click', () => {
      if (!this.resumeData.projects) this.resumeData.projects = [];
      this.resumeData.projects.push({ name: '新项目名称', role: '研发负责人', period: '2025.01 - 2025.06', description: '' });
      window.spaceStore.saveResume(this.resumeData);
      this.render(container);
    });

    // 删除重点项目
    container.querySelectorAll('.btn-del-proj').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.index, 10);
        this.resumeData.projects.splice(idx, 1);
        window.spaceStore.saveResume(this.resumeData);
        this.render(container);
      });
    });

    // 恢复示范模板
    container.querySelector('#btn-reset-resume')?.addEventListener('click', () => {
      if (confirm('确认恢复为初始示范简历模板吗？当前修改将被覆盖。')) {
        localStorage.removeItem('oasis_resume_data');
        window.spaceStore.initDefaultStorage();
        this.resumeData = window.spaceStore.getResume();
        this.render(container);
      }
    });

    // 导出 PDF (调用专用 A4 打印引擎)
    container.querySelector('#btn-export-pdf')?.addEventListener('click', () => {
      this.exportPDF();
    });

    // 导出 Word (.docx / .doc)
    container.querySelector('#btn-export-word')?.addEventListener('click', () => {
      this.exportWord();
    });
  }

  // 根据点号路径更新对象
  updateDataByPath(path, value) {
    if (!path) return;
    const parts = path.split('.');
    let cur = this.resumeData;
    for (let i = 0; i < parts.length - 1; i++) {
      if (!cur[parts[i]]) cur[parts[i]] = {};
      cur = cur[parts[i]];
    }
    cur[parts[parts.length - 1]] = value;
    window.spaceStore.saveResume(this.resumeData);
  }

  // 局部刷新右侧预览
  refreshPreview(container) {
    const sheet = container.querySelector('#resume-a4-sheet');
    if (sheet) {
      sheet.innerHTML = this.renderA4Html();
    }
  }

  // 导出 PDF：调用浏览器高保真矢量打印引擎
  exportPDF() {
    window.print();
  }

  // 纯前端导出 Word (.doc 标准 XML 格式，任何版本的 Word 和 WPS 均可无损打开排版编辑)
  exportWord() {
    const d = this.resumeData;
    const b = d.basics || {};

    const wordHtml = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>${b.name || '个人简历'}</title>
        <style>
          body { font-family: 'Microsoft YaHei', SimSun, sans-serif; font-size: 10.5pt; line-height: 1.5; color: #333333; }
          h1 { font-size: 20pt; margin: 0 0 5pt 0; text-align: center; color: #111827; }
          .title { font-size: 11pt; text-align: center; color: #4B5563; margin-bottom: 8pt; }
          .contact { font-size: 9.5pt; text-align: center; color: #6B7280; border-bottom: 1.5pt solid #2563EB; padding-bottom: 8pt; margin-bottom: 12pt; }
          .section-title { font-size: 12pt; font-weight: bold; color: #1E3A8A; border-bottom: 1pt solid #D1D5DB; padding-bottom: 3pt; margin-top: 14pt; margin-bottom: 8pt; }
          .item-row { display: flex; justify-content: space-between; margin-bottom: 2pt; }
          .bold { font-weight: bold; }
          .date { color: #6B7280; float: right; }
          .desc { font-size: 9.5pt; color: #4B5563; margin-top: 2pt; margin-bottom: 6pt; text-align: justify; }
          ul { margin: 2pt 0 6pt 18pt; padding: 0; }
          li { font-size: 9.5pt; color: #374151; margin-bottom: 2pt; }
        </style>
      </head>
      <body>
        <h1>${b.name || '个人简历'}</h1>
        <div class="title">${b.title || ''}</div>
        <div class="contact">
          ${[b.phone, b.email, b.location, b.website].filter(Boolean).join(' | ')}
        </div>
        ${b.summary ? `<div class="desc"><strong>个人概述：</strong>${b.summary}</div>` : ''}

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

        <!-- 项目经历 -->
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
          <div class="section-title">技能矩阵</div>
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
    a.download = `${b.name || '王琰'}_个人简历.doc`;
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
