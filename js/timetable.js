/**
 * OASIS | Qiuhui & Yan
 * 共享时刻表模块 (纯净 USV Lab 秩序网格 · 彻底消除杂乱按钮 · 纯量矢量 SVG)
 */

class TimetableModule {
  constructor() {
    this.selectedDate = new Date().toISOString().split('T')[0];
    this.svgPaths = {
      calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/>',
      sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
      cloudsun: '<path d="M12 3V2m-6 6-1-1M3 13H2M5 16a5 5 0 0 1 6.8-7.5 5.5 5.5 0 0 1 9 6.8A3.5 3.5 0 0 1 18 21H7a4 4 0 0 1-2-5Z"/>',
      moon: '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>',
      check: '<path d="m5 12 4 4L19 6"/>',
      checked: '<circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/>',
      circle: '<circle cx="12" cy="12" r="9"/>',
      close: '<path d="M18 6 6 18M6 6l12 12"/>',
      plus: '<path d="M12 5v14M5 12h14"/>',
      pin: '<path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/>',
      clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'
    };
  }

  icon(name, size = 14) {
    const p = this.svgPaths[name] || this.svgPaths.circle;
    return `<svg class="ico" width="${size}" height="${size}" viewBox="0 0 24 24" aria-hidden="true">${p}</svg>`;
  }

  getEventsByDate(dateStr) {
    const all = window.spaceStore.getTimetables();
    const isMaster = window.spaceAuth.isMaster();
    return all.filter(e => {
      if (e.date !== dateStr) return false;
      if (!isMaster && e.visibility === 'bedroom') return false;
      return true;
    });
  }

  getDayMeta(dateStr) {
    const d = new Date(dateStr + 'T00:00:00');
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    const today = new Date().toISOString().split('T')[0];
    return {
      weekday: weekdays[d.getDay()],
      dateShort: `${d.getMonth() + 1}.${d.getDate()}`,
      isToday: dateStr === today
    };
  }

  getDateRange() {
    const dates = [];
    for (let offset = -1; offset <= 2; offset++) {
      const d = new Date(this.selectedDate + 'T00:00:00');
      d.setDate(d.getDate() + offset);
      dates.push(d.toISOString().split('T')[0]);
    }
    return dates;
  }

  render(container) {
    if (!container) return;
    const isMaster = window.spaceAuth.isMaster();
    const dates = this.getDateRange();

    container.innerHTML = `
      <div class="timetable-wrap">
        <!-- 统一主模块标头栏 -->
        <div class="oasis-header-bar">
          <div class="oasis-header-main">
            <div class="oasis-header-kicker">
              ${this.icon('clock', 12)}
              <span>朝夕相伴 · 晨昏三时生活备忘</span>
            </div>
            <h2 class="oasis-header-title">📅 共享时刻表</h2>
            <p class="oasis-header-sub">早中晚精细时段排期 · 默认仅两人私密可见 · 点击时段卡槽即可即时添加</p>
          </div>
          <div class="oasis-header-actions">
            ${isMaster ? `
              <button class="btn btn-primary btn-sm" id="tt-btn-add">
                ${this.icon('plus', 13)}
                添加时刻事项
              </button>
            ` : `
              <span class="pill good">🛋️ 客厅来宾模式 · 仅展示开放日程</span>
            `}
          </div>
        </div>

        <!-- 统一二级日期控制栏 -->
        <div class="oasis-sub-bar">
          <div class="oasis-sub-bar-left">
            <span class="fine" style="font-weight:700; color:#18354a;">🗓️ 日期导航：</span>
            <div class="date-nav-controls" style="display:inline-flex; align-items:center; gap:6px;">
              <button class="btn btn-outline btn-sm" id="tt-btn-prev">‹ 前一天</button>
              <input type="date" id="tt-date-input" value="${this.selectedDate}" class="input sm" style="width: auto; height:32px; font-size:12px;">
              <button class="btn btn-outline btn-sm" id="tt-btn-next">后一天 ›</button>
              <button class="btn btn-outline btn-sm" id="tt-btn-today">回到今天</button>
            </div>
          </div>
          <div class="oasis-sub-bar-right fine" style="color:#627d8c;">
            连续 4 天时段看板 · 🛏️ 默认卧室私密
          </div>
        </div>

        <!-- USV Lab 经典表头 -->
        <div class="schedule-heading">
          <div>日期</div>
          <div>${this.icon('sun', 14)} 晨光 / 上午 (08:00 - 12:00)</div>
          <div>${this.icon('cloudsun', 14)} 午后 / 专注 (12:00 - 18:00)</div>
          <div>${this.icon('moon', 14)} 晚风 / 暮色 (18:00 - 24:00)</div>
        </div>

        <!-- USV Lab 经典行列表 -->
        <div class="schedule-list">
          ${dates.map(dateStr => this.renderScheduleRow(dateStr, isMaster)).join('')}
        </div>
      </div>
    `;

    this.bindEvents(container);
  }

