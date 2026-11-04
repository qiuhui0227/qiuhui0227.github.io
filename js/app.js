/**
 * OASIS | Qiuhui & Yan
 * 空间核心路由调度与应用控制器 (USV Lab 经典交互与组件规范)
 */

class SpaceApp {
  constructor() {
    this.currentTab = 'timetable';
    this.init();
  }

  init() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        this.checkAuthState();
        this.bindGlobalEvents();
      });
    } else {
      this.checkAuthState();
      this.bindGlobalEvents();
    }
  }

  checkAuthState() {
    const isAuthed = window.spaceAuth.isAuthenticated();
    const lockScreen = document.getElementById('screen-lock');
    const mainApp = document.getElementById('screen-app');

    if (!isAuthed) {
      if (lockScreen) lockScreen.style.display = 'flex';
      if (mainApp) mainApp.style.display = 'none';
      this.bindLockEvents();
    } else {
      if (lockScreen) lockScreen.style.display = 'none';
      if (mainApp) mainApp.style.display = 'block';
      this.renderAppHeader();
      this.switchTab(this.currentTab);
    }
  }

  bindLockEvents() {
    const form = document.getElementById('gate-login-form');
    const inputPwd = document.getElementById('gate-password-input');
    const tipMsg = document.getElementById('gate-error-tip');

    if (form) {
      form.onsubmit = (e) => {
        e.preventDefault();
        const pwd = inputPwd.value;
        const res = window.spaceAuth.login(pwd);

        if (res.success) {
          tipMsg.innerText = '';
          inputPwd.value = '';
          this.showToast(res.message);
          this.checkAuthState();
        } else {
          tipMsg.innerText = res.message;
          inputPwd.focus();
        }
      };
    }
  }

  renderAppHeader() {
    const isMaster = window.spaceAuth.isMaster();
    const roleBadge = document.getElementById('header-role-badge');
    const resumeTabBtn = document.getElementById('tab-btn-resume');
    const settingsTabBtn = document.getElementById('tab-btn-settings');
    const btnSwitchMaster = document.getElementById('btn-switch-master');
    const heroMetaMode = document.getElementById('hero-meta-mode');
    const heroTitle = document.getElementById('hero-title');
    const statEvents = document.getElementById('stat-today-events');
    const statAlbums = document.getElementById('stat-album-count');

    const config = window.spaceStore.getAuthConfig();
    const today = new Date().toISOString().split('T')[0];
    const timetables = window.spaceStore.getTimetables();
    const visibleEvents = timetables.filter(e => e.date === today && (isMaster || e.visibility === 'living_room'));
    const allAlbums = window.spaceStore.getAlbums();
    const visibleAlbums = allAlbums.filter(a => isMaster || a.visibility === 'living_room');

    if (statEvents) statEvents.innerText = visibleEvents.length;
    if (statAlbums) statAlbums.innerText = visibleAlbums.length;

    if (isMaster) {
      if (roleBadge) {
        roleBadge.innerHTML = `
          <svg class="ico" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/></svg>
          <span>卧室主人 (全特权)</span>
        `;
      }
      if (heroTitle) heroTitle.innerText = 'Qiuhui & Yan 的时空印记';
      if (heroMetaMode) heroMetaMode.innerHTML = `<svg class="ico" viewBox="0 0 24 24"><path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></svg> 🛏️ 卧室私密模式`;
      if (resumeTabBtn) resumeTabBtn.style.display = 'flex';
      if (settingsTabBtn) settingsTabBtn.style.display = 'flex';
      if (btnSwitchMaster) btnSwitchMaster.style.display = 'none';
    } else {
      const remaining = config.guestUsageLimit === -1 ? '无限次' : `${config.guestUsageLimit - config.guestUsedCount}次`;
      if (roleBadge) {
        roleBadge.innerHTML = `
          <svg class="ico" viewBox="0 0 24 24"><path d="M20 21a8 8 0 0 0-16 0"/><circle cx="12" cy="8" r="4"/></svg>
          <span>客厅来宾 (剩余: ${remaining})</span>
        `;
      }
      if (heroTitle) heroTitle.innerText = '欢迎来到 Qiuhui & Yan 的客厅';
      if (heroMetaMode) heroMetaMode.innerHTML = `<svg class="ico" viewBox="0 0 24 24"><path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></svg> 🛋️ 客厅开放浏览`;
      // 客厅来宾严格隐藏私密简历与空间管理，绝对保护个人隐私
      if (resumeTabBtn) resumeTabBtn.style.display = 'none';
      if (settingsTabBtn) settingsTabBtn.style.display = 'none';
      if (btnSwitchMaster) btnSwitchMaster.style.display = 'inline-flex';
    }
  }

  bindGlobalEvents() {
    document.querySelectorAll('.tab[data-tab]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        this.switchTab(btn.dataset.tab);
      });
    });

    document.getElementById('btn-logout')?.addEventListener('click', () => {
      if (confirm('确认锁定并退出空间吗？')) {
        window.spaceAuth.logout();
        this.checkAuthState();
      }
    });

    document.getElementById('btn-switch-master')?.addEventListener('click', () => {
      this.openMasterUpgradeModal();
    });
  }

  switchTab(tabName) {
    const isMaster = window.spaceAuth.isMaster();

    // 严密隐私拦截：来宾禁止通过任何方式切换到简历生成器或空间管理
    if (!isMaster && (tabName === 'resume' || tabName === 'settings')) {
      tabName = 'timetable';
      this.showToast('⚠️ 客厅来宾模式仅开放公共时刻表与相簿，无法查看私密档案');
    }

    this.currentTab = tabName;

    document.querySelectorAll('.tab[data-tab]').forEach(link => {
      link.classList.toggle('active', link.dataset.tab === tabName);
    });

    const containers = {
      timetable: document.getElementById('content-timetable'),
      albums: document.getElementById('content-albums'),
      resume: document.getElementById('content-resume'),
      settings: document.getElementById('content-settings')
    };

    Object.keys(containers).forEach(key => {
      if (containers[key]) {
        containers[key].style.display = key === tabName ? 'block' : 'none';
      }
    });

    if (tabName === 'timetable' && window.timetableModule) {
      window.timetableModule.render(containers.timetable);
    } else if (tabName === 'albums' && window.albumsModule) {
      window.albumsModule.render(containers.albums);
    } else if (tabName === 'resume' && window.resumeModule) {
      window.resumeModule.render(containers.resume);
    } else if (tabName === 'settings') {
      this.renderSettings(containers.settings);
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // 渲染管理设置中心 (USV Lab Admin Card 格式)
  renderSettings(container) {
    if (!container) return;
    const config = window.spaceStore.getAuthConfig();

    container.innerHTML = `
      <div class="settings-wrap">
        <!-- 1. 客厅门禁通行证 -->
        <div class="admin-card">
          <div class="card-title">
            <div class="card-title-left">
              <span class="badge-icon">
                <svg class="ico" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/></svg>
              </span>
              <span>客厅来宾通行证配置 (Guest Access)</span>
            </div>
            <span class="pill good">来宾策略生效中</span>
          </div>
          <p class="field-help">输入该密码的访客可以进入客厅，仅能翻阅设置为“客厅开放”的岁月相簿与公开时刻事项。</p>

          <form id="form-guest-config">
            <div class="field">
              <label>来宾访问密码</label>
              <input type="text" class="input" id="cfg-guest-pwd" value="${config.guestPassword || 'guest888'}" required>
            </div>

            <div class="form-row">
              <div class="field">
                <label>最大允许访问次数 (-1 为无限次)</label>
                <input type="number" class="input" id="cfg-guest-limit" value="${config.guestUsageLimit ?? 20}" required>
              </div>
              <div class="field">
                <label>已使用次数</label>
                <div style="display:flex; gap:8px;">
                  <input type="text" class="input" id="cfg-guest-used" value="${config.guestUsedCount || 0}" disabled>
                  <button type="button" class="btn btn-outline btn-sm" id="btn-reset-guest-count">清零</button>
                </div>
              </div>
            </div>

            <div class="field">
              <label>有效截止日期</label>
              <input type="date" class="input" id="cfg-guest-expiry" value="${config.guestExpiryDate || '2027-12-31'}" required>
            </div>

            <div style="display:flex; justify-content:flex-end; margin-top:14px;">
              <button type="submit" class="btn btn-primary">保存来宾规则</button>
            </div>
          </form>
        </div>

        <!-- 2. 主人密码修改 -->
        <div class="admin-card">
          <div class="card-title">
            <div class="card-title-left">
              <span class="badge-icon">
                <svg class="ico" viewBox="0 0 24 24"><rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>
              </span>
              <span>修改主人密码 (卧室私密特权)</span>
            </div>
          </div>
          <p class="field-help">主人密码拥有全功能权限。若修改请牢记新密码，初始密码为 <code>admin</code>。</p>

          <form id="form-master-pwd">
            <div class="field">
              <label>原主人密码</label>
              <input type="password" class="input" id="cfg-old-master" placeholder="请输入当前密码" required>
            </div>
            <div class="field">
              <label>设置新主人密码</label>
              <input type="password" class="input" id="cfg-new-master" placeholder="至少4位密码" required>
            </div>
            <div style="display:flex; justify-content:flex-end; margin-top:14px;">
              <button type="submit" class="btn btn-primary">更新主人密码</button>
            </div>
          </form>
        </div>

        <!-- 3. 数据备份 -->
        <div class="admin-card">
          <div class="card-title">
            <div class="card-title-left">
              <span class="badge-icon">
                <svg class="ico" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
              </span>
              <span>全量数据离线备份与还原</span>
            </div>
          </div>
          <p class="field-help">将时刻表、相簿元数据、简历与安全配置导出为标准 JSON 文件，防止数据丢失。</p>
          <div style="display:flex; gap:12px; margin-top:14px; flex-wrap:wrap;">
            <button class="btn btn-outline" id="btn-export-backup">📥 导出完整空间备份 (JSON)</button>
            <label class="btn btn-outline" style="cursor:pointer; margin:0;">
              <input type="file" id="btn-import-backup" accept=".json" style="display:none;">
              📤 从备份恢复
            </label>
          </div>
        </div>
      </div>
    `;

    // 绑定后台表单
    container.querySelector('#form-guest-config')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const pwd = container.querySelector('#cfg-guest-pwd').value;
      const limit = container.querySelector('#cfg-guest-limit').value;
      const exp = container.querySelector('#cfg-guest-expiry').value;

      const res = window.spaceAuth.updateGuestConfig({
        newGuestPassword: pwd,
        usageLimit: limit,
        expiryDate: exp
      });
      this.showToast(res.message, !res.success);
      this.renderAppHeader();
    });

    container.querySelector('#btn-reset-guest-count')?.addEventListener('click', () => {
      window.spaceAuth.updateGuestConfig({ resetCount: true });
      container.querySelector('#cfg-guest-used').value = 0;
      this.showToast('来宾已使用次数已清零！');
      this.renderAppHeader();
    });

    container.querySelector('#form-master-pwd')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const oldPwd = container.querySelector('#cfg-old-master').value;
      const newPwd = container.querySelector('#cfg-new-master').value;

      const res = window.spaceAuth.updateMasterPassword(oldPwd, newPwd);
      this.showToast(res.message, !res.success);
      if (res.success) {
        container.querySelector('#cfg-old-master').value = '';
        container.querySelector('#cfg-new-master').value = '';
      }
    });

    container.querySelector('#btn-export-backup')?.addEventListener('click', () => {
      const backup = {
        version: '2.0',
        timetables: window.spaceStore.getTimetables(),
        albums: window.spaceStore.getAlbums(),
        resumes: window.spaceStore.getDualResumes(),
        authConfig: window.spaceStore.getAuthConfig(),
        exportAt: new Date().toISOString()
      };
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `OASIS_Backup_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    });

    container.querySelector('#btn-import-backup')?.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const data = JSON.parse(ev.target.result);
          if (data.timetables) window.spaceStore.saveTimetables(data.timetables);
          if (data.albums) window.spaceStore.saveAlbums(data.albums);
          // 修复双人简历备份恢复，支持新旧两种数据结构
          if (data.resumes) {
            if (data.resumes.qiuhui) window.spaceStore.saveResume('qiuhui', data.resumes.qiuhui);
            if (data.resumes.yan) window.spaceStore.saveResume('yan', data.resumes.yan);
          } else if (data.resume) {
            const person = data.resume.id || (data.resume.isMedicalCV ? 'qiuhui' : 'yan');
            window.spaceStore.saveResume(person, data.resume);
          }
          if (data.authConfig) window.spaceStore.saveAuthConfig(data.authConfig);
          this.showToast('备份恢复成功！页面即将刷新...');
          setTimeout(() => location.reload(), 1000);
        } catch (err) {
          this.showToast('备份文件解析失败', true);
        }
      };
      reader.readAsText(file);
    });
  }

  openMasterUpgradeModal() {
    const modalHtml = `
      <div class="overlay" id="modal-upgrade">
        <div class="sheet">
          <div class="sheet-head">
            <h3>🔑 验证主人身份以进入卧室</h3>
            <button class="logout" id="btn-close-upgrade" style="font-size:18px;">×</button>
          </div>
          <form id="form-upgrade" class="login-form">
            <div class="field">
              <label class="form-label">主人访问密码</label>
              <input type="password" class="input" id="upgrade-master-pwd" placeholder="请输入主人密码" required autofocus>
              <div id="upgrade-err-tip" class="fine" style="color: #a7464c; margin-top: 5px;"></div>
            </div>
            <div style="display:flex; justify-content:flex-end; gap:10px; margin-top:14px;">
              <button type="button" class="btn btn-outline" id="btn-cancel-upgrade">取消</button>
              <button type="submit" class="btn btn-primary">验证进入卧室</button>
            </div>
          </form>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);
    const modalEl = document.getElementById('modal-upgrade');
    const close = () => modalEl && modalEl.remove();

    modalEl.querySelector('#btn-close-upgrade').addEventListener('click', close);
    modalEl.querySelector('#btn-cancel-upgrade').addEventListener('click', close);

    modalEl.querySelector('#form-upgrade').addEventListener('submit', (e) => {
      e.preventDefault();
      const pwd = modalEl.querySelector('#upgrade-master-pwd').value;
      const res = window.spaceAuth.login(pwd);
      if (res.success && res.role === 'master') {
        close();
        this.showToast('欢迎进入卧室主人模式！');
        this.checkAuthState();
      } else {
        modalEl.querySelector('#upgrade-err-tip').innerText = '主人密码错误，请核对后重试。';
      }
    });
  }

  // Toast (复刻 USV Lab 原生悬浮气泡)
  showToast(message, bad = false) {
    const el = document.getElementById('toast');
    if (!el) return;
    el.textContent = message;
    el.className = `toast show ${bad ? 'bad' : ''}`;
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => {
      el.className = 'toast';
    }, 2800);
  }
}

window.spaceApp = new SpaceApp();
