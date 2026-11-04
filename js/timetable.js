/**
 * OASIS | Qiuhui & Yan
 * 共享时刻表模块 (完全采用 USV Lab 实验预约系统网格结构: schedule-heading, schedule-row, slot, slot-topic)
 */

class TimetableModule {
  constructor() {
    this.selectedDate = new Date().toISOString().split('T')[0];
  }

  // 获取指定日期的早中晚事项
  getEventsByDate(dateStr) {
    const all = window.spaceStore.getTimetables();
    const isMaster = window.spaceAuth.isMaster();
    return all.filter(e => {
      if (e.date !== dateStr) return false;
      if (!isMaster && e.visibility === 'bedroom') return false;
      return true;
    });
  }

  // 格式化日期与星期
  getDayMeta(dateStr) {
    const d = new Date(dateStr + 'T00:00:00');
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    const today = new Date().toISOString().split('T')[0];
    const isToday = dateStr === today;
    return {
      weekday: weekdays[d.getDay()],
      dateShort: `${d.getMonth() + 1}.${d.getDate()}`,
      isToday
    };
  }

  // 获取以选中日期为中心的 3 天视图（昨天、今天、明天），也可切换
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
        <!-- 顶部导引与日期切换 (复刻 USV Lab week-switcher) -->
        <div class="week-switcher-wrap">
          <div class="week-switcher">
            <div class="date-nav-controls">
              <button class="btn btn-outline btn-sm" id="tt-btn-prev">‹ 前一天</button>
              <input type="date" id="tt-date-input" value="${this.selectedDate}" class="input sm" style="width: auto;">
              <button class="btn btn-outline btn-sm" id="tt-btn-next">后一天 ›</button>
              <button class="btn btn-outline btn-sm" id="tt-btn-today">回到今天</button>
            </div>
            ${isMaster ? `
              <button class="btn btn-primary btn-sm" id="tt-btn-add">
                <svg class="ico" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>
                添加时刻事项
              </button>
            ` : `
              <span class="pill good">🛋️ 客厅来宾模式 · 仅展示开放日程</span>
            `}
          </div>
        </div>

        <div class="section-heading">
          <h2>时段预约看板与事项安排</h2>
          <p>早中晚三级时段 · 参加人专属状态区分</p>
        </div>

        <!-- USV Lab 经典表头 -->
        <div class="schedule-heading">
          <div>日期</div>
          <div>🌅 晨光 / 上午 (08:00 - 12:00)</div>
          <div>☀️ 午后 / 专注 (12:00 - 18:00)</div>
          <div>🌙 晚风 / 暮色 (18:00 - 24:00)</div>
        </div>

        <!-- USV Lab 经典行列表 -->
        <div class="schedule-list">
          ${dates.map(dateStr => this.renderScheduleRow(dateStr, isMaster)).join('')}
        </div>
      </div>
    `;

    this.bindEvents(container);
  }

  // 渲染单日行 (.schedule-row)
  renderScheduleRow(dateStr, isMaster) {
    const meta = this.getDayMeta(dateStr);
    const events = this.getEventsByDate(dateStr);

    const morningEvents = events.filter(e => e.slot === 'morning');
    const afternoonEvents = events.filter(e => e.slot === 'afternoon');
    const eveningEvents = events.filter(e => e.slot === 'evening');

    return `
      <div class="schedule-row ${meta.isToday ? 'is-today-row' : ''}">
        <div class="day-label">
          <strong>${meta.weekday} ${meta.isToday ? '<span class="pill good" style="font-size:10px;padding:2px 5px;">今日</span>' : ''}</strong>
          <small>${meta.dateShort}</small>
        </div>

        <!-- 上午时段 -->
        ${this.renderSlot(dateStr, 'morning', '🌅 上午', morningEvents, isMaster)}

        <!-- 下午时段 -->
        ${this.renderSlot(dateStr, 'afternoon', '☀️ 下午', afternoonEvents, isMaster)}

