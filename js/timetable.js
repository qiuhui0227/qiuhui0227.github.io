/**
 * OASIS | Qiuhui & Yan
 * 朝夕小黑板与每日便签系统 (Blackboard & Daily Note Board)
 * 
 * 核心特性：
 * 1. 每日独立板块：单日聚焦呈现，晨光、白昼、暮色三时段横向并列，一目了然无需纵向长滑；
 * 2. 身份与分工一眼分辨：清晰区分 👦 王岩、👧 杜秋慧、👫 两人共同 事项，色彩与徽章醒目分明；
 * 3. 左右快捷翻页：支持 ‹ 前一天 / 后一天 ›、快捷日期胶囊轨道、键盘 ← → 左右箭头翻页、移动端左右滑动手势；
 * 4. 自由规划未来天数：可随时翻阅后续日期并即时编辑录入未来的任务与备忘；
 * 5. 历史归档与完整导出：支持一键将过去全部备忘一键整理导出为 Markdown / TXT / JSON 文档，永存岁月轨迹。
 */

class TimetableModule {
  constructor() {
    this.currentDate = new Date().toISOString().split('T')[0];
    this.touchStartX = 0;
    this.touchStartY = 0;
    this.keyListenerAttached = false;
  }

  // 图标辅助
  icon(name, size = 16) {
    const icons = {
      sun: `<svg class="ico" width="${size}" height="${size}" viewBox="0 0 24 24"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`,
      cloudsun: `<svg class="ico" width="${size}" height="${size}" viewBox="0 0 24 24"><path d="M12 2v2M4.93 4.93l1.41 1.41M20 12h2M19.07 4.93l-1.41 1.41M15.5 17a4.5 4.5 0 0 0-8.8-1.5A3.5 3.5 0 0 0 4 19h14a3 3 0 0 0-2.5-2z"/></svg>`,
      moon: `<svg class="ico" width="${size}" height="${size}" viewBox="0 0 24 24"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`,
      plus: `<svg class="ico" width="${size}" height="${size}" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`,
      check: `<svg class="ico" width="${size}" height="${size}" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>`,
      clock: `<svg class="ico" width="${size}" height="${size}" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
      calendar: `<svg class="ico" width="${size}" height="${size}" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`,
      edit: `<svg class="ico" width="${size}" height="${size}" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`,
      trash: `<svg class="ico" width="${size}" height="${size}" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>`,
      close: `<svg class="ico" width="${size}" height="${size}" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`
    };
    return icons[name] || '';
  }

  // 格式化中文完整日期
  formatChineseDate(dateStr) {
    const d = new Date(dateStr + 'T00:00:00');
    const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
    const year = d.getFullYear();
    const month = d.getMonth() + 1;
    const day = d.getDate();
    const weekday = weekdays[d.getDay()];
    return `${year}年${month}月${day}日 · ${weekday}`;
  }

  // 计算相较于今天的天数差
  getDayDiffFromToday(dateStr) {
    const today = new Date().toISOString().split('T')[0];
    const d1 = new Date(today + 'T00:00:00');
    const d2 = new Date(dateStr + 'T00:00:00');
    const diffTime = d2.getTime() - d1.getTime();
    return Math.round(diffTime / (1000 * 60 * 60 * 24));
  }

  // 获取状态标识胶囊
  getDayBadgeHtml(dateStr) {
    const diff = this.getDayDiffFromToday(dateStr);
    if (diff === 0) {
      return '<span class="bb-day-badge today">★ 今天</span>';
    } else if (diff === 1) {
      return '<span class="bb-day-badge future">明天</span>';
    } else if (diff === 2) {
      return '<span class="bb-day-badge future">后天</span>';
    } else if (diff === -1) {
      return '<span class="bb-day-badge past">昨天</span>';
    } else if (diff < -1) {
      return `<span class="bb-day-badge past">${Math.abs(diff)}天前</span>`;
    } else {
      return `<span class="bb-day-badge future">${diff}天后</span>`;
    }
  }

  // 生成滑动日期轨道芯片 (前后共 9 天)
  generateDateChips() {
    const today = new Date().toISOString().split('T')[0];
    const cur = new Date(this.currentDate + 'T00:00:00');
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    const chips = [];

    // 从当前日期前 3 天到后 5 天
    for (let offset = -3; offset <= 5; offset++) {
      const d = new Date(cur);
      d.setDate(d.getDate() + offset);
      const dStr = d.toISOString().split('T')[0];
      const isToday = dStr === today;
      const isActive = dStr === this.currentDate;
      const month = d.getMonth() + 1;
      const day = d.getDate();
      const wDay = weekdays[d.getDay()];

      let label = wDay;
      if (isToday) label = '今天';

      chips.push({
        dateStr: dStr,
        weekdayLabel: label,
        dayNum: `${month}.${day < 10 ? '0' + day : day}`,
        isToday,
        isActive
      });
    }
    return chips;
  }

  // 主渲染入口
  render(container) {
    if (!container) return;
    const isMaster = window.spaceAuth.isMaster();
    const allEvents = window.spaceStore.getTimetables();

    // 过滤出当天的便签 (客厅访客仅看 living)
    const dayEvents = allEvents.filter(evt => {
      if (evt.date !== this.currentDate) return false;
      if (!isMaster && evt.visibility !== 'living') return false;
      return true;
    });

    // 按三个时段分类
    const morningList = dayEvents.filter(x => x.slot === 'morning');
    const afternoonList = dayEvents.filter(x => x.slot === 'afternoon');
    const eveningList = dayEvents.filter(x => x.slot === 'evening');

    const chineseDateStr = this.formatChineseDate(this.currentDate);
    const dayBadgeHtml = this.getDayBadgeHtml(this.currentDate);
    const chips = this.generateDateChips();

    container.innerHTML = `
      <div class="bb-container" id="blackboard-root">
        <!-- 统一主模块标头栏 -->
        <div class="oasis-header-bar">
          <div class="oasis-header-main">
            <div class="oasis-header-kicker">
              <span>📌 朝夕便签 · 两人生活备忘小黑板</span>
            </div>
            <h2 class="oasis-header-title">📋 今日小黑板</h2>
            <p class="oasis-header-sub">一目了然看清今日彼此与共同安排 · 左右随心翻页 · 自由规划未来</p>
          </div>
          <div class="oasis-header-actions">
            ${isMaster ? `
              <button class="btn btn-primary btn-sm" id="bb-btn-add-global">
                ${this.icon('plus', 13)}
                写新便签
              </button>
            ` : `
              <span class="pill good">🛋️ 客厅来宾模式 · 仅展示开放日程</span>
            `}
            <button class="btn btn-outline btn-sm" id="bb-btn-export-archive" title="导出过去与现在的备忘记录">
              📥 导出备忘归档
            </button>
            <button class="btn btn-outline btn-sm" id="bb-btn-jump-today" title="快速回到今天">
              🗓️ 回到今天
            </button>
          </div>
        </div>

        <!-- 顶部日期翻页控制器 (Sleek Day Turner) -->
        <div class="bb-date-controller">
          <button class="bb-nav-arrow-btn" id="bb-btn-prev" title="快捷键: ← 左箭头">
            ‹ 前一天
          </button>

          <div class="bb-center-date-badge">
            <div class="bb-date-label-row">
              <span class="bb-date-chinese">${chineseDateStr}</span>
              ${dayBadgeHtml}
            </div>
            <div class="bb-quick-date-picker-wrap">
              <input type="date" id="bb-date-input" value="${this.currentDate}" class="bb-hidden-date-input">
              <label for="bb-date-input" class="bb-date-picker-trigger" title="点击选择任意日期">
                ${this.icon('calendar', 12)}
                跳转至任意日期
              </label>
            </div>
          </div>

          <button class="bb-nav-arrow-btn" id="bb-btn-next" title="快捷键: → 右箭头">
            后一天 ›
          </button>
        </div>

        <!-- 快捷日期胶囊滑动轨道 (点击即跳，一目了然) -->
        <div class="bb-date-chips-strip">
          ${chips.map(c => `
            <button type="button" class="bb-date-chip ${c.isActive ? 'active' : ''} ${c.isToday ? 'is-today' : ''}" data-date="${c.dateStr}">
              <span class="bb-chip-weekday">${c.weekdayLabel}</span>
              <span class="bb-chip-day">${c.dayNum}</span>
            </button>
          `).join('')}
        </div>

        <!-- 小黑板核心三时段画板 (一页全览，无需纵向长滑) -->
        <div class="bb-board-card">
          <div class="bb-slots-grid">
            
            <!-- 1. 晨光 · 早晨/上午 -->
            <div class="bb-slot-column" data-slot="morning">
              <div class="bb-slot-header morning">
                <div class="bb-slot-header-left">
                  <span>${this.icon('sun', 14)} 晨光 · 上午 (06:00 - 12:00)</span>
                  <span class="bb-slot-badge-count">${morningList.length}</span>
                </div>
                ${isMaster ? `
                  <button type="button" class="bb-btn-slot-quick-add" data-slot="morning">
                    ${this.icon('plus', 11)} 记一笔
                  </button>
                ` : ''}
              </div>

              <div class="bb-notes-list">
                ${morningList.length === 0 ? `
                  <div class="bb-empty-slot">
                    <span>☕ 晨光正好，暂无事项</span>
                    ${isMaster ? '<span class="hint">点击右上角记一笔</span>' : ''}
                  </div>
                ` : morningList.map(note => this.renderNoteCard(note, isMaster)).join('')}
              </div>
            </div>

            <!-- 2. 白昼 · 午后/下午 -->
            <div class="bb-slot-column" data-slot="afternoon">
              <div class="bb-slot-header afternoon">
                <div class="bb-slot-header-left">
                  <span>${this.icon('cloudsun', 14)} 白昼 · 午后 (12:00 - 18:00)</span>
                  <span class="bb-slot-badge-count">${afternoonList.length}</span>
                </div>
                ${isMaster ? `
                  <button type="button" class="bb-btn-slot-quick-add" data-slot="afternoon">
                    ${this.icon('plus', 11)} 记一笔
                  </button>
                ` : ''}
              </div>

              <div class="bb-notes-list">
                ${afternoonList.length === 0 ? `
                  <div class="bb-empty-slot">
                    <span>🌿 午后专注，暂无待办</span>
                    ${isMaster ? '<span class="hint">点击右上角记一笔</span>' : ''}
                  </div>
                ` : afternoonList.map(note => this.renderNoteCard(note, isMaster)).join('')}
              </div>
            </div>

            <!-- 3. 晚风 · 暮色/睡前 -->
            <div class="bb-slot-column" data-slot="evening">
              <div class="bb-slot-header evening">
                <div class="bb-slot-header-left">
                  <span>${this.icon('moon', 14)} 晚风 · 暮色 (18:00 - 24:00)</span>
                  <span class="bb-slot-badge-count">${eveningList.length}</span>
                </div>
                ${isMaster ? `
                  <button type="button" class="bb-btn-slot-quick-add" data-slot="evening">
                    ${this.icon('plus', 11)} 记一笔
                  </button>
                ` : ''}
              </div>

              <div class="bb-notes-list">
                ${eveningList.length === 0 ? `
                  <div class="bb-empty-slot">
                    <span>🌙 暮色宁静，暂无安排</span>
                    ${isMaster ? '<span class="hint">点击右上角记一笔</span>' : ''}
                  </div>
                ` : eveningList.map(note => this.renderNoteCard(note, isMaster)).join('')}
              </div>
            </div>

          </div>
        </div>
      </div>
    `;

    this.bindEvents(container);
  }

  // 渲染单张便签卡片 (视觉高度醒目区分：王岩 / 杜秋慧 / 两人共同)
  renderNoteCard(note, isMaster) {
    const isCompleted = note.status === 'completed';
    const participant = note.participant || 'both';

    let partBadge = '';
    if (participant === 'yan') {
      partBadge = '<span class="bb-person-badge yan">👦 王岩</span>';
    } else if (participant === 'qiuhui') {
      partBadge = '<span class="bb-person-badge qiuhui">👧 杜秋慧</span>';
    } else {
      partBadge = '<span class="bb-person-badge both">👫 两人共同</span>';
    }

    const visibilityTag = note.visibility === 'living' ? '🛋️ 客厅' : '🛏️ 私密';
    const locTag = note.location ? `📍 ${this.escapeHtml(note.location)}` : '';

    return `
      <div class="bb-note-card participant-${participant} ${isCompleted ? 'is-completed' : ''}" data-id="${note.id}">
        <div class="bb-note-top">
          <div>${partBadge}</div>
          <div style="display:flex; align-items:center; gap:5px;">
            <span class="bb-tag-pill">${visibilityTag}</span>
            ${locTag ? `<span class="bb-tag-pill">${locTag}</span>` : ''}
          </div>
        </div>

        <div class="bb-note-text">
          ${this.escapeHtml(note.title)}
        </div>

        <div class="bb-note-footer">
          <button type="button" class="bb-btn-toggle-status" data-id="${note.id}" title="${isCompleted ? '点击标记为未完成' : '点击打卡完成'}">
            ${isCompleted ? '✅ 已完成' : '⭕ 待完成'}
          </button>

          ${isMaster ? `
            <div class="bb-note-actions">
              <button type="button" class="bb-note-action-btn edit-note-btn" data-id="${note.id}" title="编辑此条备忘">
                ${this.icon('edit', 12)}
              </button>
              <button type="button" class="bb-note-action-btn del del-note-btn" data-id="${note.id}" title="删除此条备忘">
                ${this.icon('trash', 12)}
              </button>
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }

  // 绑定事件
  bindEvents(container) {
    // 1. 前一天 / 后一天 / 回到今天
    container.querySelector('#bb-btn-prev')?.addEventListener('click', () => {
      this.navigateDay(-1, container);
    });
    container.querySelector('#bb-btn-next')?.addEventListener('click', () => {
      this.navigateDay(1, container);
    });
    container.querySelector('#bb-btn-jump-today')?.addEventListener('click', () => {
      this.currentDate = new Date().toISOString().split('T')[0];
      this.render(container);
    });

    // 2. 原生日期选择器
    container.querySelector('#bb-date-input')?.addEventListener('change', (e) => {
      if (e.target.value) {
        this.currentDate = e.target.value;
        this.render(container);
      }
    });

    // 3. 点击日期轨道胶囊跳转
    container.querySelectorAll('.bb-date-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const targetDate = chip.dataset.date;
        if (targetDate) {
          this.currentDate = targetDate;
          this.render(container);
        }
      });
    });

    // 4. 键盘左右键翻页 (支持快捷左右翻)
    if (!this.keyListenerAttached) {
      window.addEventListener('keydown', (e) => {
        // 如果正在输入框中，不触发翻页
        if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) return;
        const ttContainer = document.getElementById('content-timetable');
        if (!ttContainer || ttContainer.style.display === 'none') return;

        if (e.key === 'ArrowLeft') {
          e.preventDefault();
          this.navigateDay(-1, ttContainer);
        } else if (e.key === 'ArrowRight') {
          e.preventDefault();
          this.navigateDay(1, ttContainer);
        }
      });
      this.keyListenerAttached = true;
    }

    // 5. 移动端触摸滑动手势
    const boardRoot = container.querySelector('#blackboard-root');
    if (boardRoot) {
      boardRoot.addEventListener('touchstart', (e) => {
        this.touchStartX = e.changedTouches[0].screenX;
        this.touchStartY = e.changedTouches[0].screenY;
      }, { passive: true });

      boardRoot.addEventListener('touchend', (e) => {
        const diffX = e.changedTouches[0].screenX - this.touchStartX;
        const diffY = e.changedTouches[0].screenY - this.touchStartY;
        // 水平滑动大于 50px 且垂直滑动较小
        if (Math.abs(diffX) > 50 && Math.abs(diffY) < 60) {
          if (diffX > 0) {
            // 向右滑 -> 前一天
            this.navigateDay(-1, container);
          } else {
            // 向左滑 -> 后一天
            this.navigateDay(1, container);
          }
        }
      }, { passive: true });
    }

    // 6. 打卡状态切换
    container.querySelectorAll('.bb-btn-toggle-status').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleNoteStatus(btn.dataset.id, container);
      });
    });

    // 7. 编辑备忘
    container.querySelectorAll('.edit-note-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const all = window.spaceStore.getTimetables();
        const found = all.find(x => x.id === btn.dataset.id);
        if (found) this.openNoteModal(found);
      });
    });

    // 8. 删除备忘
    container.querySelectorAll('.del-note-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (confirm('确认删除此条备忘便签吗？')) {
          this.deleteNote(btn.dataset.id, container);
        }
      });
    });

    // 9. 时段内快捷写便签
    container.querySelectorAll('.bb-btn-slot-quick-add').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const slot = btn.dataset.slot || 'morning';
        this.openNoteModal(null, this.currentDate, slot);
      });
    });

    // 10. 顶部“写新便签”按钮
    container.querySelector('#bb-btn-add-global')?.addEventListener('click', () => {
      this.openNoteModal(null, this.currentDate, 'morning');
    });

    // 11. 导出备忘归档
    container.querySelector('#bb-btn-export-archive')?.addEventListener('click', () => {
      this.openArchiveModal();
    });
  }

  // 日期跳转助手
  navigateDay(offsetDays, container) {
    const cur = new Date(this.currentDate + 'T00:00:00');
    cur.setDate(cur.getDate() + offsetDays);
    this.currentDate = cur.toISOString().split('T')[0];
    this.render(container);
  }

  // 切换便签完成状态
  toggleNoteStatus(noteId, container) {
    const all = window.spaceStore.getTimetables();
    const item = all.find(x => x.id === noteId);
    if (item) {
      item.status = item.status === 'completed' ? 'pending' : 'completed';
      window.spaceStore.saveTimetables(all);
      this.render(container);
      window.spaceApp?.showToast(item.status === 'completed' ? '已完成打卡 ✨' : '已恢复为待办');
    }
  }

  // 删除便签
  deleteNote(noteId, container) {
    let all = window.spaceStore.getTimetables();
    all = all.filter(x => x.id !== noteId);
    window.spaceStore.saveTimetables(all);
    this.render(container);
    window.spaceApp?.showToast('便签已删除');
  }

  // 便签录入与编辑弹窗
  openNoteModal(item = null, defaultDate = null, defaultSlot = 'morning') {
    if (!window.spaceAuth.isMaster()) return;
    const isEdit = !!item;
    const currentUser = window.spaceAuth.getCurrentUser();
    const defaultPart = item ? item.participant : (currentUser?.role === 'qiuhui' ? 'qiuhui' : (currentUser?.role === 'yan' ? 'yan' : 'both'));
    const targetDate = item ? item.date : (defaultDate || this.currentDate);
    const targetSlot = item ? item.slot : defaultSlot;
    const targetVisibility = item ? item.visibility : 'bedroom';

    const modalHtml = `
      <div class="overlay" id="bb-modal">
        <div class="sheet" style="max-width: 520px; width: 95vw;">
          <div class="sheet-head">
            <h3>${isEdit ? '✏️ 编辑小黑板便签' : '📝 写新便签上黑板'}</h3>
            <button class="logout" id="bb-modal-close" style="font-size: 18px;">${this.icon('close', 18)}</button>
          </div>
          <form id="bb-form" class="login-form">
            <!-- 归属人选择 (极其醒目) -->
            <div>
              <label class="form-label">事项归属谁 *</label>
              <div style="display:grid; grid-template-columns: repeat(3, 1fr); gap: 8px;">
                <label style="cursor:pointer; border:1px solid #dce8ee; border-radius:10px; padding:10px 8px; text-align:center; display:flex; flex-direction:column; align-items:center; gap:4px; background:#f9fbfe;" class="part-select-card">
                  <input type="radio" name="participant" value="yan" ${defaultPart === 'yan' ? 'checked' : ''} style="margin:0;">
                  <span style="font-weight:700; color:#1d4ed8; font-size:13px;">👦 王岩</span>
                </label>
                <label style="cursor:pointer; border:1px solid #dce8ee; border-radius:10px; padding:10px 8px; text-align:center; display:flex; flex-direction:column; align-items:center; gap:4px; background:#fffbfb;" class="part-select-card">
                  <input type="radio" name="participant" value="qiuhui" ${defaultPart === 'qiuhui' ? 'checked' : ''} style="margin:0;">
                  <span style="font-weight:700; color:#be123c; font-size:13px;">👧 杜秋慧</span>
                </label>
                <label style="cursor:pointer; border:1px solid #dce8ee; border-radius:10px; padding:10px 8px; text-align:center; display:flex; flex-direction:column; align-items:center; gap:4px; background:#f6fbf8;" class="part-select-card">
                  <input type="radio" name="participant" value="both" ${defaultPart === 'both' ? 'checked' : ''} style="margin:0;">
                  <span style="font-weight:700; color:#047857; font-size:13px;">👫 两人共同</span>
                </label>
              </div>
            </div>

            <!-- 便签内容 -->
            <div>
              <label class="form-label" for="bb-note-title">便签事项内容 *</label>
              <textarea 
                class="textarea" 
                id="bb-note-title" 
                name="title" 
                rows="3" 
                placeholder="例如：王岩准备下午的组会汇报材料、杜秋慧完成病例分析、晚上一起看电影" 
                required
                autofocus
              >${item ? this.escapeHtml(item.title) : ''}</textarea>
            </div>

            <!-- 日期与时段 -->
            <div class="form-row">
              <div>
                <label class="form-label">计划日期 *</label>
                <input type="date" class="input" name="date" value="${targetDate}" required>
              </div>
              <div>
                <label class="form-label">安排时段 *</label>
                <select class="select" name="slot" required>
                  <option value="morning" ${targetSlot === 'morning' ? 'selected' : ''}>🌅 晨光 · 上午 (06:00 - 12:00)</option>
                  <option value="afternoon" ${targetSlot === 'afternoon' ? 'selected' : ''}>☀️ 白昼 · 午后 (12:00 - 18:00)</option>
                  <option value="evening" ${targetSlot === 'evening' ? 'selected' : ''}>🌙 晚风 · 暮色 (18:00 - 24:00)</option>
                </select>
              </div>
            </div>

            <!-- 地点与私密权限 -->
            <div class="form-row">
              <div>
                <label class="form-label">地点 / 场景 (选填)</label>
                <input type="text" class="input" name="location" value="${item ? this.escapeHtml(item.location || '') : ''}" placeholder="例如：学校实验室、医院、书房">
              </div>
              <div>
                <label class="form-label">空间权限 *</label>
                <select class="select" name="visibility">
                  <option value="bedroom" ${targetVisibility === 'bedroom' ? 'selected' : ''}>🛏️ 卧室私密 (仅两人可见)</option>
                  <option value="living" ${targetVisibility === 'living' ? 'selected' : ''}>🛋️ 客厅开放 (访客亦可见)</option>
                </select>
              </div>
            </div>

            <div style="display:flex; justify-content:flex-end; gap:10px; margin-top:14px;">
              <button type="button" class="btn btn-outline" id="bb-modal-cancel">取消</button>
              <button type="submit" class="btn btn-primary">${isEdit ? '保存修改' : '贴上小黑板'}</button>
            </div>
          </form>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);
    const modalEl = document.getElementById('bb-modal');
    const close = () => modalEl && modalEl.remove();

    modalEl.querySelector('#bb-modal-close').addEventListener('click', close);
    modalEl.querySelector('#bb-modal-cancel').addEventListener('click', close);
    modalEl.addEventListener('click', (e) => {
      if (e.target === modalEl) close();
    });

    modalEl.querySelector('#bb-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const all = window.spaceStore.getTimetables();
      const chosenDate = fd.get('date');

      if (isEdit) {
        const found = all.find(x => x.id === item.id);
        if (found) {
          found.date = chosenDate;
          found.slot = fd.get('slot');
          found.title = fd.get('title').trim();
          found.participant = fd.get('participant');
          found.visibility = fd.get('visibility');
          found.location = fd.get('location').trim();
        }
      } else {
        all.push({
          id: 'sched_' + Date.now(),
          date: chosenDate,
          slot: fd.get('slot'),
          title: fd.get('title').trim(),
          participant: fd.get('participant'),
          visibility: fd.get('visibility'),
          location: fd.get('location').trim(),
          status: 'pending',
          createdAt: new Date().toISOString()
        });
      }

      window.spaceStore.saveTimetables(all);
      close();

      // 切到该事项所在的日期显示
      this.currentDate = chosenDate;
      const container = document.getElementById('content-timetable');
      if (container) this.render(container);
      window.spaceApp?.showToast(isEdit ? '便签已成功更新！' : '便签已贴上小黑板！');
    });
  }