  renderScheduleRow(dateStr, isMaster) {
    const meta = this.getDayMeta(dateStr);
    const events = this.getEventsByDate(dateStr);

    const morningEvents = events.filter(e => e.slot === 'morning');
    const afternoonEvents = events.filter(e => e.slot === 'afternoon');
    const eveningEvents = events.filter(e => e.slot === 'evening');

    return `
      <div class="schedule-row">
        <div class="day-label">
          <strong>${meta.weekday} ${meta.isToday ? '<span class="pill good" style="font-size:10px;padding:2px 5px;margin-left:2px;">今日</span>' : ''}</strong>
          <small>${meta.dateShort}</small>
        </div>

        ${this.renderSlot(dateStr, 'morning', `${this.icon('sun', 13)} 上午`, morningEvents, isMaster)}
        ${this.renderSlot(dateStr, 'afternoon', `${this.icon('cloudsun', 13)} 下午`, afternoonEvents, isMaster)}
        ${this.renderSlot(dateStr, 'evening', `${this.icon('moon', 13)} 晚间`, eveningEvents, isMaster)}
      </div>
    `;
  }

  renderSlot(dateStr, slotKey, slotLabel, slotEvents, isMaster) {
    const count = slotEvents.length;
    return `
      <div class="slot" data-date="${dateStr}" data-slot="${slotKey}">
        <div class="slot-main">
          <span class="slot-period-tag">${slotLabel}</span>
          ${count > 0 ? `<span class="slot-count-badge">${count}项</span>` : ''}
        </div>
        ${count === 0 ? `
          <div class="slot-topic empty ${!isMaster ? 'guest-view' : ''}" data-action="slot-click" data-date="${dateStr}" data-slot="${slotKey}">
            ${isMaster ? `${this.icon('plus', 11)} <span>安排事项</span>` : `<span>暂无排期</span>`}
          </div>
        ` : slotEvents.map(evt => this.renderTopic(evt, isMaster)).join('')}
      </div>
    `;
  }

  renderTopic(evt, isMaster) {
    const partMap = {
      yan: { label: 'Yan', class: 'part-yan' },
      qiuhui: { label: 'Qiuhui', class: 'part-qiuhui' },
      both: { label: 'Both', class: 'part-both' }
    };
    const part = partMap[evt.participant] || partMap.both;
    const isDone = evt.status === 'completed';

    return `
      <div class="slot-topic ${isDone ? 'is-done' : ''}" data-id="${evt.id}" title="${this.escapeHtml(evt.notes || evt.title)}">
        <span class="part-pill ${part.class}">${part.label}</span>
        <span class="slot-topic-text">${this.escapeHtml(evt.title)}</span>
        ${isMaster ? `
          <div class="slot-topic-actions">
            <button type="button" class="action-icon-btn ${isDone ? 'is-checked' : ''} btn-toggle-done" data-id="${evt.id}" title="${isDone ? '标记为未完成' : '打卡标记完成'}">
              ${this.icon(isDone ? 'checked' : 'circle', 13)}
            </button>
            <button type="button" class="action-icon-btn btn-del btn-del-evt" data-id="${evt.id}" title="删除事项">
              ${this.icon('close', 12)}
            </button>
          </div>
        ` : ''}
      </div>
    `;
  }

