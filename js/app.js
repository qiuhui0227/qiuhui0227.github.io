/**
 * OASIS | Qiuhui & Yan
 * 空间核心路由调度与应用控制器
 * 支持：持久化设备记住、男女主人独立密码鉴权、多访客通行证（不限数量）全功能管理
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
    const currentUser = window.spaceAuth.getCurrentUser();
    const roleBadge = document.getElementById('header-role-badge');
    const resumeTabBtn = document.getElementById('tab-btn-resume');
    const settingsTabBtn = document.getElementById('tab-btn-settings');
    const btnSwitchMaster = document.getElementById('btn-switch-master');
    const heroMetaMode = document.getElementById('hero-meta-mode');
    const heroTitle = document.getElementById('hero-title');
    const statEvents = document.getElementById('stat-today-events');
    const statAlbums = document.getElementById('stat-album-count');

    const today = window.spaceStore?.getTodayDate ? window.spaceStore.getTodayDate() : new Date().toISOString().split('T')[0];
    const timetables = window.spaceStore.getTimetables();
    const visibleEvents = timetables.filter(e => e.date === today && (isMaster || e.visibility === 'living_room' || e.visibility === 'living'));
    const allAlbums = window.spaceStore.getAlbums();
    const visibleAlbums = allAlbums.filter(a => isMaster || a.visibility === 'living_room');

    if (statEvents) statEvents.innerText = visibleEvents.length;
    if (statAlbums) statAlbums.innerText = visibleAlbums.length;

    if (isMaster) {
      const uName = currentUser?.name || '主人';
      const uAvatar = currentUser?.avatar || '🛏️';
      if (roleBadge) {
        roleBadge.innerHTML = `
          <span style="font-size:14px; margin-right:4px;">${uAvatar}</span>
          <span>${uName} (卧室全特权)</span>
        `;
      }
      if (heroTitle) heroTitle.innerText = 'Qiuhui & Yan 的时空印记';
      if (heroMetaMode) heroMetaMode.innerHTML = `<svg class="ico" viewBox="0 0 24 24"><path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></svg> 🛏️ 卧室私密模式 (${uName})`;
      if (resumeTabBtn) resumeTabBtn.style.display = 'flex';
      if (settingsTabBtn) settingsTabBtn.style.display = 'flex';
      if (btnSwitchMaster) btnSwitchMaster.style.display = 'none';
    } else {
      const gName = currentUser?.name || '来宾';
      const guestAcc = window.spaceAuth.currentGuestAccount;
      const remaining = guestAcc ? (guestAcc.usageLimit === -1 ? '无限次' : `${guestAcc.usageLimit - (guestAcc.usedCount || 0)}次`) : '受限';
      if (roleBadge) {
        roleBadge.innerHTML = `
          <span style="font-size:14px; margin-right:4px;">🛋️</span>
          <span>客厅来宾 · ${gName} (余: ${remaining})</span>
        `;
      }
      if (heroTitle) heroTitle.innerText = `欢迎来到 Qiuhui & Yan 的客厅 (${gName})`;
      if (heroMetaMode) heroMetaMode.innerHTML = `<svg class="ico" viewBox="0 0 24 24"><path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></svg> 🛋️ 客厅开放浏览`;
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
      if (confirm('确认锁定并退出空间吗？退出后需要重新输入通行码。')) {
        window.spaceAuth.logout();
        this.checkAuthState();
      }
    });

    document.getElementById('btn-switch-master')?.addEventListener('click', () => {
      this.openMasterUpgradeModal();
    });

    document.getElementById('header-cloud-badge')?.addEventListener('click', async () => {
      this.showToast('正在与 Cloudflare 全球云端双向同步...', false);
      await window.spaceStore.pullFromCloud(false);
    });
  }

  refreshCurrentModule() {
    const containers = {
      timetable: document.getElementById('content-timetable'),
      albums: document.getElementById('content-albums'),
      todo: document.getElementById('content-todo'),
      resume: document.getElementById('content-resume'),
      settings: document.getElementById('content-settings')
    };
    if (this.currentTab === 'timetable' && window.timetableModule) {
      window.timetableModule.render(containers.timetable);
    } else if (this.currentTab === 'albums' && window.albumsModule) {
      window.albumsModule.render(containers.albums);
    } else if (this.currentTab === 'todo' && window.todoModule) {
      window.todoModule.render(containers.todo);
    } else if (this.currentTab === 'resume' && window.resumeModule) {
      window.resumeModule.render(containers.resume);
    } else if (this.currentTab === 'settings') {
      this.renderSettings(containers.settings);
    }
  }

  switchTab(tabName) {
    if (tabName === 'todo') {
      if (window.todoModule) {
        window.todoModule.openTodoModal();
      }
      return;
    }

    const isMaster = window.spaceAuth.isMaster();

    // 严密隐私拦截：来宾禁止通过任何方式切换到简历生成器或空间管理
    if (!isMaster && (tabName === 'resume' || tabName === 'settings')) {
      this.openMasterUpgradeModal();
      this.showToast('🔑 履历档案与空间管理需凭主人密码访问，请输入密码进入卧室');
      return;
    }

    this.currentTab = tabName;

    document.querySelectorAll('.tab[data-tab]').forEach(link => {
      link.classList.toggle('active', link.dataset.tab === tabName);
    });

    const containers = {
      timetable: document.getElementById('content-timetable'),
      albums: document.getElementById('content-albums'),
      todo: document.getElementById('content-todo'),
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
    } else if (tabName === 'todo' && window.todoModule) {
      window.todoModule.render(containers.todo);
    } else if (tabName === 'resume' && window.resumeModule) {
      // 自动定位到当前登录人的专属简历
      if (!window.resumeModule.currentPerson) {
        if (window.spaceAuth.isYan()) {
          window.resumeModule.currentPerson = 'yan';
        } else if (window.spaceAuth.isQiuhui()) {
          window.resumeModule.currentPerson = 'qiuhui';
        }
      }
      if (!window.resumeModule.viewMode) {
        window.resumeModule.viewMode = 'bookshelf';
      }
      window.resumeModule.render(containers.resume);
    } else if (tabName === 'settings') {
      this.renderSettings(containers.settings);
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // 渲染管理设置中心
  renderSettings(container) {
    if (!container) return;
    if (!window.spaceAuth.isMaster()) {
      container.innerHTML = `
        <div class="settings-card" style="text-align:center; padding:40px 20px;">
          <div style="font-size:36px; margin-bottom:12px;">🔒</div>
          <h3 style="margin:0 0 8px; font-size:16px; color:#1e293b;">空间管理仅限卧室主人</h3>
          <p class="fine" style="margin:0; color:#64748b;">客厅来宾无权查看或修改空间安全规则与通行密码。</p>
        </div>
      `;
      return;
    }

    const config = window.spaceStore.getAuthConfig();
    const guestAccounts = Array.isArray(config.guestAccounts) ? config.guestAccounts : [];
    const currentUser = window.spaceAuth.getCurrentUser();

    container.innerHTML = `
      <div class="settings-wrap">
        <!-- 极简标头 -->
        <div class="settings-header">
          <div class="settings-header-left">
            <h2 class="settings-title">⚙️ 空间管理</h2>
            <p class="settings-subtitle">
              当前身份：<strong>${this.escapeHtml(currentUser?.avatar || '')} ${this.escapeHtml(currentUser?.name || '主人')}</strong> · 活跃访客码：<strong>${guestAccounts.length}</strong> 个
            </p>
          </div>
          <div class="settings-header-actions">
            <button class="btn btn-primary btn-sm" id="btn-create-guest-acc-top">
              <svg class="ico" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>
              添加访客码
            </button>
          </div>
        </div>

        <!-- 1. 云端实时同步 -->
        <div class="settings-card">
          <div class="settings-card-head">
            <div>
              <div class="settings-card-title">
                <span>☁️ 云端同步</span>
                <span class="pill good" style="font-size:11px;">🟢 实时双向互通</span>
              </div>
              <p class="settings-card-desc" style="margin-top:4px;">
                小黑板日程、时光相簿、三餐手帐与愿望清单全自动多端互通，换设备永不丢失。
              </p>
            </div>
            <div style="display:flex; gap:8px;">
              <button type="button" class="btn btn-outline btn-sm" id="btn-cloud-pull-now">🔄 立即拉取</button>
              <button type="button" class="btn btn-primary btn-sm" id="btn-cloud-push-now">⬆️ 备份到云端</button>
            </div>
          </div>
        </div>

        <!-- 2. 手机桌面 App (PWA) -->
        <div class="settings-card">
          <div class="settings-card-head">
            <div>
              <div class="settings-card-title">
                <span>📱 手机专属 App</span>
                <span class="pill good" style="font-size:11px;">独立全屏运行</span>
              </div>
              <p class="settings-card-desc" style="margin-top:4px;">
                添加到手机桌面，即可拥有无边框原生 App 体验，秒开流畅。
              </p>
            </div>
            <div id="pwa-install-btn-container" style="display:flex; gap:8px;">
              <button type="button" class="btn btn-primary btn-sm" id="btn-trigger-pwa-install" style="display:none;">
                📲 安装到手机桌面
              </button>
            </div>
          </div>

          <div class="settings-pwa-grid">
            <div class="settings-pwa-item">
              <strong>🍎 苹果 iPhone (Safari)</strong><br>
              点击底部分享 ⎋ → 选择「添加到主屏幕」即可
            </div>
            <div class="settings-pwa-item">
              <strong>🤖 安卓手机 (Chrome / 浏览器)</strong><br>
              点击菜单 ⋮ → 选择「安装应用」或「添加到主屏幕」
            </div>
          </div>
        </div>

        <!-- 3. 访客通行码 -->
        <div class="settings-card">
          <div class="settings-card-head">
            <div>
              <div class="settings-card-title">
                <span>🏷️ 访客通行码</span>
                <span class="pill" style="font-size:11px;">仅限客厅公开内容</span>
              </div>
              <p class="settings-card-desc" style="margin-top:4px;">
                为亲友分配专属通行码，仅可浏览客厅公开相册与排期，无法查看私密内容。
              </p>
            </div>
            <button class="btn btn-outline btn-sm" id="btn-create-guest-acc">
              <svg class="ico" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>
              添加访客码
            </button>
          </div>

          <div class="guest-account-list">
            ${guestAccounts.length === 0 ? `
              <div class="fine" style="padding:14px; background:#f8fafc; border-radius:8px; text-align:center; color:#94a3b8;">
                暂无访客码，可点击右上角添加。
              </div>
            ` : guestAccounts.map(acc => {
              const remaining = acc.usageLimit === -1 ? '无限次' : `${Math.max(0, acc.usageLimit - (acc.usedCount || 0))} 次`;
              return `
                <div class="guest-item-card">
                  <div class="guest-item-info">
                    <div class="guest-item-title">
                      <span>🏷️ ${this.escapeHtml(acc.name)}</span>
                      <span class="guest-item-code">${this.escapeHtml(acc.code)}</span>
                    </div>
                    <div class="guest-item-meta">
                      <span>已用 <strong>${acc.usedCount || 0}</strong> 次 / 限额 <strong>${acc.usageLimit === -1 ? '无限次' : acc.usageLimit + '次'}</strong> (余 <strong style="color:#16a34a;">${remaining}</strong>)</span>
                      <span>有效期至: <strong>${acc.expiryDate || '永久'}</strong></span>
                    </div>
                  </div>
                  <div style="display:flex; gap:6px;">
                    <button type="button" class="btn btn-outline btn-xs btn-reset-guest-acc" data-id="${acc.id}">🔄 重置次数</button>
                    <button type="button" class="btn btn-outline btn-xs btn-edit-guest-acc" data-id="${acc.id}">✏️ 编辑</button>
                    <button type="button" class="btn btn-danger btn-xs btn-del-guest-acc" data-id="${acc.id}">🗑️ 删除</button>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <!-- 4. 主人专属密码 -->
        <div class="settings-card">
          <div class="settings-card-head">
            <div>
              <div class="settings-card-title">
                <span>🔑 空间主人密码</span>
              </div>
              <p class="settings-card-desc" style="margin-top:4px;">
                王岩与杜秋慧各持独立专属钥匙，互不影响。
              </p>
            </div>
            <span class="pill good" style="font-size:11px;">当前：${this.escapeHtml(currentUser?.avatar || '')} ${this.escapeHtml(currentUser?.name || '')}</span>
          </div>

          <div class="settings-pwd-grid">
            <!-- 王岩密码 -->
            <div class="settings-pwd-card">
              <div class="settings-pwd-title">
                <span>👦 王岩的主人密码</span>
                ${currentUser?.role === 'yan' ? '<span class="pill good" style="font-size:10px; padding:2px 6px;">当前登录</span>' : ''}
              </div>
              <form id="form-pwd-yan">
                <div class="field" style="margin:6px 0;">
                  <label>原密码</label>
                  <input type="password" class="input sm" id="old-pwd-yan" placeholder="输入当前密码" required>
                </div>
                <div class="field" style="margin:6px 0;">
                  <label>新密码</label>
                  <input type="password" class="input sm" id="new-pwd-yan" placeholder="至少4位新密码" required>
                </div>
                <div style="display:flex; justify-content:flex-end; margin-top:10px;">
                  <button type="submit" class="btn btn-primary btn-sm">更新密码</button>
                </div>
              </form>
            </div>

            <!-- 秋慧密码 -->
            <div class="settings-pwd-card">
              <div class="settings-pwd-title">
                <span>👧 杜秋慧的主人密码</span>
                ${currentUser?.role === 'qiuhui' ? '<span class="pill good" style="font-size:10px; padding:2px 6px;">当前登录</span>' : ''}
              </div>
              <form id="form-pwd-qiuhui">
                <div class="field" style="margin:6px 0;">
                  <label>原密码</label>
                  <input type="password" class="input sm" id="old-pwd-qiuhui" placeholder="输入当前密码" required>
                </div>
                <div class="field" style="margin:6px 0;">
                  <label>新密码</label>
                  <input type="password" class="input sm" id="new-pwd-qiuhui" placeholder="至少4位新密码" required>
                </div>
                <div style="display:flex; justify-content:flex-end; margin-top:10px;">
                  <button type="submit" class="btn btn-primary btn-sm">更新密码</button>
                </div>
              </form>
            </div>
          </div>
        </div>

        <!-- 5. 数据离线备份与恢复 -->
        <div class="settings-card">
          <div class="settings-card-head">
            <div>
              <div class="settings-card-title">
                <span>💾 数据备份与恢复</span>
              </div>
              <p class="settings-card-desc" style="margin-top:4px;">
                导出或导入完整空间数据（包含日程、相册、手帐、心愿、履历与权限配置）。
              </p>
            </div>
            <div style="display:flex; gap:8px; flex-wrap:wrap;">
              <button class="btn btn-outline btn-sm" id="btn-export-backup">📥 导出备份 (JSON)</button>
              <label class="btn btn-outline btn-sm" style="cursor:pointer; margin:0;">
                <input type="file" id="btn-import-backup" accept=".json" style="display:none;">
                📤 导入恢复
              </label>
            </div>
          </div>
        </div>
      </div>
    `;

    // 绑定云端同步按钮事件
    container.querySelector('#btn-cloud-pull-now')?.addEventListener('click', async () => {
      this.showToast('正在从云端拉取数据...', false);
      await window.spaceStore.pullFromCloud(false);
      this.renderSettings(container);
      this.showToast('云端数据拉取并同步完成！');
    });

    container.querySelector('#btn-cloud-push-now')?.addEventListener('click', async () => {
      this.showToast('正在向云端备份数据...', false);
      await window.spaceStore.pushToCloud(false);
      this.renderSettings(container);
      this.showToast('本地数据已全量备份至云端！');
    });

    // 绑定 PWA 独立 App 安装引导
    const pwaInstallBtn = container.querySelector('#btn-trigger-pwa-install');
    if (pwaInstallBtn) {
      if (window.deferredPWAInstallPrompt) {
        pwaInstallBtn.style.display = 'inline-flex';
        pwaInstallBtn.addEventListener('click', async () => {
          const promptEvent = window.deferredPWAInstallPrompt;
          if (promptEvent) {
            promptEvent.prompt();
            const choice = await promptEvent.userChoice;
            console.log('[PWA] User choice:', choice);
            window.deferredPWAInstallPrompt = null;
            pwaInstallBtn.style.display = 'none';
          }
        });
      }
      window.addEventListener('pwa-installable', () => {
        pwaInstallBtn.style.display = 'inline-flex';
      });
    }

    // 绑定访客账号管理事件
    container.querySelector('#btn-create-guest-acc-top')?.addEventListener('click', () => {
      this.openGuestAccountModal();
    });
    container.querySelector('#btn-create-guest-acc')?.addEventListener('click', () => {
      this.openGuestAccountModal();
    });

    container.querySelectorAll('.btn-reset-guest-acc').forEach(btn => {
      btn.addEventListener('click', () => {
        const res = window.spaceAuth.resetGuestAccountCount(btn.dataset.id);
        this.showToast(res.message, !res.success);
        this.renderSettings(container);
      });
    });

    container.querySelectorAll('.btn-edit-guest-acc').forEach(btn => {
      btn.addEventListener('click', () => {
        const acc = guestAccounts.find(x => x.id === btn.dataset.id);
        if (acc) this.openGuestAccountModal(acc);
      });
    });

    container.querySelectorAll('.btn-del-guest-acc').forEach(btn => {
      btn.addEventListener('click', () => {
        if (confirm('确认删除该访客通行账号吗？删除后该通行码将无法进入空间。')) {
          const res = window.spaceAuth.deleteGuestAccount(btn.dataset.id);
          this.showToast(res.message, !res.success);
          this.renderSettings(container);
        }
      });
    });

    // 绑定密码修改事件
    container.querySelector('#form-pwd-yan')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const oldPwd = container.querySelector('#old-pwd-yan').value;
      const newPwd = container.querySelector('#new-pwd-yan').value;
      const res = window.spaceAuth.updateUserPassword('yan', oldPwd, newPwd);
      this.showToast(res.message, !res.success);
      if (res.success) {
        container.querySelector('#old-pwd-yan').value = '';
        container.querySelector('#new-pwd-yan').value = '';
      }
    });

    container.querySelector('#form-pwd-qiuhui')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const oldPwd = container.querySelector('#old-pwd-qiuhui').value;
      const newPwd = container.querySelector('#new-pwd-qiuhui').value;
      const res = window.spaceAuth.updateUserPassword('qiuhui', oldPwd, newPwd);
      this.showToast(res.message, !res.success);
      if (res.success) {
        container.querySelector('#old-pwd-qiuhui').value = '';
        container.querySelector('#new-pwd-qiuhui').value = '';
      }
    });

    // 备份导出与还原 (包含全模块：日程、相册、手帐、心愿、简历、账号配置)
    container.querySelector('#btn-export-backup')?.addEventListener('click', () => {
      const backup = {
        version: '4.0',
        timetables: window.spaceStore.getTimetables(),
        albums: window.spaceStore.getAlbums(),
        meals: window.spaceStore.getMeals ? window.spaceStore.getMeals() : [],
        todos: window.spaceStore.getTodos ? window.spaceStore.getTodos() : [],
        resumeBooks: window.spaceStore.getResumeBooks(),
        resumes: window.spaceStore.getDualResumes(),
        authConfig: window.spaceStore.getAuthConfig(),
        exportAt: new Date().toISOString()
      };
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `iqiuqiu_backup_${new Date().toISOString().split('T')[0]}.json`;
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
          if (data.meals && window.spaceStore.saveMeals) window.spaceStore.saveMeals(data.meals);
          if (data.todos && window.spaceStore.saveTodos) window.spaceStore.saveTodos(data.todos);
          if (data.resumeBooks) {
            window.spaceStore.saveResumeBooks(data.resumeBooks);
          } else if (data.resumes) {
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

  // 创建/编辑访客通行证弹窗
  openGuestAccountModal(acc = null) {
    const isEdit = !!acc;
    const modalHtml = `
      <div class="overlay" id="modal-guest-acc">
        <div class="sheet">
          <div class="sheet-head">
            <h3>${isEdit ? '✏️ 编辑访客通行证' : '➕ 创建新访客通行证'}</h3>
            <button class="logout" id="btn-close-guest-modal" style="font-size:18px;">×</button>
          </div>
          <form id="form-guest-acc" class="login-form">
            <div class="field">
              <label class="form-label">访客名称 / 备注说明</label>
              <input type="text" class="input" name="name" placeholder="例如：大学同学、亲友聚会、好友专属" value="${acc ? this.escapeHtml(acc.name) : ''}" required>
            </div>
            <div class="field">
              <label class="form-label">专属访问通行码</label>
              <input type="text" class="input" name="code" placeholder="例如：friends2026、guest999" value="${acc ? this.escapeHtml(acc.code) : ''}" required>
              <div class="fine" style="color:#68889c; margin-top:4px;">访客在门禁页面输入此码即可入座客厅</div>
            </div>
            <div class="form-row">
              <div class="field">
                <label class="form-label">最大允许访问次数 (-1 为无限次)</label>
                <input type="number" class="input" name="usageLimit" value="${acc ? (acc.usageLimit ?? 20) : 20}" required>
              </div>
              <div class="field">
                <label class="form-label">有效截止日期</label>
                <input type="date" class="input" name="expiryDate" value="${acc ? (acc.expiryDate || '2027-12-31') : '2027-12-31'}" required>
              </div>
            </div>
            <div style="display:flex; justify-content:flex-end; gap:10px; margin-top:16px;">
              <button type="button" class="btn btn-outline" id="btn-cancel-guest-modal">取消</button>
              <button type="submit" class="btn btn-primary">${isEdit ? '保存修改' : '确认创建'}</button>
            </div>
          </form>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);
    const modalEl = document.getElementById('modal-guest-acc');
    const close = () => modalEl && modalEl.remove();

    modalEl.querySelector('#btn-close-guest-modal').addEventListener('click', close);
    modalEl.querySelector('#btn-cancel-guest-modal').addEventListener('click', close);
    modalEl.addEventListener('click', (e) => {
      if (e.target === modalEl) close();
    });

    modalEl.querySelector('#form-guest-acc').addEventListener('submit', (e) => {
      e.preventDefault();
      const form = e.target;
      const name = form.name.value;
      const code = form.code.value;
      const usageLimit = form.usageLimit.value;
      const expiryDate = form.expiryDate.value;

      let res;
      if (isEdit) {
        res = window.spaceAuth.updateGuestAccount(acc.id, { name, code, usageLimit, expiryDate });
      } else {
        res = window.spaceAuth.createGuestAccount({ name, code, usageLimit, expiryDate });
      }

      this.showToast(res.message, !res.success);
      if (res.success) {
        close();
        const settingsContainer = document.getElementById('content-settings');
        if (settingsContainer) this.renderSettings(settingsContainer);
      }
    });
  }

  // 卧室主人升级验证弹窗 (王岩 adminwy 或 秋慧 adminqh 均可解锁)
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
    modalEl.addEventListener('click', (e) => {
      if (e.target === modalEl) close();
    });

    modalEl.querySelector('#form-upgrade').addEventListener('submit', (e) => {
      e.preventDefault();
      const pwd = modalEl.querySelector('#upgrade-master-pwd').value;
      const res = window.spaceAuth.login(pwd);
      if (res.success && res.role !== 'guest') {
        close();
        this.showToast(`欢迎进入卧室主人模式，${res.user.name}！已为您记住此设备。`);
        this.checkAuthState();
      } else {
        modalEl.querySelector('#upgrade-err-tip').innerText = '主人密码错误，请核对后重试。';
      }
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

  // Toast
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