  // 历史备忘归档与导出弹窗
  openArchiveModal() {
    const all = window.spaceStore.getTimetables();
    const sorted = [...all].sort((a, b) => (a.date || '').localeCompare(b.date || ''));
    const today = new Date().toISOString().split('T')[0];

    const pastEvents = sorted.filter(x => x.date < today);
    const todayEvents = sorted.filter(x => x.date === today);
    const futureEvents = sorted.filter(x => x.date > today);
    const completedCount = sorted.filter(x => x.status === 'completed').length;

    // 生成 Markdown 文本格式导出
    let mdText = `# Qiuhui & Yan 朝夕小黑板 · 生活备忘历程归档\n`;
    mdText += `> 归档生成时间：${new Date().toLocaleString('zh-CN')} · 共记录 ${sorted.length} 项备忘\n\n`;

    if (sorted.length === 0) {
      mdText += `（暂无备忘事项）\n`;
    } else {
      // 按日期分组
      const dateGroups = {};
      sorted.forEach(evt => {
        if (!dateGroups[evt.date]) dateGroups[evt.date] = [];
        dateGroups[evt.date].push(evt);
      });

      const slotNames = { morning: '🌅 晨光·上午', afternoon: '☀️ 白昼·午后', evening: '🌙 晚风·暮色' };
      const partNames = { yan: '👦 王岩', qiuhui: '👧 杜秋慧', both: '👫 两人共同' };

      Object.keys(dateGroups).forEach(dStr => {
        const diff = this.getDayDiffFromToday(dStr);
        let tag = '';
        if (diff === 0) tag = ' (今天)';
        else if (diff === -1) tag = ' (昨天)';
        else if (diff === 1) tag = ' (明天)';
        else if (diff < 0) tag = ` (${Math.abs(diff)}天前)`;
        else tag = ` (${diff}天后)`;

        mdText += `### 📅 ${dStr}${tag}\n`;
        dateGroups[dStr].forEach(e => {
          const check = e.status === 'completed' ? '[x]' : '[ ]';
          const sName = slotNames[e.slot] || '全天';
          const pName = partNames[e.participant] || '共同';
          const loc = e.location ? ` @ ${e.location}` : '';
          mdText += `- ${check} ${sName} | ${pName}: ${e.title}${loc}\n`;
        });
        mdText += `\n`;
      });
    }

    const modalHtml = `
      <div class="overlay" id="bb-archive-modal">
        <div class="sheet bb-archive-modal-box">
          <div class="sheet-head">
            <h3>📥 小黑板备忘历程 · 归档与导出</h3>
            <button class="logout" id="bb-archive-close" style="font-size: 18px;">${this.icon('close', 18)}</button>
          </div>

          <div class="bb-archive-stats-bar">
            <strong>📊 记录概况：</strong>
            全站累计 <strong>${sorted.length}</strong> 条备忘 · 
            历史记录 <strong>${pastEvents.length}</strong> 条 · 
            今日 <strong>${todayEvents.length}</strong> 条 · 
            未来规划 <strong>${futureEvents.length}</strong> 条 · 
            已打卡完成 <strong>${completedCount}</strong> 条
          </div>

          <div class="fine" style="margin-bottom:6px; font-weight:700; color:#18354a;">
            📄 历史备忘全文预览 (可直接导出或复制)：
          </div>

          <div class="bb-archive-preview-box">${this.escapeHtml(mdText)}</div>

          <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px; margin-top:14px;">
            <div style="display:flex; gap:8px;">
              <button type="button" class="btn btn-primary btn-sm" id="bb-btn-download-md">
                📄 下载为 Markdown (.md)
              </button>
              <button type="button" class="btn btn-outline btn-sm" id="bb-btn-download-txt">
                📝 下载为 TXT
              </button>
              <button type="button" class="btn btn-outline btn-sm" id="bb-btn-copy-archive">
                📋 复制到剪贴板
              </button>
            </div>
            <div>
              <button type="button" class="btn btn-outline btn-sm" id="bb-btn-download-json">
                💾 导出 JSON 数据包
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);
    const modalEl = document.getElementById('bb-archive-modal');
    const close = () => modalEl && modalEl.remove();

    modalEl.querySelector('#bb-archive-close').addEventListener('click', close);
    modalEl.addEventListener('click', (e) => {
      if (e.target === modalEl) close();
    });

    // 下载文件辅助
    const downloadFile = (filename, content, type = 'text/plain;charset=utf-8') => {
      const blob = new Blob([content], { type });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    };

    // 下载 MD
    modalEl.querySelector('#bb-btn-download-md').addEventListener('click', () => {
      downloadFile(`qiuhui_yan_blackboard_${today}.md`, mdText, 'text/markdown;charset=utf-8');
      window.spaceApp?.showToast('已成功导出 Markdown 历程归档文件！');
    });

    // 下载 TXT
    modalEl.querySelector('#bb-btn-download-txt').addEventListener('click', () => {
      downloadFile(`qiuhui_yan_blackboard_${today}.txt`, mdText, 'text/plain;charset=utf-8');
      window.spaceApp?.showToast('已成功导出 TXT 历程归档文件！');
    });

    // 复制剪贴板
    modalEl.querySelector('#bb-btn-copy-archive').addEventListener('click', () => {
      navigator.clipboard.writeText(mdText).then(() => {
        window.spaceApp?.showToast('备忘历程全文已复制到剪贴板！');
      }).catch(() => {
        window.spaceApp?.showToast('复制失败，请手动长按预览框复制。', true);
      });
    });

    // 导出 JSON
    modalEl.querySelector('#bb-btn-download-json').addEventListener('click', () => {
      downloadFile(`oasis_timetables_backup_${today}.json`, JSON.stringify(sorted, null, 2), 'application/json');
      window.spaceApp?.showToast('已成功导出全量 JSON 数据包！');
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
}

// 挂载至全局与自动实例化
window.TimetableModule = TimetableModule;
window.timetableModule = new TimetableModule();