        <!-- 晚间时段 -->
        ${this.renderSlot(dateStr, 'evening', '🌙 晚间', eveningEvents, isMaster)}
      </div>
    `;
  }

  // 渲染单个时段槽位 (.slot)
  renderSlot(dateStr, slotKey, slotLabel, slotEvents, isMaster) {
    const count = slotEvents.length;
    return `
      <div class="slot ${count > 0 ? 'heat-4' : ''}" data-date="${dateStr}" data-slot="${slotKey}">
        <div class="slot-main">
          <span class="slot-period-tag">${slotLabel} (${count})</span>
          ${isMaster ? `
            <button class="btn-text btn-quick-add-slot" data-date="${dateStr}" data-slot="${slotKey}" title="在该时段快速添加">+添</button>
          ` : ''}
        </div>
        ${count === 0 ? `
          <div class="slot-topic empty"><span>暂无排期</span></div>
        ` : slotEvents.map(evt => this.renderTopic(evt, isMaster)).join('')}
      </div>
    `;
  }

  // 渲染事项胶囊 (.slot-topic)
  renderTopic(evt, isMaster) {
    const partMap = {
      yan: { label: 'Yan', class: 'part-yan', avatar: '👦' },
      qiuhui: { label: 'Qiuhui', class: 'part-qiuhui', avatar: '👧' },
      both: { label: 'Both', class: 'part-both', avatar: '👫' }
    };
    const part = partMap[evt.participant] || partMap.both;
    const isDone = evt.status === 'completed';

    return `
      <div class="slot-topic ${isDone ? 'is-done' : ''}" data-id="${evt.id}" title="${this.escapeHtml(evt.notes || evt.title)}">
        <span class="part-pill ${part.class}">${part.avatar} ${part.label}</span>
        <span style="flex:1; overflow:hidden; text-overflow:ellipsis;">${this.escapeHtml(evt.title)}</span>
        ${isMaster ? `
          <span class="btn-toggle-done" data-id="${evt.id}" style="cursor:pointer; margin-left:4px;" title="${isDone ? '恢复未完成' : '打卡标记完成'}">
            ${isDone ? '✅' : '○'}
          </span>
          <span class="btn-del-evt" data-id="${evt.id}" style="cursor:pointer; color:#a7464c; margin-left:4px;" title="删除">×</span>
        ` : ''}
      </div>
    `;
  }

  bindEvents(container) {
    // 切换日期
    const dateInput = container.querySelector('#tt-date-input');
    dateInput?.addEventListener('change', (e) => {
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

    // 添加事项
    container.querySelector('#tt-btn-add')?.addEventListener('click', () => {
      this.openEventModal(null, this.selectedDate, 'morning');
    });

    // 快捷添加
    container.querySelectorAll('.btn-quick-add-slot').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.openEventModal(null, btn.dataset.date, btn.dataset.slot);
      });
    });

    // 切换打卡完成
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

  // 弹窗表单 (复刻 USV Lab 的 .overlay 和 .sheet 结构)
  openEventModal(item = null, defaultDate = null, defaultSlot = 'morning') {
    const isEdit = !!item;
    const modalHtml = `
      <div class="overlay" id="tt-modal">
        <div class="sheet">
          <div class="sheet-head">
            <h3>${isEdit ? '编辑时刻事项' : '新增时刻事项'}</h3>
            <button class="logout" id="tt-modal-close" style="font-size: 18px;">×</button>
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
                  <option value="both" ${item?.participant === 'both' ? 'selected' : ''}>👫 共同参加 (Both)</option>
                  <option value="yan" ${item?.participant === 'yan' ? 'selected' : ''}>👦 Yan (王琰)</option>
                  <option value="qiuhui" ${item?.participant === 'qiuhui' ? 'selected' : ''}>👧 Qiuhui (秋慧)</option>
                </select>
              </div>
              <div>
                <label class="form-label">开放权限</label>
                <select name="visibility" class="select">
                  <option value="living_room" ${item?.visibility === 'living_room' ? 'selected' : ''}>🛋️ 客厅开放 (来宾可见)</option>
                  <option value="bedroom" ${item?.visibility === 'bedroom' ? 'selected' : ''}>🛏️ 卧室私密 (仅主人可见)</option>
                </select>
              </div>
            </div>

            <div>
              <label class="form-label">地点 / 备注备忘</label>
              <input type="text" name="location" class="input" placeholder="例如：实验室、长春净月潭、咖啡小馆..." value="${item ? this.escapeHtml(item.location || '') : ''}">
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
        const newEvt = {
          id: 'sched_' + Date.now(),
          date: fd.get('date'),
          slot: fd.get('slot'),
          title: fd.get('title'),
          participant: fd.get('participant'),
          visibility: fd.get('visibility'),
          location: fd.get('location'),
          status: 'pending'
        };
        all.push(newEvt);
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