  bindEvents(container) {
    // 日期切换
    container.querySelector('#tt-date-input')?.addEventListener('change', (e) => {
      this.selectedDate = e.target.value;
      this.render(container);
    });
    container.querySelector('#tt-btn-prev')?.addEventListener('click', () => {
      const d = new Date(this.selectedDate + 'T00:00:00');
      d.setDate(d.getDate() - 1);
      this.selectedDate = d.toISOString().split('T')[0];
      this.render(container);
    });
    container.querySelector('#tt-btn-next')?.addEventListener('click', () => {
      const d = new Date(this.selectedDate + 'T00:00:00');
      d.setDate(d.getDate() + 1);
      this.selectedDate = d.toISOString().split('T')[0];
      this.render(container);
    });
    container.querySelector('#tt-btn-today')?.addEventListener('click', () => {
      this.selectedDate = new Date().toISOString().split('T')[0];
      this.render(container);
    });

    // 顶部添加按钮
    container.querySelector('#tt-btn-add')?.addEventListener('click', () => {
      this.openEventModal(null, this.selectedDate, 'morning');
    });

    // 点击时段卡槽打开详情/录入面底框
    container.querySelectorAll('.slot').forEach(slotEl => {
      slotEl.addEventListener('click', (e) => {
        // 如果点击的是打勾或删除小按钮，不弹窗
        if (e.target.closest('.action-icon-btn')) return;
        const dateStr = slotEl.dataset.date;
        const slotKey = slotEl.dataset.slot;
        this.openSlotSheet(dateStr, slotKey);
      });
    });

    // 打卡切换
    container.querySelectorAll('.btn-toggle-done').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const all = window.spaceStore.getTimetables();
        const found = all.find(x => x.id === btn.dataset.id);
        if (found) {
          found.status = found.status === 'completed' ? 'pending' : 'completed';
          window.spaceStore.saveTimetables(all);
          this.render(container);
        }
      });
    });

    // 删除事项
    container.querySelectorAll('.btn-del-evt').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (confirm('确认删除该事项吗？')) {
          let all = window.spaceStore.getTimetables();
          all = all.filter(x => x.id !== btn.dataset.id);
          window.spaceStore.saveTimetables(all);
          this.render(container);
        }
      });
    });
  }

  // 点击时段卡槽弹出的时段管理抽屉 (.sheet)
  openSlotSheet(dateStr, slotKey) {
    const isMaster = window.spaceAuth.isMaster();
    const currentUser = window.spaceAuth.getCurrentUser();
    const defaultPart = currentUser?.role === 'qiuhui' ? 'qiuhui' : (currentUser?.role === 'yan' ? 'yan' : 'both');
    const meta = this.getDayMeta(dateStr);
    const slotNames = {
      morning: '晨光 / 上午 (08:00 - 12:00)',
      afternoon: '午后 / 专注 (12:00 - 18:00)',
      evening: '晚风 / 暮色 (18:00 - 24:00)'
    };
    const periodName = slotNames[slotKey] || '时段';
    const all = window.spaceStore.getTimetables();
    const slotEvents = all.filter(e => e.date === dateStr && e.slot === slotKey && (isMaster || e.visibility === 'living_room'));

    const sheetHtml = `
      <div class="overlay" id="slot-sheet-overlay">
        <div class="sheet">
          <div class="sheet-head">
            <div>
              <h3>${meta.weekday} ${meta.dateShort} · ${periodName}</h3>
              <div class="fine">时段事项管理与即时排期</div>
            </div>
            <button class="logout" id="sheet-close" style="font-size:18px;">${this.icon('close', 18)}</button>
          </div>

          <!-- 事项列表 -->
          <div style="margin-bottom: 20px;">
            <div class="subhead" style="margin-bottom: 8px;">已安排事项 (${slotEvents.length})</div>
            ${slotEvents.length === 0 ? `
              <div class="fine" style="padding:12px; background:#f8fafb; border-radius:8px; text-align:center;">
                当前时段尚未安排事项
              </div>
            ` : `
              <div style="display:grid; gap:8px;">
                ${slotEvents.map(evt => `
                  <div style="display:flex; align-items:center; justify-content:space-between; padding:10px 12px; background:#f8fafb; border:1px solid #e2eaee; border-radius:10px;">
                    <div>
                      <div style="font-weight:700; font-size:13px; color:#18354a; ${evt.status === 'completed' ? 'text-decoration:line-through; opacity:0.6;' : ''}">
                        ${this.escapeHtml(evt.title)}
                      </div>
                      <div class="fine" style="display:flex; gap:10px; margin-top:3px;">
                        <span>参加人: <strong>${evt.participant === 'both' ? 'Both' : (evt.participant === 'yan' ? 'Yan' : 'Qiuhui')}</strong></span>
                        ${evt.location ? `<span>地点: ${this.escapeHtml(evt.location)}</span>` : ''}
                      </div>
                    </div>
                    ${isMaster ? `
                      <div style="display:flex; gap:6px;">
                        <button type="button" class="btn btn-outline btn-xs btn-sheet-toggle" data-id="${evt.id}">
                          ${evt.status === 'completed' ? '撤销' : '打卡完成'}
                        </button>
                        <button type="button" class="btn btn-danger btn-xs btn-sheet-del" data-id="${evt.id}">删除</button>
                      </div>
                    ` : ''}
                  </div>
                `).join('')}
              </div>
            `}
          </div>

          <!-- 主人即时添加表单 (复刻 USV Lab topic-form) -->
          ${isMaster ? `
            <div style="border-top: 1px solid #e5ecef; padding-top: 16px;">
              <div class="subhead" style="margin-bottom: 8px;">快速添加新安排</div>
              <form id="sheet-quick-form" class="login-form">
                <div>
                  <input type="text" name="title" class="input sm" placeholder="输入事项内容 (如：松花湖外场测试、自制手冲咖啡)" required>
                </div>
                <div class="form-row">
                  <div>
                    <select name="participant" class="select" style="height:39px; font-size:12px;">
                      <option value="both" ${defaultPart === 'both' ? 'selected' : ''}>👫 共同参加 (Both)</option>
                      <option value="yan" ${defaultPart === 'yan' ? 'selected' : ''}>👦 Yan (王岩)</option>
                      <option value="qiuhui" ${defaultPart === 'qiuhui' ? 'selected' : ''}>👧 Qiuhui (秋慧)</option>
                    </select>
                  </div>
                  <div>
                    <select name="visibility" class="select" style="height:39px; font-size:12px;">
                      <option value="bedroom" selected>🛏️ 卧室私密</option>
                      <option value="living_room">🛋️ 客厅开放</option>
                    </select>
                  </div>
                </div>
                <div style="display:flex; justify-content:flex-end;">
                  <button type="submit" class="btn btn-primary btn-sm">保存安排</button>
                </div>
              </form>
            </div>
          ` : ''}
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', sheetHtml);
    const overlay = document.getElementById('slot-sheet-overlay');
    const close = () => overlay && overlay.remove();

    overlay.querySelector('#sheet-close')?.addEventListener('click', close);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) close();
    });

    // 抽屉内打卡
    overlay.querySelectorAll('.btn-sheet-toggle').forEach(btn => {
      btn.addEventListener('click', () => {
        const item = all.find(x => x.id === btn.dataset.id);
        if (item) {
          item.status = item.status === 'completed' ? 'pending' : 'completed';
          window.spaceStore.saveTimetables(all);
          close();
          const container = document.getElementById('content-timetable');
          if (container) this.render(container);
        }
      });
    });

    // 抽屉内删除
    overlay.querySelectorAll('.btn-sheet-del').forEach(btn => {
      btn.addEventListener('click', () => {
        let list = window.spaceStore.getTimetables();
        list = list.filter(x => x.id !== btn.dataset.id);
        window.spaceStore.saveTimetables(list);
        close();
        const container = document.getElementById('content-timetable');
        if (container) this.render(container);
      });
    });

    // 抽屉内快速表单提交
    overlay.querySelector('#sheet-quick-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const newEvt = {
        id: 'sched_' + Date.now(),
        date: dateStr,
        slot: slotKey,
        title: fd.get('title'),
        participant: fd.get('participant'),
        visibility: fd.get('visibility') || 'bedroom',
        location: '',
        status: 'pending'
      };
      all.push(newEvt);
      window.spaceStore.saveTimetables(all);
      close();
      const container = document.getElementById('content-timetable');
      if (container) this.render(container);
    });
  }

  // 完整事项弹窗
  openEventModal(item = null, defaultDate = null, defaultSlot = 'morning') {
    if (!window.spaceAuth.isMaster()) return;
    const isEdit = !!item;
    const currentUser = window.spaceAuth.getCurrentUser();
    const defaultPart = item ? item.participant : (currentUser?.role === 'qiuhui' ? 'qiuhui' : (currentUser?.role === 'yan' ? 'yan' : 'both'));
    const modalHtml = `
      <div class="overlay" id="tt-modal">
        <div class="sheet">
          <div class="sheet-head">
            <h3>${isEdit ? '编辑时刻事项' : '新增时刻事项'}</h3>
            <button class="logout" id="tt-modal-close" style="font-size: 18px;">${this.icon('close', 18)}</button>
          </div>
          <form id="tt-form" class="login-form">
            <div class="form-row">
              <div>
                <label class="form-label">日期</label>
                <input type="date" name="date" class="input" value="${item ? item.date : (defaultDate || this.selectedDate)}" required>
              </div>
              <div>
                <label class="form-label">时段</label>
                <select name="slot" class="select" required>
                  <option value="morning" ${(item?.slot || defaultSlot) === 'morning' ? 'selected' : ''}>🌅 晨光/上午 (08:00 - 12:00)</option>
                  <option value="afternoon" ${(item?.slot || defaultSlot) === 'afternoon' ? 'selected' : ''}>☀️ 午后时光 (12:00 - 18:00)</option>
                  <option value="evening" ${(item?.slot || defaultSlot) === 'evening' ? 'selected' : ''}>🌙 晚风夜间 (18:00 - 24:00)</option>
                </select>
              </div>
            </div>

            <div>
              <label class="form-label">事项名称 *</label>
              <input type="text" name="title" class="input" placeholder="输入日程或活动内容" value="${item ? this.escapeHtml(item.title) : ''}" required>
            </div>

            <div class="form-row">
              <div>
                <label class="form-label">参加人</label>
                <select name="participant" class="select">
                  <option value="both" ${defaultPart === 'both' ? 'selected' : ''}>👫 共同参加 (Both)</option>
                  <option value="yan" ${defaultPart === 'yan' ? 'selected' : ''}>👦 Yan (王岩)</option>
                  <option value="qiuhui" ${defaultPart === 'qiuhui' ? 'selected' : ''}>👧 Qiuhui (秋慧)</option>
                </select>
              </div>
              <div>
                <label class="form-label">开放权限</label>
                <select name="visibility" class="select">
                  <option value="bedroom" ${(!item || item.visibility === 'bedroom' || !item.visibility) ? 'selected' : ''}>🛏️ 卧室私密 (仅主人可见)</option>
                  <option value="living_room" ${item?.visibility === 'living_room' ? 'selected' : ''}>🛋️ 客厅开放 (来宾可见)</option>
                </select>
              </div>
            </div>

            <div>
              <label class="form-label">地点 / 备注备忘</label>
              <input type="text" name="location" class="input" placeholder="例如：长春净月潭、书房、咖啡小馆..." value="${item ? this.escapeHtml(item.location || '') : ''}">
            </div>

            <div style="display:flex; justify-content:flex-end; gap:10px; margin-top:10px;">
              <button type="button" class="btn btn-outline" id="tt-modal-cancel">取消</button>
              <button type="submit" class="btn btn-primary">保存事项</button>
            </div>
          </form>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);
    const modalEl = document.getElementById('tt-modal');
    const close = () => modalEl && modalEl.remove();

    modalEl.querySelector('#tt-modal-close').addEventListener('click', close);
    modalEl.querySelector('#tt-modal-cancel').addEventListener('click', close);

    modalEl.querySelector('#tt-form').addEventListener('submit', (e) => {
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
        }
      } else {
        all.push({
          id: 'sched_' + Date.now(),
          date: fd.get('date'),
          slot: fd.get('slot'),
          title: fd.get('title'),
          participant: fd.get('participant'),
          visibility: fd.get('visibility') || 'bedroom',
          location: fd.get('location') || '',
          status: 'pending'
        });
      }

      window.spaceStore.saveTimetables(all);
      close();
      const container = document.getElementById('content-timetable');
      if (container) this.render(container);
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

window.timetableModule = new TimetableModule();
