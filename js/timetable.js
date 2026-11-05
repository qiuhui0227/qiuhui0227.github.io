/**
 * OASIS | Qiuhui & Yan
 * 小黑板模块 (极简白描细线风 · 晨午晚三栏全览 · 触屏/鼠标横向手势拖动翻页)
 */

class TimetableModule {
  constructor() {
    this.currentDate = this.getTodayDate();
    this.container = null;
    this.isDragging = false;
    this.startX = 0;
    this.currentDiffX = 0;
  }

  // 本地日期格式化辅助（解决东八区清晨与晚上时区日期偏差）
  formatLocalDate(d = new Date()) {
    if (window.spaceStore?.formatLocalDate) return window.spaceStore.formatLocalDate(d);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  getTodayDate() {
    if (window.spaceStore?.getTodayDate) return window.spaceStore.getTodayDate();
    return this.formatLocalDate(new Date());
  }

  parseLocalDate(dateStr) {
    if (!dateStr) return new Date();
    const parts = dateStr.split('-').map(Number);
    if (parts.length === 3) {
      return new Date(parts[0], parts[1] - 1, parts[2], 12, 0, 0);
    }
    return new Date();
  }

  // 获取指定日期的待办事项
  getNotesForDate(dateStr) {
    const all = window.spaceStore ? window.spaceStore.getTimetables() : [];
    const isMaster = window.spaceAuth ? window.spaceAuth.isMaster() : true;
    return all.filter(n => {
      if (n.date !== dateStr) return false;
      if (!isMaster && (n.visibility === 'bedroom' || !n.visibility)) return false;
      return true;
    });
  }

  // 格式化日期元信息
  getDateMeta(dateStr) {
    const d = this.parseLocalDate(dateStr);
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    const today = this.getTodayDate();
    const month = d.getMonth() + 1;
    const day = d.getDate();
    return {
      dateStr,
      month,
      day,
      dayLabel: `${month}月${day}日`,
      weekday: weekdays[d.getDay()],
      isToday: dateStr === today
    };
  }

  // 生成连续 9 天日期轴 (纯正本地日期无跳天偏移)
  getDateChips() {
    const chips = [];
    const center = this.parseLocalDate(this.currentDate);
    const today = this.getTodayDate();

    for (let offset = -4; offset <= 4; offset++) {
      const d = new Date(center);
      d.setDate(center.getDate() + offset);
      const str = this.formatLocalDate(d);
      const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
      chips.push({
        dateStr: str,
        weekday: weekdays[d.getDay()],
        dayNum: d.getDate(),
        month: d.getMonth() + 1,
        isToday: str === today,
        isActive: str === this.currentDate
      });
    }
    return chips;
  }

  // 三种身份的极简白描简笔画 SVG 图标 (王岩 / 杜秋慧 / 两人一起)
  getParticipantIcon(part) {
    if (part === 'yan') {
      // 王岩：帅气利落工科少年简笔头像
      return `
        <svg class="bb-avatar-ico yan" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" title="王岩">
          <path d="M5 11.5a7 7 0 0 0 14 0c0-1.8-.4-3-1.3-4"/>
          <path d="M4.8 11.5V9c0-3 3-5 7.2-5 3.8 0 6.8 1.8 7.2 4.5v3"/>
          <path d="M5 9.5c2-1 4.8-1.5 7.2-.5 2 .8 4.2.5 6.2-.8"/>
          <circle cx="9" cy="12" r="0.9" fill="currentColor"/>
          <circle cx="15" cy="12" r="0.9" fill="currentColor"/>
          <path d="M10.5 15.2c.8.7 2.2.7 3 0"/>
        </svg>
      `;
    } else if (part === 'qiuhui') {
      // 杜秋慧：温柔微卷长发女孩简笔头像
      return `
        <svg class="bb-avatar-ico qiuhui" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" title="杜秋慧">
          <path d="M5.5 13.5c-.8 2.5-.8 5.2 0 7.5"/>
          <path d="M18.5 13.5c.8 2.5.8 5.2 0 7.5"/>
          <path d="M5 12c-.5-4.5 2.8-8 7-8s7.5 3.5 7 8"/>
          <path d="M6 10c2-1 4.8 0 6 1.8 1.2-1.8 4-2.8 6-1.8"/>
          <path d="M7.2 12c0 3 2 5.5 4.8 5.5s4.8-2.5 4.8-5.5"/>
          <circle cx="9.5" cy="12.5" r="0.9" fill="currentColor"/>
          <circle cx="14.5" cy="12.5" r="0.9" fill="currentColor"/>
          <path d="M10.8 15.2c.6.5 1.8.5 2.4 0"/>
          <circle cx="18.2" cy="10.8" r="1.2" fill="currentColor" stroke="none"/>
        </svg>
      `;
    } else {
      // 两人一起：双人并肩依偎简笔画 + 甜蜜小小心动
      return `
        <svg class="bb-avatar-ico both" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" title="两人共同">
          <path d="M4 13.5a4 4 0 0 0 6.5 3.2"/>
          <path d="M4 13.5c0-2.2 1.6-4 3.8-4 1.3 0 2.4.6 3 1.6"/>
          <path d="M4 12c1.2-.8 3-.8 4.2 0"/>
          <circle cx="7" cy="13.5" r="0.8" fill="currentColor"/>
          <path d="M13.2 12.8c.6-1 1.7-1.6 3-1.6 2.2 0 3.8 1.8 3.8 4 0 2.2-1.6 3.8-3.6 3.8-1.1 0-2.1-.5-2.8-1.2"/>
          <path d="M14 11.2c1.2-1 3.5-1 4.8.4"/>
          <circle cx="16.5" cy="13.5" r="0.8" fill="currentColor"/>
          <path d="M12 4.2c-.4-.6-1.1-.8-1.7-.4-.6.5-.6 1.3 0 1.8L12 7.2l1.7-1.6c.6-.5.6-1.3 0-1.8-.6-.4-1.3-.2-1.7.4z" fill="currentColor" stroke="none"/>
        </svg>
      `;
    }
  }

  // 渲染时段卡片：有安排时展开呈现便利贴墙，无安排时压缩收拢为极简细栏
  renderSlotSection(slotKey, slotName, slotTime, slotIcon, notes, isMaster) {
    const hasNotes = notes.length > 0;

    if (hasNotes) {
      return `
        <div class="bb-slot-section has-notes" data-slot="${slotKey}">
          <div class="bb-slot-head">
            <div class="bb-slot-title-wrap">
              <span class="bb-slot-icon">${slotIcon}</span>
              <span class="bb-slot-name">${slotName}</span>
              <span class="bb-slot-time">${slotTime}</span>
              <span class="bb-slot-badge">${notes.length}项安排</span>
            </div>
            ${isMaster ? `
              <button type="button" class="bb-slot-add-btn bb-col-quick-add" data-slot="${slotKey}" title="记录${slotName}事项">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 5v14M5 12h14"/></svg>
                记一笔
              </button>
            ` : ''}
          </div>
          <div class="bb-slot-notes-grid">
            ${notes.map(n => this.renderStickyNote(n, isMaster)).join('')}
            ${isMaster ? `
              <div class="bb-sticky-add-card bb-col-quick-add" data-slot="${slotKey}" title="贴一张新便签">
                <span class="bb-sticky-add-plus">+</span>
                <span>贴新便签</span>
              </div>
            ` : ''}
          </div>
        </div>
      `;
    } else {
      // 压缩态：紧凑细栏，不霸占大块空白
      return `
        <div class="bb-slot-section is-empty" data-slot="${slotKey}">
          <div class="bb-slot-compressed bb-empty-hint" data-slot="${slotKey}" title="${isMaster ? '点击记录' + slotName + '事项' : '暂无安排'}">
            <div class="bb-slot-title-wrap bb-slot-comp-left">
              <span class="bb-slot-icon">${slotIcon}</span>
              <span class="bb-slot-name">${slotName}</span>
              <span class="bb-slot-time">${slotTime}</span>
              <span class="bb-slot-comp-status">· 暂无安排</span>
            </div>
            ${isMaster ? `
              <button type="button" class="bb-slot-comp-btn bb-col-quick-add" data-slot="${slotKey}" title="记录${slotName}事项">
                +
              </button>
            ` : ''}
          </div>
        </div>
      `;
    }
  }

  // 渲染单张手账便利贴 (Sticky Note)
  renderStickyNote(n, isMaster) {
    const isDone = n.status === 'completed';
    const part = n.participant || 'both';
    const partName = part === 'yan' ? '王岩' : (part === 'qiuhui' ? '秋慧' : '共同');

    return `
      <div class="bb-sticky-note ${part} ${isDone ? 'is-done' : ''}" data-id="${n.id}">
        <!-- 胶带撕边质感小贴纸 -->
        <div class="bb-note-tape"></div>

        <!-- 头部：简笔画图案 + 姓名徽章 + 打卡勾选框 -->
        <div class="bb-note-header">
          <div class="bb-note-author">
            ${this.getParticipantIcon(part)}
            <span class="bb-note-author-name">${partName}</span>
          </div>
          <button type="button" class="bb-note-chk btn-toggle-status" data-id="${n.id}" title="${isDone ? '标记为未完成' : '打卡完成'}">
            ${isDone ? '✓' : ''}
          </button>
        </div>

        <!-- 事项内容标题 -->
        <div class="bb-note-title">${this.escapeHtml(n.title)}</div>

        <!-- 底部：地点标签 + 悬浮操作 -->
        <div class="bb-note-footer">
          ${n.location ? `
            <span class="bb-note-loc" title="${this.escapeHtml(n.location)}">
              <svg class="bb-ico-pin" viewBox="0 0 24 24"><path d="M12 21s-6-5.3-6-10a6 6 0 0 1 12 0c0 4.7-6 10-6 10z"/><circle cx="12" cy="11" r="2"/></svg>
              ${this.escapeHtml(n.location)}
            </span>
          ` : '<span></span>'}

          ${isMaster ? `
            <div class="bb-note-actions">
              <button type="button" class="bb-note-act-btn edit-note-btn" data-id="${n.id}" title="编辑">✎</button>
              <button type="button" class="bb-note-act-btn del del-note-btn" data-id="${n.id}" title="删除">×</button>
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }

  render(container) {
    if (!container) return;
    this.container = container;

    const isMaster = window.spaceAuth ? window.spaceAuth.isMaster() : true;
    const currentMeta = this.getDateMeta(this.currentDate);
    const chips = this.getDateChips();
    const notes = this.getNotesForDate(this.currentDate);

    const morningNotes = notes.filter(n => n.slot === 'morning');
    const afternoonNotes = notes.filter(n => n.slot === 'afternoon');
    const eveningNotes = notes.filter(n => n.slot === 'evening');

    container.innerHTML = `
      <div class="bb-minimal-wrap">
        <!-- 1. 顶部极简精简控制条 -->
        <div class="bb-bar">
          <div class="bb-bar-title">小黑板</div>

          <!-- 居中精炼无感日期切换器 -->
          <div class="bb-stepper">
            <button type="button" class="bb-step-arrow" id="tt-btn-prev" title="前一天 (←)">‹</button>
            <div class="bb-step-date" id="tt-date-trigger" title="点击选择指定日期">
              <span>${currentMeta.month}月${currentMeta.day}日 ${currentMeta.weekday}</span>
              ${currentMeta.isToday ? '<span class="bb-dot-today" title="今天"></span>' : ''}
              <input type="date" id="tt-native-picker" value="${this.currentDate}" style="position:absolute; opacity:0; width:0; height:0; pointer-events:none;">
            </div>
            <button type="button" class="bb-step-arrow" id="tt-btn-next" title="后一天 (→)">›</button>
          </div>

          <!-- 右侧极简文字按钮 -->
          <div class="bb-bar-actions">
            ${!currentMeta.isToday ? '<button type="button" class="bb-btn-link" id="tt-btn-today">今日</button>' : ''}
            ${isMaster ? '<button type="button" class="bb-btn-link accent" id="tt-btn-add">+ 记一笔</button>' : ''}
            <button type="button" class="bb-btn-link" id="tt-btn-archive">导出</button>
          </div>
        </div>

        <!-- 2. 横向轻量滑动日期刻度轨 (可左右滑动或拖动选择) -->
        <div class="bb-rail-wrap" id="bb-date-rail">
          <div class="bb-rail">
            ${chips.map(c => `
              <div class="bb-rail-item ${c.isActive ? 'active' : ''} ${c.isToday ? 'today' : ''}" data-date="${c.dateStr}">
                <span class="bb-rail-weekday">${c.isToday ? '今' : c.weekday}</span>
                <span class="bb-rail-num">${c.dayNum}</span>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- 3. 手账便利贴画板主容器 (有安排展开便利贴，无安排自动压缩，支持横向拖拽切天) -->
        <div class="bb-board" id="bb-drag-board">
          ${this.renderSlotSection('morning', '晨 · 上午', '08:00 - 12:00', '☀️', morningNotes, isMaster)}
          ${this.renderSlotSection('afternoon', '昼 · 午后', '12:00 - 18:00', '🌤️', afternoonNotes, isMaster)}
          ${this.renderSlotSection('evening', '晚 · 晚间', '18:00 - 24:00', '🌙', eveningNotes, isMaster)}
        </div>

        <!-- 底部微弱手势指引 -->
        <div class="bb-hint-footer">
          <span>‹ 横向拖拽或按键盘 ← → 快速切换日期 ›</span>
        </div>
      </div>
    `;

    this.bindEvents(container);
  }

  bindEvents(container) {
    // 1. 箭头翻页
    container.querySelector('#tt-btn-prev')?.addEventListener('click', () => {
      this.stepDate(-1);
    });
    container.querySelector('#tt-btn-next')?.addEventListener('click', () => {
      this.stepDate(1);
    });

    // 2. 回到今天
    container.querySelector('#tt-btn-today')?.addEventListener('click', () => {
      this.currentDate = this.getTodayDate();
      this.render(container);
    });

    // 3. 点击日期唤起原生日期选择
    const dateTrigger = container.querySelector('#tt-date-trigger');
    const nativePicker = container.querySelector('#tt-native-picker');
    dateTrigger?.addEventListener('click', () => {
      nativePicker?.showPicker ? nativePicker.showPicker() : nativePicker?.click();
    });
    nativePicker?.addEventListener('change', (e) => {
      if (e.target.value) {
        this.currentDate = e.target.value;
        this.render(container);
      }
    });

    // 4. 日期轴点击切换
    container.querySelectorAll('.bb-rail-item').forEach(item => {
      item.addEventListener('click', () => {
        const d = item.dataset.date;
        if (d && d !== this.currentDate) {
          this.currentDate = d;
          this.render(container);
        }
      });
    });

    // 5. 快速新增记事
    container.querySelector('#tt-btn-add')?.addEventListener('click', () => {
      this.openNoteModal(null, this.currentDate, 'morning');
    });

    container.querySelectorAll('.bb-col-quick-add').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.openNoteModal(null, this.currentDate, btn.dataset.slot || 'morning');
      });
    });

    // 点击空白处快速记事
    container.querySelectorAll('.bb-empty-hint').forEach(hint => {
      hint.addEventListener('click', () => {
        if (!window.spaceAuth || window.spaceAuth.isMaster()) {
          this.openNoteModal(null, this.currentDate, hint.dataset.slot || 'morning');
        }
      });
    });

    // 6. 导出归档
    container.querySelector('#tt-btn-archive')?.addEventListener('click', () => {
      this.openArchiveModal();
    });

    // 7. 打卡状态切换
    container.querySelectorAll('.btn-toggle-status').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.dataset.id;
        const all = window.spaceStore.getTimetables();
        const found = all.find(x => x.id === id);
        if (found) {
          found.status = found.status === 'completed' ? 'pending' : 'completed';
          found.updatedAt = new Date().toISOString();
          try { window.spaceStore.saveTimetables(all); } catch (_) {}
          this.render(container);
        }
      });
    });

    // 8. 编辑事项
    container.querySelectorAll('.edit-note-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.dataset.id;
        const all = window.spaceStore.getTimetables();
        const found = all.find(x => x.id === id);
        if (found) this.openNoteModal(found);
      });
    });

    // 9. 删除事项
    container.querySelectorAll('.del-note-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (confirm('确认删除该备忘事项吗？')) {
          if (window.spaceStore?.deleteTimetable) {
            window.spaceStore.deleteTimetable(btn.dataset.id);
          } else {
            let all = window.spaceStore.getTimetables();
            all = all.filter(x => x.id !== btn.dataset.id);
            try { window.spaceStore.saveTimetables(all); } catch (_) {}
          }
          this.render(container);
        }
      });
    });

    // 10. 核心拖拽手势系统 (鼠标拖拽 + 触屏滑动)
    this.bindDragGesture(container);

    // 11. 键盘方向键左右翻页
    this.bindKeyboardNav();
  }

  stepDate(offset) {
    const d = this.parseLocalDate(this.currentDate);
    d.setDate(d.getDate() + offset);
    this.currentDate = this.formatLocalDate(d);
    this.render(this.container);
  }

  // 绑定鼠标与触摸屏横向拖拽翻页手势
  bindDragGesture(container) {
    const board = container.querySelector('#bb-drag-board');
    if (!board) return;

    let isDown = false;
    let startX = 0;
    let diffX = 0;

    // 触摸屏 Touch 手势
    board.addEventListener('touchstart', (e) => {
      if (e.target.closest('button, input, select')) return;
      isDown = true;
      startX = e.touches[0].clientX;
      diffX = 0;
      board.style.transition = 'none';
    }, { passive: true });

    board.addEventListener('touchmove', (e) => {
      if (!isDown) return;
      const currentX = e.touches[0].clientX;
      diffX = currentX - startX;
      // 轻微位移阻尼
      board.style.transform = `translateX(${diffX * 0.4}px)`;
    }, { passive: true });

    board.addEventListener('touchend', () => {
      if (!isDown) return;
      isDown = false;
      this.handleDragRelease(board, diffX);
    });

    // 鼠标拖拽 Mouse Drag 手势
    board.addEventListener('mousedown', (e) => {
      if (e.target.closest('button, input, select')) return;
      isDown = true;
      startX = e.clientX;
      diffX = 0;
      board.style.cursor = 'grabbing';
      board.style.transition = 'none';
    });

    window.addEventListener('mousemove', (e) => {
      if (!isDown) return;
      const currentX = e.clientX;
      diffX = currentX - startX;
      board.style.transform = `translateX(${diffX * 0.35}px)`;
    });

    window.addEventListener('mouseup', () => {
      if (!isDown) return;
      isDown = false;
      board.style.cursor = 'grab';
      this.handleDragRelease(board, diffX);
    });
  }

  handleDragRelease(board, diffX) {
    board.style.transition = 'transform 0.22s ease-out, opacity 0.22s ease-out';
    const threshold = 55; // 触发阈值 55 像素

    if (diffX < -threshold) {
      // 向左拖 -> 翻到后一天
      board.style.transform = 'translateX(-40px)';
      board.style.opacity = '0.4';
      setTimeout(() => {
        this.stepDate(1);
      }, 140);
    } else if (diffX > threshold) {
      // 向右拖 -> 翻到前一天
      board.style.transform = 'translateX(40px)';
      board.style.opacity = '0.4';
      setTimeout(() => {
        this.stepDate(-1);
      }, 140);
    } else {
      // 位移过小，弹性复位
      board.style.transform = 'translateX(0)';
      board.style.opacity = '1';
    }
  }

  bindKeyboardNav() {
    if (this._keyNavBound) return;
    this._keyNavBound = true;
    window.addEventListener('keydown', (e) => {
      // 避免输入框打字时被方向键劫持
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) return;
      if (e.key === 'ArrowLeft') {
        this.stepDate(-1);
      } else if (e.key === 'ArrowRight') {
        this.stepDate(1);
      }
    });
  }

  // 极简添加/编辑弹窗
  openNoteModal(item = null, defaultDate = '', defaultSlot = 'morning') {
    const isEdit = !!item;
    const currentUser = window.spaceAuth?.getCurrentUser();
    const defaultPart = item ? item.participant : (currentUser?.role === 'qiuhui' ? 'qiuhui' : (currentUser?.role === 'yan' ? 'yan' : 'both'));

    const modalHtml = `
      <div class="overlay" id="bb-modal-overlay">
        <div class="sheet" style="max-width: 440px;">
          <div class="sheet-head">
            <div>
              <h3>${isEdit ? '编辑备忘' : '记一笔'}</h3>
              <div class="fine">晨昏备忘 · 极简记录</div>
            </div>
            <button type="button" class="logout" id="bb-modal-close" style="font-size:18px;">×</button>
          </div>

          <form id="bb-note-form" class="login-form">
            <div>
              <label class="form-label">事项名称 *</label>
              <input type="text" name="title" class="input" placeholder="输入要记录的日程或安排" value="${item ? this.escapeHtml(item.title) : ''}" required autofocus>
            </div>

            <div class="form-row">
              <div>
                <label class="form-label">日期</label>
                <input type="date" name="date" class="input" value="${item ? item.date : (defaultDate || this.currentDate)}" required>
              </div>
              <div>
                <label class="form-label">时段</label>
                <select name="slot" class="select" required>
                  <option value="morning" ${(item?.slot || defaultSlot) === 'morning' ? 'selected' : ''}>晨 · 上午 (08:00 - 12:00)</option>
                  <option value="afternoon" ${(item?.slot || defaultSlot) === 'afternoon' ? 'selected' : ''}>昼 · 午后 (12:00 - 18:00)</option>
                  <option value="evening" ${(item?.slot || defaultSlot) === 'evening' ? 'selected' : ''}>晚 · 晚间 (18:00 - 24:00)</option>
                </select>
              </div>
            </div>

            <div class="form-row">
              <div>
                <label class="form-label">参加人</label>
                <select name="participant" class="select">
                  <option value="both" ${defaultPart === 'both' ? 'selected' : ''}>👫 两人共同</option>
                  <option value="yan" ${defaultPart === 'yan' ? 'selected' : ''}>👦 王岩</option>
                  <option value="qiuhui" ${defaultPart === 'qiuhui' ? 'selected' : ''}>👧 秋慧</option>
                </select>
              </div>
              <div>
                <label class="form-label">可见范围</label>
                <select name="visibility" class="select">
                  <option value="bedroom" ${(!item || item.visibility === 'bedroom') ? 'selected' : ''}>🛏️ 卧室私密 (仅两人可见)</option>
                  <option value="living" ${item?.visibility === 'living' ? 'selected' : ''}>🛋️ 客厅开放 (来宾可见)</option>
                </select>
              </div>
            </div>

            <div>
              <label class="form-label">地点 / 备注</label>
              <input type="text" name="location" class="input" placeholder="例如：净月潭、图书馆、咖啡厅..." value="${item ? this.escapeHtml(item.location || '') : ''}">
            </div>

            <div style="display:flex; justify-content:flex-end; gap:8px; margin-top:10px;">
              <button type="button" class="btn btn-outline" id="bb-modal-cancel">取消</button>
              <button type="submit" class="btn btn-primary">${isEdit ? '更新' : '保存'}</button>
            </div>
          </form>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);
    const modalEl = document.getElementById('bb-modal-overlay');
    const close = () => modalEl && modalEl.remove();

    modalEl.querySelector('#bb-modal-close').addEventListener('click', close);
    modalEl.querySelector('#bb-modal-cancel').addEventListener('click', close);

    modalEl.querySelector('#bb-note-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const all = window.spaceStore.getTimetables();

      if (isEdit) {
        const found = all.find(x => x.id === item.id);
        if (found) {
          found.date = fd.get('date');
          found.slot = fd.get('slot');
          found.title = fd.get('title');
          found.participant = fd.get('participant');
          found.visibility = fd.get('visibility');
          found.location = fd.get('location');
          found.updatedAt = new Date().toISOString();
        }
      } else {
        all.push({
          id: 'note_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
          date: fd.get('date'),
          slot: fd.get('slot'),
          title: fd.get('title'),
          participant: fd.get('participant'),
          visibility: fd.get('visibility') || 'bedroom',
          location: fd.get('location') || '',
          status: 'pending',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }

      // 本地优先保存：先写 localStorage，UI 立即响应，云端异步上传
      try {
        window.spaceStore.saveTimetables(all);
      } catch (err) {
        console.warn('[timetable] saveTimetables error:', err);
      }
      // 无论云端状态如何，UI 立即关闭并刷新
      close();
      this.currentDate = fd.get('date');
      this.render(this.container);
      window.spaceApp?.showToast(isEdit ? '备忘已更新 ✓' : '已记入小黑板 ✓');
    });
  }

  // 极简数据导出弹窗
  openArchiveModal() {
    const all = window.spaceStore.getTimetables();
    const sorted = [...all].sort((a, b) => (a.date || '').localeCompare(b.date || ''));

    let mdText = `# OASIS | Qiuhui & Yan 备忘历程归档\n导出时间：${new Date().toLocaleString()}\n总记录：${sorted.length} 项\n\n`;
    sorted.forEach(item => {
      const part = item.participant === 'yan' ? '王岩' : (item.participant === 'qiuhui' ? '秋慧' : '共同');
      const slotName = item.slot === 'morning' ? '晨·上午' : (item.slot === 'afternoon' ? '昼·午后' : '晚·晚间');
      const statusIcon = item.status === 'completed' ? 'x' : ' ';
      mdText += `- [${statusIcon}] **${item.date}** [${slotName}] (${part}) ${item.title}${item.location ? ' @' + item.location : ''}\n`;
    });

    const modalHtml = `
      <div class="overlay" id="bb-archive-overlay">
        <div class="sheet" style="max-width: 500px;">
          <div class="sheet-head">
            <div>
              <h3>历程归档与导出</h3>
              <div class="fine">备份两人的生活印记</div>
            </div>
            <button type="button" class="logout" id="bb-archive-close" style="font-size:18px;">×</button>
          </div>

          <div style="margin-bottom: 12px;">
            <textarea readonly class="input" style="height: 180px; font-family: monospace; font-size: 11.5px; white-space: pre;">${this.escapeHtml(mdText)}</textarea>
          </div>

          <div style="display:flex; justify-content:space-between; align-items:center; gap:8px;">
            <span class="fine">共计 ${sorted.length} 条记录</span>
            <div style="display:flex; gap:8px;">
              <button type="button" class="btn btn-outline btn-sm" id="bb-btn-copy-md">复制 Markdown</button>
              <button type="button" class="btn btn-primary btn-sm" id="bb-btn-download-txt">下载文本</button>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);
    const modalEl = document.getElementById('bb-archive-overlay');
    const close = () => modalEl && modalEl.remove();

    modalEl.querySelector('#bb-archive-close').addEventListener('click', close);
    modalEl.querySelector('#bb-btn-copy-md').addEventListener('click', () => {
      navigator.clipboard.writeText(mdText).then(() => {
        window.spaceApp?.showToast('已复制到剪贴板！');
      });
    });
    modalEl.querySelector('#bb-btn-download-txt').addEventListener('click', () => {
      const blob = new Blob([mdText], { type: 'text/markdown;charset=utf-8' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `oasis_notes_${this.currentDate}.md`;
      a.click();
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
