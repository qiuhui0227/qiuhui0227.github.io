/**
 * OASIS | Qiuhui & Yan
 * 认证与权限控制系统 (客厅 / 卧室双模体系)
 * 
 * 全新功能特性：
 * 1. 免退出/记住设备：输入密码后直接永久持久化至 localStorage，以后再访问此设备无需重新输入。
 * 2. 男女主人独立密码与身份区分：
 *    - 男主王岩：初始密码 adminwy，登录身份 'yan'
 *    - 女主杜秋慧：初始密码 adminqh，登录身份 'qiuhui'
 *    - 两人均拥有卧室全特权，并可各自独立修改各自的密码。
 * 3. 访客通行码体系（支持创建不限数量独立访客账号）：
 *    - 支持为不同群体（亲朋、同学、同事等）配置独立名称、通行码、最大次数与有效期。
 */

class SpaceAuth {
  constructor() {
    this.SESSION_KEY = 'oasis_current_session';
    this.currentRole = null; // 'yan' | 'qiuhui' | 'guest' | null
    this.currentGuestAccount = null;
    this.loadSession();
  }

  // 加载当前登录状态（持久化设备记住）
  loadSession() {
    try {
      const saved = localStorage.getItem(this.SESSION_KEY) || sessionStorage.getItem(this.SESSION_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.role === 'yan' || parsed.role === 'qiuhui') {
          this.currentRole = parsed.role;
        } else if (parsed.role === 'master') {
          this.currentRole = 'yan'; // 历史旧会话平滑映射为王岩
        } else if (parsed.role === 'guest') {
          // 实时校验访客账号有效性与存在状态
          const config = window.spaceStore ? window.spaceStore.getAuthConfig() : null;
          const accounts = config?.guestAccounts || [];
          const account = accounts.find(a => a.id === parsed.guestId);
          if (account) {
            const todayStr = new Date().toISOString().split('T')[0];
            const isExpired = account.expiryDate && todayStr > account.expiryDate;
            const isExhausted = account.usageLimit !== -1 && account.usageLimit !== undefined && account.usedCount > account.usageLimit;
            if (isExpired || isExhausted) {
              this.logout();
              return;
            }
            this.currentRole = 'guest';
            this.currentGuestAccount = account;
          } else if (accounts.length > 0) {
            // 若没有记录特定 guestId 但有默认访客账号
            this.currentRole = 'guest';
            this.currentGuestAccount = accounts[0];
          } else {
            this.logout();
          }
        }
      }
    } catch (e) {
      this.currentRole = null;
      this.currentGuestAccount = null;
    }
  }

  // 保存当前会话（直接记住设备，永续免退）
  saveSession(role, meta = {}) {
    this.currentRole = role;
    this.currentGuestAccount = meta.account || null;

    const sessionData = {
      role: role,
      guestId: meta.guestId || null,
      guestName: meta.guestName || null,
      loginTime: new Date().toISOString()
    };

    // 记住设备：写入 localStorage，关浏览器或重启均保持登录状态
    localStorage.setItem(this.SESSION_KEY, JSON.stringify(sessionData));
    sessionStorage.setItem(this.SESSION_KEY, JSON.stringify(sessionData));
  }

  // 登出 / 锁屏
  logout() {
    this.currentRole = null;
    this.currentGuestAccount = null;
    sessionStorage.removeItem(this.SESSION_KEY);
    localStorage.removeItem(this.SESSION_KEY);
  }

  // 是否已登录
  isAuthenticated() {
    return this.currentRole !== null;
  }

  // 是否为主机（卧室特权：王岩或杜秋慧）
  isMaster() {
    return this.currentRole === 'yan' || this.currentRole === 'qiuhui' || this.currentRole === 'master';
  }

  isYan() {
    return this.currentRole === 'yan' || this.currentRole === 'master';
  }

  isQiuhui() {
    return this.currentRole === 'qiuhui';
  }

  isGuest() {
    return this.currentRole === 'guest';
  }

  // 获取当前登录人详细画像
  getCurrentUser() {
    if (this.isYan()) {
      return {
        id: 'yan',
        name: '王岩',
        role: 'yan',
        isMaster: true,
        avatar: '👦',
        title: '空间主人 · 王岩'
      };
    } else if (this.isQiuhui()) {
      return {
        id: 'qiuhui',
        name: '杜秋慧',
        role: 'qiuhui',
        isMaster: true,
        avatar: '👧',
        title: '空间主人 · 杜秋慧'
      };
    } else if (this.isGuest()) {
      const gName = this.currentGuestAccount?.name || '受邀访客';
      return {
        id: this.currentGuestAccount?.id || 'guest',
        name: gName,
        role: 'guest',
        isMaster: false,
        avatar: '🛋️',
        title: `客厅来宾 (${gName})`
      };
    }
    return null;
  }

  // 验证输入密码并判定身份 (王岩 adminwy / 秋慧 adminqh / 任意访客通行码)
  login(password) {
    const config = window.spaceStore.getAuthConfig();
    const cleanPwd = (password || '').trim();

    // 1. 男主王岩密码验证
    const yanPwd = config.masterPasswords?.yan || 'adminwy';
    if (cleanPwd === yanPwd) {
      this.saveSession('yan');
      return {
        success: true,
        role: 'yan',
        user: this.getCurrentUser(),
        message: '欢迎回到专属卧室，王岩！已为您记住本设备。'
      };
    }

    // 2. 女主秋慧密码验证
    const qhPwd = config.masterPasswords?.qiuhui || 'adminqh';
    if (cleanPwd === qhPwd) {
      this.saveSession('qiuhui');
      return {
        success: true,
        role: 'qiuhui',
        user: this.getCurrentUser(),
        message: '欢迎回到专属卧室，秋慧！已为您记住本设备。'
      };
    }

    // 3. 访客多账号遍历匹配
    const accounts = Array.isArray(config.guestAccounts) ? config.guestAccounts : [];
    const matchedGuest = accounts.find(a => a.code === cleanPwd);

    if (matchedGuest) {
      const todayStr = new Date().toISOString().split('T')[0];

      // A. 校验有效期
      if (matchedGuest.expiryDate && todayStr > matchedGuest.expiryDate) {
        return {
          success: false,
          role: null,
          message: `访客通行码【${matchedGuest.name}】已于 ${matchedGuest.expiryDate} 到期，请联系空间主人。`
        };
      }

      // B. 校验剩余次数
      if (matchedGuest.usageLimit !== -1 && matchedGuest.usageLimit !== undefined) {
        if (matchedGuest.usedCount >= matchedGuest.usageLimit) {
          return {
            success: false,
            role: null,
            message: `访客通行码【${matchedGuest.name}】的使用次数已达上限（${matchedGuest.usageLimit}次），请联系主人重置。`
          };
        }
        // 累加已使用次数
        matchedGuest.usedCount = (matchedGuest.usedCount || 0) + 1;
        window.spaceStore.saveAuthConfig(config);
      }

      this.saveSession('guest', {
        guestId: matchedGuest.id,
        guestName: matchedGuest.name,
        account: matchedGuest
      });

      const remaining = matchedGuest.usageLimit === -1 ? '无限次' : `${matchedGuest.usageLimit - matchedGuest.usedCount} 次`;
      return {
        success: true,
        role: 'guest',
        user: this.getCurrentUser(),
        message: `欢迎来到客厅【${matchedGuest.name}】！剩余可访问次数：${remaining}，已记住此设备。`
      };
    }

    return {
      success: false,
      role: null,
      message: '通行码不正确，请重新输入。'
    };
  }

  // 男女主人修改各自的密码
  updateUserPassword(targetUser, oldPwd, newPwd) {
    if (!this.isMaster()) {
      return { success: false, message: '权限不足：仅空间主人可修改密码。' };
    }
    if (targetUser !== 'yan' && targetUser !== 'qiuhui') {
      return { success: false, message: '无效的目标用户。' };
    }

    const config = window.spaceStore.getAuthConfig();
    if (!config.masterPasswords) {
      config.masterPasswords = { yan: 'adminwy', qiuhui: 'adminqh' };
    }

    const currentSavedPwd = config.masterPasswords[targetUser];
    if (oldPwd !== currentSavedPwd) {
      return {
        success: false,
        message: `原密码验证错误，无法修改${targetUser === 'yan' ? '王岩' : '杜秋慧'}的密码。`
      };
    }

    if (!newPwd || newPwd.length < 4) {
      return { success: false, message: '新密码长度至少需要4位。' };
    }

    config.masterPasswords[targetUser] = newPwd;
    window.spaceStore.saveAuthConfig(config);

    const userName = targetUser === 'yan' ? '王岩' : '杜秋慧';
    return {
      success: true,
      message: `${userName}的主人密码已成功更新，请牢记新密码！`
    };
  }

  // --- 访客多账号管理方法 ---
  createGuestAccount({ name, code, usageLimit = 20, expiryDate = '2027-12-31' }) {
    if (!this.isMaster()) return { success: false, message: '权限不足。' };

    const cleanName = (name || '').trim();
    const cleanCode = (code || '').trim();
    if (!cleanName) return { success: false, message: '请填写访客名称或备注。' };
    if (!cleanCode || cleanCode.length < 3) return { success: false, message: '通行码长度至少需要3位。' };

    const config = window.spaceStore.getAuthConfig();
    if (!Array.isArray(config.guestAccounts)) config.guestAccounts = [];

    // 冲突检查
    if (cleanCode === config.masterPasswords?.yan || cleanCode === config.masterPasswords?.qiuhui) {
      return { success: false, message: '该通行码与主人密码重复，请更换。' };
    }
    if (config.guestAccounts.some(a => a.code === cleanCode)) {
      return { success: false, message: '已存在相同通行码的访客账号，请更换。' };
    }

    const newAccount = {
      id: 'guest_' + Date.now(),
      name: cleanName,
      code: cleanCode,
      usageLimit: parseInt(usageLimit, 10),
      usedCount: 0,
      expiryDate: expiryDate || '2027-12-31',
      createdAt: new Date().toISOString().split('T')[0]
    };

    config.guestAccounts.push(newAccount);
    window.spaceStore.saveAuthConfig(config);

    return { success: true, message: `访客账号【${cleanName}】创建成功！` };
  }

  updateGuestAccount(id, { name, code, usageLimit, expiryDate }) {
    if (!this.isMaster()) return { success: false, message: '权限不足。' };

    const config = window.spaceStore.getAuthConfig();
    const account = config.guestAccounts?.find(a => a.id === id);
    if (!account) return { success: false, message: '该访客账号不存在。' };

    if (name) account.name = name.trim();
    if (code) {
      const cleanCode = code.trim();
      if (cleanCode === config.masterPasswords?.yan || cleanCode === config.masterPasswords?.qiuhui) {
        return { success: false, message: '该通行码与主人密码重复。' };
      }
      account.code = cleanCode;
    }
    if (usageLimit !== undefined) account.usageLimit = parseInt(usageLimit, 10);
    if (expiryDate !== undefined) account.expiryDate = expiryDate;

    window.spaceStore.saveAuthConfig(config);
    return { success: true, message: `访客账号【${account.name}】已成功更新！` };
  }

  deleteGuestAccount(id) {
    if (!this.isMaster()) return { success: false, message: '权限不足。' };

    const config = window.spaceStore.getAuthConfig();
    if (!Array.isArray(config.guestAccounts)) return { success: false, message: '无访客账号。' };

    config.guestAccounts = config.guestAccounts.filter(a => a.id !== id);
    window.spaceStore.saveAuthConfig(config);
    return { success: true, message: '访客账号已成功删除。' };
  }

  resetGuestAccountCount(id) {
    if (!this.isMaster()) return { success: false, message: '权限不足。' };

    const config = window.spaceStore.getAuthConfig();
    const account = config.guestAccounts?.find(a => a.id === id);
    if (account) {
      account.usedCount = 0;
      window.spaceStore.saveAuthConfig(config);
      return { success: true, message: `访客【${account.name}】的使用次数已清零！` };
    }
    return { success: false, message: '未找到指定账号。' };
  }
}

window.spaceAuth = new SpaceAuth();
