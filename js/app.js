/**
 * OASIS | Qiuhui & Yan
 * 空间核心路由调度与应用控制器
 */

class SpaceApp {
  constructor() {
    this.currentTab = 'timetable'; // 'timetable' | 'albums' | 'resume' | 'settings'
    this.init();
  }

  init() {
    document.addEventListener('DOMContentLoaded', () => {
      this.checkAuthState();
      this.bindGlobalEvents();
    });
  }

  // 检查认证状态，未认证展示门禁锁屏，已认证展示主空间
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
      if (mainApp) mainApp.style.display = 'flex';
      this.renderAppHeader();
      this.switchTab(this.currentTab);
    }
  }

  // 绑定门禁密码输入事件
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
          this.showToast(res.message, 'success');
          this.checkAuthState();
        } else {
          tipMsg.innerText = res.message;
          inputPwd.classList.add('shake');
          setTimeout(() => inputPwd.classList.remove('shake'), 500);
        }
      };
    }
  }

  // 渲染顶部导航状态与身份徽章
  renderAppHeader() {
    const isMaster = window.spaceAuth.isMaster();
    const roleBadge = document.getElementById('header-role-badge');
    const resumeTabBtn = document.getElementById('nav-tab-resume');
    const settingsTabBtn = document.getElementById('nav-tab-settings');
    const mobileResumeTab = document.getElementById('mobile-nav-resume');
    const mobileSettingsTab = document.getElementById('mobile-nav-settings');
    const btnSwitchMaster = document.getElementById('btn-switch-master');

    const config = window.spaceStore.getAuthConfig();

    if (isMaster) {
      if (roleBadge) {
        roleBadge.className = 'badge badge-master';
        roleBadge.innerHTML = '🛏️ 卧室模式 · 主人特权';
      }
      if (resumeTabBtn) resumeTabBtn.style.display = 'inline-flex';
      if (settingsTabBtn) settingsTabBtn.style.display = 'inline-flex';
      if (mobileResumeTab) mobileResumeTab.style.display = 'flex';
      if (mobileSettingsTab) mobileSettingsTab.style.display = 'flex';
      if (btnSwitchMaster) btnSwitchMaster.style.display = 'none';
    } else {
      // 来宾模式
      const remaining = config.guestUsageLimit === -1 ? '无限次' : `${config.guestUsageLimit - config.guestUsedCount}次`;
      if (roleBadge) {
        roleBadge.className = 'badge badge-guest';
        roleBadge.innerHTML = `🛋️ 客厅来宾模式 (剩余: ${remaining} | 有效期至: ${config.guestExpiryDate})`;
      }
      // 来宾隐藏简历编辑器与设置中心
      if (resumeTabBtn) resumeTabBtn.style.display = 'none';
      if (settingsTabBtn) settingsTabBtn.style.display = 'none';
      if (mobileResumeTab) mobileResumeTab.style.display = 'none';
      if (mobileSettingsTab) mobileSettingsTab.style.display = 'none';
      if (btnSwitchMaster) btnSwitchMaster.style.display = 'inline-flex';
    }
  }

  // 绑定全局导航与按钮事件
  bindGlobalEvents() {
    // 桌面端 Tab 导航
    document.querySelectorAll('.nav-link[data-tab]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        this.switchTab(btn.dataset.tab);
      });
    });

    // 移动端底部 Tab 导航
    document.querySelectorAll('.mobile-nav-item[data-tab]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        this.switchTab(btn.dataset.tab);
      });
    });

    // 退出锁屏按钮
    document.getElementById('btn-logout')?.addEventListener('click', () => {
      if (confirm('确认锁定并退出空间吗？')) {
        window.spaceAuth.logout();
        this.checkAuthState();
      }
    });

    // 来宾切换为主人的快捷弹窗
    document.getElementById('btn-switch-master')?.addEventListener('click', () => {
      this.openMasterUpgradeModal();
    });
  }

  // 切换板块 Tab
  switchTab(tabName) {
    this.currentTab = tabName;

    // 更新导航高亮
    document.querySelectorAll('.nav-link[data-tab]').forEach(link => {
      link.classList.toggle('active', link.dataset.tab === tabName);
    });
    document.querySelectorAll('.mobile-nav-item[data-tab]').forEach(link => {
      link.classList.toggle('active', link.dataset.tab === tabName);
    });

    // 切换内容区域
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

    // 触发各个子模块的渲染
    if (tabName === 'timetable' && window.timetableModule) {
      window.timetableModule.render(containers.timetable);
    } else if (tabName === 'albums' && window.albumsModule) {
      window.albumsModule.render(containers.albums);
    } else if (tabName === 'resume' && window.resumeModule) {
      window.resumeModule.render(containers.resume);
    } else if (tabName === 'settings') {
      this.renderSettings(containers.settings);
    }

    // 滚动回顶部
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // 渲染管理设置中心 (仅主人)
  renderSettings(container) {
    if (!container) return;
    const config = window.spaceStore.getAuthConfig();

    container.innerHTML = `
      <div class="settings-dashboard animate-fade">
        <div class="settings-header card-glass">
          <h2>⚙️ 空间后台控制中心</h2>
          <p class="text-muted">管理卧室与客厅双模安全策略、配置来宾通行密码与数据备份。</p>
        </div>

        <div class="settings-grid">
          <!-- 1. 客厅来宾门禁规则管理 -->
          <div class="settings-card card-glass">
            <div class="card-header-styled">
              <span class="icon">🛋️</span>
              <h3>客厅来宾通行证配置</h3>
            </div>
            <p class="form-tip">输入该密码的访客可以进入客厅，仅能翻阅设置了“客厅开放”的相册和公开时刻事项。</p>
            <form id="form-guest-config" class="settings-form">
              <div class="form-group">
                <label>来宾访问密码</label>
                <input type="text" class="input" id="cfg-guest-pwd" value="${config.guestPassword || 'guest888'}" required>
              </div>

              <div class="form-row">
                <div class="form-group flex-1">
                  <label>最大允许访问次数 (-1 为无限次)</label>
                  <input type="number" class="input" id="cfg-guest-limit" value="${config.guestUsageLimit ?? 20}" required>
                </div>
                <div class="form-group flex-1">
                  <label>已使用次数</label>
                  <div class="input-addon-wrap">
                    <input type="text" class="input" id="cfg-guest-used" value="${config.guestUsedCount || 0}" disabled>
                    <button type="button" class="btn btn-xs btn-outline" id="btn-reset-guest-count">清零重置</button>
                  </div>
                </div>
              </div>

              <div class="form-group">
                <label>密码有效截止日期</label>
                <input type="date" class="input" id="cfg-guest-expiry" value="${config.guestExpiryDate || '2027-12-31'}" required>
              </div>

              <button type="submit" class="btn btn-primary">保存来宾规则</button>
            </form>
          </div>

          <!-- 2. 主人密码修改 (卧室私密空间) -->
          <div class="settings-card card-glass">
            <div class="card-header-styled">
              <span class="icon">🛏️</span>
              <h3>修改主人密码 (卧室)</h3>
            </div>
            <p class="form-tip">主人密码拥有空间绝对控制权，可查看私密相册、全量时刻表、编辑简历和设置后台。</p>
            <form id="form-master-pwd" class="settings-form">
              <div class="form-group">
                <label>原主人密码</label>
                <input type="password" class="input" id="cfg-old-master" placeholder="初始为 admin" required>
              </div>
              <div class="form-group">
                <label>设置新主人密码</label>
                <input type="password" class="input" id="cfg-new-master" placeholder="至少4位密码" required>
              </div>
              <button type="submit" class="btn btn-primary">更新主人密码</button>
            </form>
          </div>

          <!-- 3. 全站数据备份与恢复 -->
          <div class="settings-card card-glass flex-full">
            <div class="card-header-styled">
              <span class="icon">💾</span>
              <h3>全站数据安全备份与迁移</h3>
            </div>
            <p class="form-tip">随时将时刻表、相册元数据、简历与配置一键打包为 JSON 离线备份，永不丢失。</p>
            <div class="backup-actions-row">
              <button class="btn btn-outline" id="btn-export-backup">
                📥 导出完整空间备份 (JSON)
              </button>
              <label class="btn btn-outline">
                <input type="file" id="btn-import-backup" accept=".json" style="display:none;">
                📤 从备份文件恢复
              </label>
            </div>
          </div>
        </div>
      </div>
    `;

    // 绑定后台表单事件
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
      this.showToast(res.message, res.success ? 'success' : 'error');
      this.renderAppHeader();
    });

    // 清零来宾次数
    container.querySelector('#btn-reset-guest-count')?.addEventListener('click', () => {
      window.spaceAuth.updateGuestConfig({ resetCount: true });
      container.querySelector('#cfg-guest-used').value = 0;
      this.showToast('来宾使用次数已清零重置！', 'success');
      this.renderAppHeader();
    });

    // 修改主人密码
    container.querySelector('#form-master-pwd')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const oldPwd = container.querySelector('#cfg-old-master').value;
      const newPwd = container.querySelector('#cfg-new-master').value;

      const res = window.spaceAuth.updateMasterPassword(oldPwd, newPwd);
      this.showToast(res.message, res.success ? 'success' : 'error');
      if (res.success) {
        container.querySelector('#cfg-old-master').value = '';
        container.querySelector('#cfg-new-master').value = '';
      }
    });

    // 导出备份
    container.querySelector('#btn-export-backup')?.addEventListener('click', () => {
      const backup = {
        timetables: window.spaceStore.getTimetables(),
        albums: window.spaceStore.getAlbums(),
        resume: window.spaceStore.getResume(),
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

    // 导入恢复备份
    container.querySelector('#btn-import-backup')?.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const data = JSON.parse(ev.target.result);
          if (data.timetables) window.spaceStore.saveTimetables(data.timetables);
          if (data.albums) window.spaceStore.saveAlbums(data.albums);
          if (data.resume) window.spaceStore.saveResume(data.resume);
          if (data.authConfig) window.spaceStore.saveAuthConfig(data.authConfig);
          this.showToast('备份恢复成功！页面即将刷新...', 'success');
          setTimeout(() => location.reload(), 1200);
        } catch (err) {
          this.showToast('备份文件解析失败，请检查文件格式。', 'error');
        }
      };
      reader.readAsText(file);
    });
  }

  // 来宾升级为主人弹窗
  openMasterUpgradeModal() {
    const modalHtml = `
      <div class="modal-overlay" id="modal-upgrade">
        <div class="modal-card card-glass animate-pop">
          <div class="modal-header">
            <h3>🔑 验证主人身份以进入卧室</h3>
            <button class="btn-close" id="btn-close-upgrade">×</button>
          </div>
          <form id="form-upgrade" class="modal-body">
            <div class="form-group">
              <label>请输入主人密码 (默认 admin)</label>
              <input type="password" class="input" id="upgrade-master-pwd" placeholder="请输入密码" required autofocus>
              <span class="form-error" id="upgrade-err-tip"></span>
            </div>
            <div class="modal-footer">
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
        this.showToast('已成功切换至卧室主人模式！', 'success');
        this.checkAuthState();
      } else {
        modalEl.querySelector('#upgrade-err-tip').innerText = '主人密码错误，请核对后重试。';
      }
    });
  }

  // 消息提示气泡
  showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type} animate-pop`;
    toast.innerText = message;
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.classList.add('fade-out');
      setTimeout(() => toast.remove(), 400);
    }, 2800);
  }
}

window.spaceApp = new SpaceApp();
