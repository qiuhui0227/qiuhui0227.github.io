/**
 * OASIS | Qiuhui & Yan
 * 双人独立简历编辑器 (支持男主王岩工程研发型 + 女主杜秋慧医学生学术联系导师专用型)
 * 支持纯前端证件照上传压缩 + 双向实时渲染 + 标准 Word 与矢量 A4 PDF 导出
 */

class ResumeModule {
  constructor() {
    this.currentPerson = 'qiuhui'; // 默认展示女主当前正在整理的医学学术简历
    this.currentViewMode = 'split';
    this.saveStatusText = '已全部自动保存';
  }

  loadData() {
    this.resumeData = window.spaceStore.getResume(this.currentPerson);
  }

  render(container) {
    if (!container) return;

    // 严格隐私隔离：非卧室主人严禁访问双人档案
    if (!window.spaceAuth.isMaster()) {
      container.innerHTML = `
        <div class="admin-card" style="text-align: center; padding: 48px 24px; max-width: 600px; margin: 40px auto;">
          <div style="font-size: 42px; margin-bottom: 16px;">🔒</div>
          <h3 style="font-size: 18px; color: #18354a; margin-bottom: 8px;">双人简历档案已处于私密保护状态</h3>
          <p class="fine" style="color: #68889c; line-height: 1.6; margin-bottom: 20px;">
            简历档案包含学业成绩、个人电话、邮箱及学术履历等敏感隐私。<br>
            客厅来宾模式无权查阅或修改，请验证主人密码进入卧室以解锁。
          </p>
          <button class="btn btn-primary" id="btn-resume-upgrade-master">🔑 验证主人身份进入卧室</button>
        </div>
      `;
      container.querySelector('#btn-resume-upgrade-master')?.addEventListener('click', () => {
        if (window.spaceApp) window.spaceApp.openMasterUpgradeModal();
      });
      return;
    }

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
            <button class="person-tab ${this.currentPerson === 'qiuhui' ? 'active' : ''}" data-person="qiuhui">
              👧 杜秋慧 (Qiuhui) 的简历 · 医学生联系导师
            </button>
            <button class="person-tab ${this.currentPerson === 'yan' ? 'active' : ''}" data-person="yan">
              👦 王岩 (Yan) 的简历 · 控制算法工程师
            </button>
          </div>

          <!-- 手机端模式切换 -->
          <div class="mobile-resume-tabs" style="display:none;">
            <button class="btn btn-sm ${this.currentViewMode === 'edit' ? 'btn-primary' : 'btn-outline'}" id="btn-tab-edit">✏️ 编辑</button>
            <button class="btn btn-sm ${this.currentViewMode === 'preview' ? 'btn-primary' : 'btn-outline'}" id="btn-tab-preview">👁️ A4 预览</button>
          </div>

          <div class="toolbar-actions">
            <span class="fine save-indicator" id="resume-save-indicator">${this.saveStatusText}</span>
            <button class="btn btn-outline btn-sm" id="btn-reset-template" title="载入并恢复标准学术范本">
              🔄 载入学术范式
            </button>
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

  // 渲染表单 (自适应医学生学术联系导师架构 vs 工程研发架构)
  renderEditorForm() {
    const d = this.resumeData;
    const b = d.basics || {};
    const hasAvatar = !!d.avatar;
    const isMedical = (this.currentPerson === 'qiuhui' || !!d.isMedicalCV);

    if (isMedical) {
      return this.renderMedicalEditorForm(d, b, hasAvatar);
    } else {
      return this.renderEngineeringEditorForm(d, b, hasAvatar);
    }
  }

  // 女主医学生学术简历表单
  renderMedicalEditorForm(d, b, hasAvatar) {
    return `
      <form id="resume-main-form" class="resume-form-flow">
        <!-- 1. 基本信息 + 证件照上传 -->
        <div class="form-section-card">
          <div class="section-title">
            <svg class="ico" viewBox="0 0 24 24"><path d="M20 21a8 8 0 0 0-16 0"/><circle cx="12" cy="8" r="4"/></svg>
            <span>个人基本资料与导师意向 (含证件照)</span>
          </div>

          <!-- 证件照上传操作区 -->
          <div class="avatar-uploader-row">
            <div class="avatar-preview-box" id="avatar-preview-box">
              ${hasAvatar ? `
                <img src="${d.avatar}" class="avatar-real-img" alt="avatar" />
              ` : `
                <div class="avatar-placeholder-box">
                  <svg class="ico" width="28" height="28" viewBox="0 0 24 24"><path d="M20 21a8 8 0 0 0-16 0"/><circle cx="12" cy="8" r="4"/></svg>
                  <span>未上传证件照<br>(支持白大褂/正装)</span>
                </div>
              `}
            </div>
            <div class="avatar-actions-wrap">
              <div style="font-weight:750; font-size:13px; color:#18354a; margin-bottom:4px;">标准医学学术证件照</div>
              <div class="fine" style="margin-bottom:8px;">推荐 1寸/2寸 白大褂或正装照片，纯前端视网膜级轻量压缩。</div>
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
            <div class="field" style="flex:1.5;">
              <label>培养层次与院校专业</label>
              <input type="text" class="input resume-sync" data-path="basics.title" value="${this.escapeHtml(b.title || '')}">
            </div>
          </div>

          <div class="form-row">
            <div class="field" style="flex:2;">
              <label>申请意向与意向导师</label>
              <input type="text" class="input resume-sync" data-path="basics.target" value="${this.escapeHtml(b.target || '')}">
            </div>
            <div class="field" style="flex:1;">
              <label>政治面貌</label>
              <input type="text" class="input resume-sync" data-path="basics.politics" value="${this.escapeHtml(b.politics || '')}">
            </div>
          </div>

          <div class="form-row">
            <div class="field" style="flex:1;">
              <label>电子邮箱 (推荐吉大校园邮箱)</label>
              <input type="email" class="input resume-sync" data-path="basics.email" value="${this.escapeHtml(b.email || '')}">
            </div>
            <div class="field" style="flex:1;">
              <label>联系电话</label>
              <input type="text" class="input resume-sync" data-path="basics.phone" value="${this.escapeHtml(b.phone || '')}">
            </div>
          </div>

          <div class="field">
            <label>个人亮点与自述 (突出大三 2/39、六级 507、生命科学省三等奖、实习组长及对颌面外科志向)</label>
            <textarea class="textarea resume-sync" rows="3" data-path="basics.summary">${this.escapeHtml(b.summary || '')}</textarea>
          </div>
        </div>

        <!-- 2. 教育背景与学业排名 -->
        <div class="form-section-card">
          <div class="section-title">
            <svg class="ico" viewBox="0 0 24 24"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>
            <span>教育背景与核心学业指标</span>
          </div>
          <div id="edu-items-wrap">
            ${(d.education || []).map((edu, idx) => `
              <div class="sub-form-item">
                <div class="form-row">
                  <div class="field" style="flex:2;">
                    <label>培养院校与院系</label>
                    <input type="text" class="input sm resume-sync" value="${this.escapeHtml(edu.school)}" data-path="education.${idx}.school">
                  </div>
                  <div class="field" style="flex:1;">
                    <label>起止时间</label>
                    <input type="text" class="input sm resume-sync" value="${this.escapeHtml(edu.period)}" data-path="education.${idx}.period">
                  </div>
                </div>
                <div class="form-row">
                  <div class="field" style="flex:1;">
                    <label>培养层次 / 专业</label>
                    <input type="text" class="input sm resume-sync" value="${this.escapeHtml(edu.major)}" data-path="education.${idx}.major">
                  </div>
                  <div class="field" style="flex:1;">
                    <label>核心学业排名 (如 2/39)</label>
                    <input type="text" class="input sm resume-sync" value="${this.escapeHtml(edu.ranking || '')}" data-path="education.${idx}.ranking">
                  </div>
                  <div class="field" style="flex:1;">
                    <label>外语水平 (如 CET-6 507分)</label>
                    <input type="text" class="input sm resume-sync" value="${this.escapeHtml(edu.cet6 || '')}" data-path="education.${idx}.cet6">
                  </div>
                </div>
                <div class="field">
                  <label>学业总结与核心课程清单</label>
                  <textarea class="textarea resume-sync" rows="2" data-path="education.${idx}.description">${this.escapeHtml(edu.description || '')}</textarea>
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- 3. 学业荣誉与奖学金 -->
        <div class="form-section-card">
          <div class="section-header-row">
            <div class="section-title">
              <svg class="ico" viewBox="0 0 24 24"><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></svg>
              <span>学业荣誉与奖学金</span>
            </div>
            <button type="button" class="btn btn-outline btn-xs" id="btn-add-honor">+ 增加荣誉</button>
          </div>
          <div id="honor-items-wrap">
            ${(d.honors || []).map((h, idx) => `
              <div class="sub-form-item">
                <div class="sub-item-header">
                  <span>荣誉记录 #${idx + 1}</span>
                  <button type="button" class="btn-text-del btn-del-honor" data-index="${idx}">删除</button>
                </div>
                <div class="form-row">
                  <div class="field" style="flex:1;">
                    <input type="text" class="input sm resume-sync" placeholder="学年" value="${this.escapeHtml(h.period)}" data-path="honors.${idx}.period">
                  </div>
                  <div class="field" style="flex:3;">
                    <input type="text" class="input sm resume-sync" placeholder="荣誉 / 奖学金内容" value="${this.escapeHtml(h.title)}" data-path="honors.${idx}.title">
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- 4. 科研训练与学科竞赛 -->
        <div class="form-section-card">
          <div class="section-header-row">
            <div class="section-title">
              <svg class="ico" viewBox="0 0 24 24"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>
              <span>科研训练与学科竞赛</span>
            </div>
            <button type="button" class="btn btn-outline btn-xs" id="btn-add-research">+ 增加科研/竞赛</button>
          </div>
          <div id="research-items-wrap">
            ${(d.research || []).map((r, idx) => `
              <div class="sub-form-item">
                <div class="sub-item-header">
                  <span>科研/竞赛 #${idx + 1}</span>
                  <button type="button" class="btn-text-del btn-del-research" data-index="${idx}">删除</button>
                </div>
                <div class="form-row">
                  <div class="field" style="flex:2;">
                    <input type="text" class="input sm resume-sync" placeholder="竞赛/项目名称" value="${this.escapeHtml(r.name)}" data-path="research.${idx}.name">
                  </div>
                  <div class="field" style="flex:1.5;">
                    <input type="text" class="input sm resume-sync" placeholder="角色与获奖 (如 省级三等奖)" value="${this.escapeHtml(r.role)}" data-path="research.${idx}.role">
                  </div>
                  <div class="field" style="flex:1;">
                    <input type="text" class="input sm resume-sync" placeholder="年份" value="${this.escapeHtml(r.period)}" data-path="research.${idx}.period">
                  </div>
                </div>
                <div class="field">
                  <textarea class="textarea resume-sync" rows="2" placeholder="职责与科研心得体会" data-path="research.${idx}.description">${this.escapeHtml(r.description || '')}</textarea>
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- 5. 临床学习与轮转实习经历 -->
        <div class="form-section-card">
          <div class="section-header-row">
            <div class="section-title">
              <svg class="ico" viewBox="0 0 24 24"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
              <span>临床学习与轮转见习 (突出实习组长与严谨作风)</span>
            </div>
            <button type="button" class="btn btn-outline btn-xs" id="btn-add-clinical">+ 增加临床经历</button>
          </div>
          <div id="clinical-items-wrap">
            ${(d.clinical || []).map((c, idx) => `
              <div class="sub-form-item">
                <div class="sub-item-header">
                  <span>临床实习记录 #${idx + 1}</span>
                  <button type="button" class="btn-text-del btn-del-clinical" data-index="${idx}">删除</button>
                </div>
                <div class="form-row">
                  <div class="field" style="flex:2;">
                    <input type="text" class="input sm resume-sync" placeholder="医院 / 科室" value="${this.escapeHtml(c.hospital)}" data-path="clinical.${idx}.hospital">
                  </div>
                  <div class="field" style="flex:1.5;">
                    <input type="text" class="input sm resume-sync" placeholder="职务 (如 口腔实习组长)" value="${this.escapeHtml(c.role)}" data-path="clinical.${idx}.role">
                  </div>
                  <div class="field" style="flex:1;">
                    <input type="text" class="input sm resume-sync" placeholder="时间" value="${this.escapeHtml(c.period)}" data-path="clinical.${idx}.period">
                  </div>
                </div>
                <div class="field">
                  <textarea class="textarea resume-sync" rows="2" placeholder="工作表现与临床技能收获" data-path="clinical.${idx}.highlights">${this.escapeHtml(c.highlights || '')}</textarea>
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- 6. 专业素养、科研工具与学术志向 -->
        <div class="form-section-card">
          <div class="section-title">
            <svg class="ico" viewBox="0 0 24 24"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
            <span>专业素养、科研工具、学术志向与社会工作</span>
          </div>
          <div class="fine" style="margin-bottom:6px;">每行输入一条，包含外科基本功、BioRender/文献工具、学术志向与社会实践：</div>
          <textarea class="textarea" rows="4" id="resume-skills-input">${(d.skills || []).join('\n')}</textarea>
        </div>
      </form>
    `;
  }

  // 男主工程研发简历表单
  renderEngineeringEditorForm(d, b, hasAvatar) {
    return `
      <form id="resume-main-form" class="resume-form-flow">
        <div class="form-section-card">
          <div class="section-title">
            <svg class="ico" viewBox="0 0 24 24"><path d="M20 21a8 8 0 0 0-16 0"/><circle cx="12" cy="8" r="4"/></svg>
            <span>个人基本资料与证件照</span>
          </div>

          <div class="avatar-uploader-row">
            <div class="avatar-preview-box">
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
              <div style="font-weight:750; font-size:13px; color:#18354a; margin-bottom:4px;">标准工程证件照</div>
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
              <label>求职意向 / 岗位头衔</label>
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

          <div class="field">
            <label>个人亮点概述</label>
            <textarea class="textarea resume-sync" rows="2" data-path="basics.summary">${this.escapeHtml(b.summary || '')}</textarea>
          </div>
        </div>

        <div class="form-section-card">
          <div class="section-title">
            <span>教育经历</span>
          </div>
          ${(d.education || []).map((edu, idx) => `
            <div class="sub-form-item">
              <div class="form-row">
                <div class="field" style="flex:2;"><input type="text" class="input sm resume-sync" value="${this.escapeHtml(edu.school)}" data-path="education.${idx}.school"></div>
                <div class="field" style="flex:1;"><input type="text" class="input sm resume-sync" value="${this.escapeHtml(edu.degree)}" data-path="education.${idx}.degree"></div>
                <div class="field" style="flex:1;"><input type="text" class="input sm resume-sync" value="${this.escapeHtml(edu.period)}" data-path="education.${idx}.period"></div>
              </div>
              <div class="field"><input type="text" class="input sm resume-sync" value="${this.escapeHtml(edu.description || '')}" data-path="education.${idx}.description"></div>
            </div>
          `).join('')}
        </div>

        <div class="form-section-card">
          <div class="section-title"><span>项目研发与工作经历</span></div>
          ${(d.projects || []).map((p, idx) => `
            <div class="sub-form-item">
              <div class="form-row">
                <div class="field" style="flex:2;"><input type="text" class="input sm resume-sync" value="${this.escapeHtml(p.name)}" data-path="projects.${idx}.name"></div>
                <div class="field" style="flex:1;"><input type="text" class="input sm resume-sync" value="${this.escapeHtml(p.role)}" data-path="projects.${idx}.role"></div>
                <div class="field" style="flex:1;"><input type="text" class="input sm resume-sync" value="${this.escapeHtml(p.period)}" data-path="projects.${idx}.period"></div>
              </div>
              <div class="field"><textarea class="textarea resume-sync" rows="2" data-path="projects.${idx}.description">${this.escapeHtml(p.description || '')}</textarea></div>
            </div>
          `).join('')}
        </div>

        <div class="form-section-card">
          <div class="section-title"><span>技能清单</span></div>
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
    const isMedical = (this.currentPerson === 'qiuhui' || !!d.isMedicalCV);

    if (isMedical) {
      return this.renderMedicalA4Html(d, b, hasAvatar);
    } else {
      return this.renderEngineeringA4Html(d, b, hasAvatar);
    }
  }

  // 女主医学生联系导师专属 A4 矢量排版
  renderMedicalA4Html(d, b, hasAvatar) {
    return `
      <div class="resume-paper" id="resume-print-content">
        <!-- 头部 Header -->
        <header class="rp-header ${hasAvatar ? 'has-avatar' : ''}">
          <div class="rp-header-main">
            <h1 class="rp-name">${this.escapeHtml(b.name || '杜秋慧 / [待填写]')}</h1>
            <div class="rp-title">${this.escapeHtml(b.title || '吉林大学白求恩口腔医学院 · 口腔医学“5+3”一体化（2022级·大四）')}</div>
            
            ${b.target ? `
              <div class="rp-intent-bar">
                <span class="rp-intent-label">申请意向：</span>
                <span class="rp-intent-mentor">${this.escapeHtml(b.target)}</span>
              </div>
            ` : ''}

            <div class="rp-contact-bar">
              ${b.phone ? `<span>📞 电话: ${this.escapeHtml(b.phone)}</span>` : ''}
              ${b.email ? `<span>✉️ 邮箱: ${this.escapeHtml(b.email)}</span>` : ''}
              ${b.politics ? `<span>🏛️ 政治面貌: ${this.escapeHtml(b.politics)}</span>` : ''}
              ${b.location ? `<span>📍 培养院校: ${this.escapeHtml(b.location)}</span>` : ''}
            </div>

            ${b.summary ? `
              <div class="rp-summary">${this.escapeHtml(b.summary)}</div>
            ` : ''}
          </div>

          ${hasAvatar ? `
            <div class="rp-avatar-box">
              <img src="${d.avatar}" alt="证件照" class="rp-avatar-img">
            </div>
          ` : `
            <div class="rp-avatar-box" style="display:flex; flex-direction:column; align-items:center; justify-content:center; background:#f4f7f8; color:#9cb0ba; font-size:8pt; text-align:center; padding:4px;">
              <span>【标准证件照】<br>(建议白大褂<br>或正装照)</span>
            </div>
          `}
        </header>

        <!-- 一、 教育背景与学业排名 -->
        ${(d.education && d.education.length > 0) ? `
          <section class="rp-section">
            <h2 class="rp-section-title">▌ 教育背景与学业排名  EDUCATION & STANDING</h2>
            <div class="rp-section-content">
              ${d.education.map(e => `
                <div class="rp-item">
                  <div class="rp-item-row">
                    <span class="rp-item-bold">${this.escapeHtml(e.school)}</span>
                    <span class="rp-item-mid">${this.escapeHtml(e.major)}</span>
                    <span class="rp-item-date">${this.escapeHtml(e.period)}</span>
                  </div>
                  <div style="margin: 3pt 0;">
                    ${e.ranking ? `<span class="rp-badge-rank">${this.escapeHtml(e.ranking)}</span>` : ''}
                    ${e.cet6 ? `<span class="rp-badge-tag">${this.escapeHtml(e.cet6)}</span>` : ''}
                  </div>
                  ${e.description ? `<div class="rp-item-desc">${this.escapeHtml(e.description)}</div>` : ''}
                </div>
              `).join('')}
            </div>
          </section>
        ` : ''}

        <!-- 二、 学业荣誉与奖学金 -->
        ${(d.honors && d.honors.length > 0) ? `
          <section class="rp-section">
            <h2 class="rp-section-title">▌ 学业荣誉与奖学金  HONORS & SCHOLARSHIPS</h2>
            <div class="rp-section-content">
              <ul class="rp-skills-list" style="list-style-type: disc;">
                ${d.honors.map(h => `
                  <li><strong>${this.escapeHtml(h.period)}</strong>：${this.escapeHtml(h.title)}</li>
                `).join('')}
              </ul>
            </div>
          </section>
        ` : ''}

        <!-- 三、 科研训练与学科竞赛 -->
        ${(d.research && d.research.length > 0) ? `
          <section class="rp-section">
            <h2 class="rp-section-title">▌ 科研训练与学科竞赛  RESEARCH & COMPETITIONS</h2>
            <div class="rp-section-content">
              ${d.research.map(r => `
                <div class="rp-item">
                  <div class="rp-item-row">
                    <span class="rp-item-bold">${this.escapeHtml(r.name)}</span>
                    <span class="rp-item-mid" style="color:#1b7659; font-weight:700;">${this.escapeHtml(r.role)}</span>
                    <span class="rp-item-date">${this.escapeHtml(r.period)}</span>
                  </div>
                  ${r.description ? `<div class="rp-item-desc">${this.escapeHtml(r.description)}</div>` : ''}
                </div>
              `).join('')}
            </div>
          </section>
        ` : ''}

        <!-- 四、 临床学习与轮转实习经历 -->
        ${(d.clinical && d.clinical.length > 0) ? `
          <section class="rp-section">
            <h2 class="rp-section-title">▌ 临床学习与实习经历  CLINICAL TRAINING & CLERKSHIP</h2>
            <div class="rp-section-content">
              ${d.clinical.map(c => `
                <div class="rp-item">
                  <div class="rp-item-row">
                    <span class="rp-item-bold">${this.escapeHtml(c.hospital)}</span>
                    <span class="rp-item-mid" style="color:#15354a; font-weight:750;">${this.escapeHtml(c.role)}</span>
                    <span class="rp-item-date">${this.escapeHtml(c.period)}</span>
                  </div>
                  ${c.highlights ? `<div class="rp-item-desc">${this.escapeHtml(c.highlights)}</div>` : ''}
                </div>
              `).join('')}
            </div>
          </section>
        ` : ''}

        <!-- 五、 专业素养、科研工具与学术志向 -->
        ${(d.skills && d.skills.length > 0) ? `
          <section class="rp-section">
            <h2 class="rp-section-title">▌ 专业素养、科研工具与学术志向  SKILLS & INTERESTS</h2>
            <div class="rp-section-content">
              <ul class="rp-skills-list" style="list-style-type: square;">
                ${d.skills.map(s => `<li>${this.escapeHtml(s)}</li>`).join('')}
              </ul>
            </div>
          </section>
        ` : ''}
      </div>
    `;
  }

  // 男主工科研发 A4 排版
  renderEngineeringA4Html(d, b, hasAvatar) {
    return `
      <div class="resume-paper" id="resume-print-content">
        <header class="rp-header ${hasAvatar ? 'has-avatar' : ''}">
          <div class="rp-header-main">
            <h1 class="rp-name">${this.escapeHtml(b.name || '王岩')}</h1>
            <div class="rp-title">${this.escapeHtml(b.title || '嵌入式与无人控制系统算法工程师')}</div>
            <div class="rp-contact-bar">
              ${b.phone ? `<span>📞 ${this.escapeHtml(b.phone)}</span>` : ''}
              ${b.email ? `<span>✉️ ${this.escapeHtml(b.email)}</span>` : ''}
              ${b.location ? `<span>📍 ${this.escapeHtml(b.location)}</span>` : ''}
            </div>
            ${b.summary ? `<div class="rp-summary">${this.escapeHtml(b.summary)}</div>` : ''}
          </div>
          ${hasAvatar ? `
            <div class="rp-avatar-box"><img src="${d.avatar}" alt="证件照" class="rp-avatar-img"></div>
          ` : ''}
        </header>

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
                  ${e.description ? `<div class="rp-item-desc">${this.escapeHtml(e.description)}</div>` : ''}
                </div>
              `).join('')}
            </div>
          </section>
        ` : ''}

        ${(d.projects && d.projects.length > 0) ? `
          <section class="rp-section">
            <h2 class="rp-section-title">核心研发项目</h2>
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
        this.saveStatusText = `已切换至 ${this.currentPerson === 'yan' ? '王岩' : '杜秋慧'} 的简历`;
        this.render(container);
      });
    });

    // 载入/重置为学术范式
    container.querySelector('#btn-reset-template')?.addEventListener('click', () => {
      if (confirm(`确认恢复【${this.currentPerson === 'yan' ? '王岩' : '杜秋慧'}】的初始规范范本吗？当前修改将被覆盖。`)) {
        window.spaceStore.resetDefaultResume(this.currentPerson);
        window.spaceApp?.showToast('已成功恢复标准学术范本！', 'good');
        this.render(container);
      }
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
      const personName = this.currentPerson === 'yan' ? '王岩' : '杜秋慧';
      window.spaceApp?.showToast(`已成功保存【${personName}】的简历！`);
    });

    // 增删医学荣誉
    container.querySelector('#btn-add-honor')?.addEventListener('click', () => {
      if (!this.resumeData.honors) this.resumeData.honors = [];
      this.resumeData.honors.push({ period: '学年', title: '荣誉奖项内容' });
      this.saveCurrentData();
      this.render(container);
    });
    container.querySelectorAll('.btn-del-honor').forEach(btn => {
      btn.addEventListener('click', () => {
        this.resumeData.honors.splice(parseInt(btn.dataset.index, 10), 1);
        this.saveCurrentData();
        this.render(container);
      });
    });

    // 增删科研训练
    container.querySelector('#btn-add-research')?.addEventListener('click', () => {
      if (!this.resumeData.research) this.resumeData.research = [];
      this.resumeData.research.push({ name: '科研项目/竞赛名称', role: '项目成员', period: '年份', description: '' });
      this.saveCurrentData();
      this.render(container);
    });
    container.querySelectorAll('.btn-del-research').forEach(btn => {
      btn.addEventListener('click', () => {
        this.resumeData.research.splice(parseInt(btn.dataset.index, 10), 1);
        this.saveCurrentData();
        this.render(container);
      });
    });

    // 增删临床实习
    container.querySelector('#btn-add-clinical')?.addEventListener('click', () => {
      if (!this.resumeData.clinical) this.resumeData.clinical = [];
      this.resumeData.clinical.push({ hospital: '实习科室/医院', role: '口腔实习组长/见习生', period: '时间', highlights: '' });
      this.saveCurrentData();
      this.render(container);
    });
    container.querySelectorAll('.btn-del-clinical').forEach(btn => {
      btn.addEventListener('click', () => {
        this.resumeData.clinical.splice(parseInt(btn.dataset.index, 10), 1);
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

  // 导出标准 Word (.doc)
  exportWord() {
    const d = this.resumeData;
    const b = d.basics || {};
    const contentHtml = this.renderA4Html();

    const wordHtml = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>${b.name || '学术简历'}</title>
        <style>
          @page { size: 21cm 29.7cm; margin: 1.5cm 1.8cm; }
          body { font-family: 'Microsoft YaHei', '微软雅黑', 'SimSun', serif; font-size: 9.5pt; color: #222; line-height: 1.45; }
          .rp-name { font-size: 18pt; font-weight: bold; color: #18354a; margin: 0 0 4pt; }
          .rp-title { font-size: 10.5pt; font-weight: bold; color: #1b7659; margin-bottom: 4pt; }
          .rp-intent-bar { background: #f0f6f9; border-left: 3pt solid #18354a; padding: 4pt 8pt; margin: 4pt 0; font-size: 9pt; }
          .rp-section-title { font-size: 10.5pt; font-weight: bold; color: #18354a; border-bottom: 1.5pt solid #18354a; padding-bottom: 2pt; margin: 10pt 0 4pt; }
          .rp-item-row { display: flex; justify-content: space-between; font-weight: bold; }
          .rp-badge-rank { color: #1b7659; font-weight: bold; }
          .rp-badge-tag { color: #1a73e8; font-weight: bold; }
          ul { margin-left: 18pt; padding-left: 0; }
          li { margin-bottom: 3pt; font-size: 8.8pt; }
        </style>
      </head>
      <body>
        ${contentHtml}
      </body>
      </html>
    `;

    const blob = new Blob(['\ufeff' + wordHtml], { type: 'application/msword;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${b.name ? b.name.split('/')[0].trim() : '学术简历'}_联系导师学术简历.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    window.spaceApp?.showToast('已成功生成并下载 Word 简历文档！', 'good');
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
