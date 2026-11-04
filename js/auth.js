/**
 * OASIS | Qiuhui & Yan
 * 认证与权限控制系统 (客厅 / 卧室双模体系)
 */

class SpaceAuth {
  constructor() {
    this.SESSION_KEY = 'oasis_current_session';
    this.currentRole = null; // 'master' | 'guest' | null
    this.loadSession();
  }

  // 加载当前登录状态
  loadSession() {
    try {
      // 严格安全策略：来宾登录信息严禁长期常驻 localStorage，防止绕过次数限制
      const localSaved = localStorage.getItem(this.SESSION_KEY);
      if (localSaved) {
        try {
          const parsedLocal = JSON.parse(localSaved);
          if (parsedLocal.role === 'guest') {
            // 清理历史遗留写入 localStorage 的来宾会话
            localStorage.removeItem(this.SESSION_KEY);
          }
        } catch (e) {}
      }

      const saved = sessionStorage.getItem(this.SESSION_KEY) || localStorage.getItem(this.SESSION_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.role === 'master') {
          this.currentRole = 'master';
        } else if (parsed.role === 'guest') {
          // 实时校验来宾凭据有效性与使用次数
          const config = window.spaceStore ? window.spaceStore.getAuthConfig() : null;
          if (config) {
            const todayStr = new Date().toISOString().split('T')[0];
            const isExpired = config.guestExpiryDate && todayStr > config.guestExpiryDate;
            const isExhausted = config.guestUsageLimit !== -1 && config.guestUsageLimit !== undefined && config.guestUsedCount > config.guestUsageLimit;

            if (isExpired || isExhausted) {
              this.logout();
              return;
            }
          }
          this.currentRole = 'guest';
        }
      }
    } catch (e) {
      this.currentRole = null;
    }
  }

  // 保存当前会话
  saveSession(role, remember = true) {
    this.currentRole = role;
    const sessionData = {
      role: role,
      loginTime: new Date().toISOString()
    };

    if (role === 'guest') {
      // 客厅来宾严格仅存 sessionStorage，关闭标签页或浏览器后必须重新输入密码，防止绕过使用次数限制
      sessionStorage.setItem(this.SESSION_KEY, JSON.stringify(sessionData));
      localStorage.removeItem(this.SESSION_KEY);
    } else {
      // 主人模式支持免密记住（若勾选）
      if (remember) {
        localStorage.setItem(this.SESSION_KEY, JSON.stringify(sessionData));
        sessionStorage.removeItem(this.SESSION_KEY);
      } else {
        sessionStorage.setItem(this.SESSION_KEY, JSON.stringify(sessionData));
      }
    }
  }

  // 登出 / 锁屏
  logout() {
    this.currentRole = null;
    sessionStorage.removeItem(this.SESSION_KEY);
    localStorage.removeItem(this.SESSION_KEY);
  }

  // 是否已登录
  isAuthenticated() {
    return this.currentRole !== null;
  }

  // 是否为主机（卧室权限）
  isMaster() {
    return this.currentRole === 'master';
  }

  // 是否为来宾（客厅权限）
  isGuest() {
    return this.currentRole === 'guest';
  }

  // 验证输入密码并判定身份
  login(password, remember = true) {
    const config = window.spaceStore.getAuthConfig();
    const cleanPwd = (password || '').trim();

    // 1. 先验证是否为主人密码 (卧室)
    if (cleanPwd === config.masterPassword) {
      this.saveSession('master', remember);
      return {
        success: true,
        role: 'master',
        message: '欢迎回到专属卧室空间，主人！'
      };
    }

    // 2. 再验证是否为来宾密码 (客厅)
    if (cleanPwd === config.guestPassword) {
      // A. 校验有效期
      if (config.guestExpiryDate) {
        const todayStr = new Date().toISOString().split('T')[0];
        if (todayStr > config.guestExpiryDate) {
          return {
            success: false,
            role: null,
            message: `来宾密码已于 ${config.guestExpiryDate} 过期，请联系空间主人获取最新密码。`
          };
        }
      }

      // B. 校验剩余使用次数
      if (config.guestUsageLimit !== -1 && config.guestUsageLimit !== undefined) {
        if (config.guestUsedCount >= config.guestUsageLimit) {
          return {
            success: false,
            role: null,
            message: `该来宾密码的使用次数已达上限（共 ${config.guestUsageLimit} 次），请联系主人重置。`
          };
        }
        // 递增使用次数
        config.guestUsedCount += 1;
        window.spaceStore.saveAuthConfig(config);
      }

      this.saveSession('guest', false);
      const remaining = config.guestUsageLimit === -1 ? '无限次' : `${config.guestUsageLimit - config.guestUsedCount} 次`;
      return {
        success: true,
        role: 'guest',
        message: `欢迎来到客厅！剩余可访问次数：${remaining}。`
      };
    }

    return {
      success: false,
      role: null,
      message: '密码不正确，请重新输入。'
    };
  }

  // 修改主人密码 (需要验证旧密码)
  updateMasterPassword(oldPwd, newPwd) {
    const config = window.spaceStore.getAuthConfig();
    if (oldPwd !== config.masterPassword) {
      return { success: false, message: '原主人密码错误，无法更改。' };
    }
    if (!newPwd || newPwd.length < 4) {
      return { success: false, message: '新密码长度至少需要4位。' };
    }
    config.masterPassword = newPwd;
    window.spaceStore.saveAuthConfig(config);
    return { success: true, message: '主人密码已成功修改，请牢记新密码！' };
  }

  // 配置来宾密码与访问规则 (仅主人可操作)
  updateGuestConfig({ newGuestPassword, usageLimit, expiryDate, resetCount = false }) {
    if (!this.isMaster()) {
      return { success: false, message: '权限不足：只有空间主人可修改来宾规则。' };
    }
    const config = window.spaceStore.getAuthConfig();
    if (newGuestPassword) {
      config.guestPassword = newGuestPassword.trim();
    }
    if (usageLimit !== undefined) {
      config.guestUsageLimit = parseInt(usageLimit, 10);
    }
    if (expiryDate !== undefined) {
      config.guestExpiryDate = expiryDate;
    }
    if (resetCount) {
      config.guestUsedCount = 0;
    }
    window.spaceStore.saveAuthConfig(config);
    return { success: true, message: '来宾门禁规则与密码已成功更新！' };
  }
}

window.spaceAuth = new SpaceAuth();
