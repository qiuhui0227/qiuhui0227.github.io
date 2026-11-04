/**
 * OASIS | Qiuhui & Yan
 * 共享时刻表模块 (参考实验室预约系统秩序网格看板 + 情侣专属参与者)
 */

class TimetableModule {
  constructor() {
    this.selectedDate = new Date().toISOString().split('T')[0];
    this.initEvents();
  }

  initEvents() {
    // 监听全局事件或按钮
  }

  // 获取当前查看日期的事项列表
  getEventsForDate(dateStr) {
    const all = window.spaceStore.getTimetables();
    const isMaster = window.spaceAuth.isMaster();
    return all.filter(item => {
      if (item.date !== dateStr) return false;
      // 如果是来宾，只显示客厅开放的事项
      if (!isMaster && item.visibility === 'bedroom') return false;
      return true;
    });
  }

  // 格式化日期标题
  formatDateHeader(dateStr) {
    const d = new Date(dateStr + 'T00:00:00');
    const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
    const week = weekdays[d.getDay()];
    const today = new Date().toISOString().split('T')[0];
    const isToday = dateStr === today;
    return `${dateStr} ${week} ${isToday ? '<span class="today-tag">今日</span>' : ''}`;
  }

  // 渲染时刻表主界面
  render(container) {
    if (!container) return;
    const isMaster = window.spaceAuth.isMaster();
    const events = this.getEventsForDate(this.selectedDate);

    const morningEvents = events.filter(e => e.slot === 'morning');
    const afternoonEvents = events.filter(e => e.slot === 'afternoon');
    const eveningEvents = events.filter(e => e.slot === 'evening');

    container.innerHTML = `
      <div class="timetable-board">
        <!-- 顶部预约日历式控制栏 -->
        <div class="tt-control-bar card-glass">
          <div class="tt-date-stepper">
            <button class="btn btn-sm btn-outline" id="tt-btn-prev">‹ 前一天</button>
            <input type="date" id="tt-date-picker" value="${this.selectedDate}" class="input-date">
            <button class="btn btn-sm btn-outline" id="tt-btn-next">后一天 ›</button>
            <button class="btn btn-sm btn-secondary" id="tt-btn-today">回到今天</button>
          </div>
          <div class="tt-header-title">
            <h3 id="tt-date-display">${this.formatDateHeader(this.selectedDate)}</h3>
            <span class="tt-sub-tip">时段预约看板 · 实验级精细度安排</span>
          </div>
          <div class="tt-actions">
            ${isMaster ? `
              <button class="btn btn-primary" id="tt-btn-add">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                添加时刻事项
              </button>
            ` : `
              <span class="badge badge-guest">🛋️ 客厅浏览模式 (仅显示开放事项)</span>
            `}
          </div>
        </div>

        <!-- 三时段预约网格 -->
        <div class="tt-slots-grid">
          <!-- 1. 早晨时段 -->
          ${this.renderSlotSection('morning', '🌅 晨光研磨 · 上午时段 (08:00 - 12:00)', morningEvents, isMaster)}

          <!-- 2. 午后时段 -->
          ${this.renderSlotSection('afternoon', '☀️ 专注实验 · 午后时光 (12:00 - 18:00)', afternoonEvents, isMaster)}

          <!-- 3. 晚间时段 -->
          ${this.renderSlotSection('evening', '🌙 晚风散步 · 暮色夜间 (18:00 - 24:00)', eveningEvents, isMaster)}
        </div>
      </div>
    `;

    this.bindDOMEvents(container);
  }

  // 渲染单个时段分组卡片
  renderSlotSection(slotKey, title, slotEvents, isMaster) {
    return `
      <div class="tt-slot-card card-glass" data-slot="${slotKey}">
        <div class="tt-slot-header">
          <div class="tt-slot-title-wrap">
            <span class="tt-slot-dot tt-slot-dot-${slotKey}"></span>
            <span class="tt-slot-title">${title}</span>
          </div>
          <span class="tt-slot-count">${slotEvents.length} 个预约事项</span>
        </div>
        <div class="tt-events-list">
          ${slotEvents.length === 0 ? `
            <div class="tt-empty-slot">
              <span>当前时段暂无排期事项</span>
              ${isMaster ? `<button class="btn btn-xs btn-outline btn-slot-quick-add" data-slot="${slotKey}">+ 快速添加</button>` : ''}
            </div>
          ` : slotEvents.map(evt => this.renderEventCard(evt, isMaster)).join('')}
        </div>
      </div>
    `;
  }

  // 渲染单个事项卡片
  renderEventCard(evt, isMaster) {
    const participantMap = {
      yan: { label: 'Yan (王琰)', class: 'part-yan', avatar: '👦' },
      qiuhui: { label: 'Qiuhui (秋慧)', class: 'part-qiuhui', avatar: '👧' },
      both: { label: 'Both (共同参加)', class: 'part-both', avatar: '👫' }
    };

    const statusMap = {
      pending: { label: '待进行', class: 'status-pending' },
      ongoing: { label: '进行中', class: 'status-ongoing' },
      completed: { label: '已打卡', class: 'status-completed' }
    };

    const part = participantMap[evt.participant] || participantMap.both;
    const status = statusMap[evt.status] || statusMap.pending;

    return `
      <div class="tt-event-item card-hover ${evt.status === 'completed' ? 'is-completed' : ''}" data-id="${evt.id}">
        <div class="tt-event-left-bar ${part.class}-bar"></div>
        <div class="tt-event-main">
          <div class="tt-event-top">
            <span class="badge ${part.class}">
              <span class="badge-icon">${part.avatar}</span>
              ${part.label}
            </span>
            <span class="badge ${status.class}">${status.label}</span>
            ${isMaster && evt.visibility === 'bedroom' ? `
              <span class="badge badge-private" title="仅卧室私密可见">🔒 私密</span>
            ` : ''}
          </div>
          <h4 class="tt-event-title">${this.escapeHtml(evt.title)}</h4>
          ${evt.location ? `
            <div class="tt-event-meta">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
              <span>${this.escapeHtml(evt.location)}</span>
            </div>
          ` : ''}
          ${evt.notes ? `
            <p class="tt-event-notes">${this.escapeHtml(evt.notes)}</p>
          ` : ''}
        </div>
        ${isMaster ? `
          <div class="tt-event-actions">
            <button class="btn-icon btn-toggle-status" data-id="${evt.id}" title="${evt.status === 'completed' ? '恢复未打卡' : '打卡标记完成'}">
              ${evt.status === 'completed' ? '↩️' : '✅'}
            </button>
            <button class="btn-icon btn-edit-event" data-id="${evt.id}" title="编辑事项">✏️</button>
            <button class="btn-icon btn-delete-event" data-id="${evt.id}" title="删除事项">🗑️</button>
          </div>
        ` : ''}
      </div>
    `;
  }

  // 绑定交互事件
  bindDOMEvents(container) {
    // 切换日期
    const datePicker = container.querySelector('#tt-date-picker');
    if (datePicker) {
      datePicker.addEventListener('change', (e) => {
        this.selectedDate = e.target.value;
        this.render(container);
      });
    }

    const btnPrev = container.querySelector('#tt-btn-prev');
    if (btnPrev) {
      btnPrev.addEventListener('click', () => {
        const d = new Date(this.selectedDate + 'T00:00:00');
        d.setDate(d.getDate() - 1);
        this.selectedDate = d.toISOString().split('T')[0];
        this.render(container);
      });
    }

    const btnNext = container.querySelector('#tt-btn-next');
    if (btnNext) {
      btnNext.addEventListener('click', () => {
        const d = new Date(this.selectedDate + 'T00:00:00');
        d.setDate(d.getDate() + 1);
        this.selectedDate = d.toISOString().split('T')[0];
        this.render(container);
      });
    }

    const btnToday = container.querySelector('#tt-btn-today');
    if (btnToday) {
      btnToday.addEventListener('click', () => {
        this.selectedDate = new Date().toISOString().split('T')[0];
        this.render(container);
      });
    }

    // 添加事项按钮
    const btnAdd = container.querySelector('#tt-btn-add');
    if (btnAdd) {
      btnAdd.addEventListener('click', () => {
        this.openEventModal(null, 'morning');
      });
    }

    // 快捷添加
    container.querySelectorAll('.btn-slot-quick-add').forEach(btn => {
      btn.addEventListener('click', () => {
        this.openEventModal(null, btn.dataset.slot);
      });
    });

    // 切换打卡完成状态
    container.querySelectorAll('.btn-toggle-status').forEach(btn => {
      btn.addEventListener('click', () => {
        this.toggleEventStatus(btn.dataset.id);
        this.render(container);
      });
    });

    // 编辑事项
    container.querySelectorAll('.btn-edit-event').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        const all = window.spaceStore.getTimetables();
        const found = all.find(e => e.id === id);
        if (found) {
          this.openEventModal(found, found.slot);
        }
      });
    });

    // 删除事项
    container.querySelectorAll('.btn-delete-event').forEach(btn => {
      btn.addEventListener('click', () => {
        if (confirm('确认删除该时刻事项吗？')) {
          this.deleteEvent(btn.dataset.id);
          this.render(container);
        }
      });
    });
  }

  toggleEventStatus(id) {
    const all = window.spaceStore.getTimetables();
    const found = all.find(e => e.id === id);
    if (found) {
      found.status = found.status === 'completed' ? 'ongoing' : 'completed';
      window.spaceStore.saveTimetables(all);
    }
  }

  deleteEvent(id) {
    let all = window.spaceStore.getTimetables();
    all = all.filter(e => e.id !== id);
    window.spaceStore.saveTimetables(all);
  }

  // 打开事项添加/编辑模态弹窗
  openEventModal(item = null, defaultSlot = 'morning') {
    const isEdit = !!item;
    const modalHtml = `
      <div class="modal-overlay" id="tt-modal">
        <div class="modal-card card-glass animate-pop">
          <div class="modal-header">
            <h3>${isEdit ? '编辑时刻事项' : '新增时刻预约事项'}</h3>
            <button class="btn-close" id="tt-modal-close">×</button>
          </div>
          <form id="tt-event-form" class="modal-body">
            <div class="form-row">
              <div class="form-group flex-1">
                <label>日期</label>
                <input type="date" name="date" class="input" value="${item ? item.date : this.selectedDate}" required>
              </div>
              <div class="form-group flex-1">
                <label>时段区间</label>
                <select name="slot" class="input" required>
                  <option value="morning" ${(item?.slot || defaultSlot) === 'morning' ? 'selected' : ''}>🌅 晨光/上午 (08:00 - 12:00)</option>
                  <option value="afternoon" ${(item?.slot || defaultSlot) === 'afternoon' ? 'selected' : ''}>☀️ 午后时光 (12:00 - 18:00)</option>
                  <option value="evening" ${(item?.slot || defaultSlot) === 'evening' ? 'selected' : ''}>🌙 晚风漫步 (18:00 - 24:00)</option>
                </select>
              </div>
            </div>

            <div class="form-group">
              <label>事项主题 *</label>
              <input type="text" name="title" class="input" placeholder="例如：周末徒步野餐、论文仿真数据跑批..." value="${item ? this.escapeHtml(item.title) : ''}" required>
            </div>

            <div class="form-row">
              <div class="form-group flex-1">
                <label>参加人</label>
                <select name="participant" class="input">
                  <option value="both" ${item?.participant === 'both' ? 'selected' : ''}>👫 共同参加 (Both)</option>
                  <option value="yan" ${item?.participant === 'yan' ? 'selected' : ''}>👦 Yan (王琰)</option>
                  <option value="qiuhui" ${item?.participant === 'qiuhui' ? 'selected' : ''}>👧 Qiuhui (秋慧)</option>
                </select>
              </div>
              <div class="form-group flex-1">
                <label>空间开放权限</label>
                <select name="visibility" class="input">
                  <option value="living_room" ${item?.visibility === 'living_room' ? 'selected' : ''}>🛋️ 客厅开放 (来宾可看)</option>
                  <option value="bedroom" ${item?.visibility === 'bedroom' ? 'selected' : ''}>🛏️ 卧室私密 (仅主人可见)</option>
                </select>
              </div>
            </div>

            <div class="form-group">
              <label>地点 / 关联空间</label>
              <input type="text" name="location" class="input" placeholder="例如：长春净月潭 / 书房 / 咖啡馆" value="${item ? this.escapeHtml(item.location || '') : ''}">
            </div>

            <div class="form-group">
              <label>备忘详情与心得</label>
              <textarea name="notes" class="input textarea" rows="3" placeholder="写下一些细节安排、需要携带的物品或浪漫备忘...">${item ? this.escapeHtml(item.notes || '') : ''}</textarea>
            </div>

            <div class="modal-footer">
              <button type="button" class="btn btn-outline" id="tt-modal-cancel">取消</button>
              <button type="submit" class="btn btn-primary">保存事项</button>
            </div>
          </form>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);
    const modalEl = document.getElementById('tt-modal');

    const closeModal = () => {
      if (modalEl) modalEl.remove();
    };

    modalEl.querySelector('#tt-modal-close').addEventListener('click', closeModal);
    modalEl.querySelector('#tt-modal-cancel').addEventListener('click', closeModal);

    modalEl.querySelector('#tt-event-form').addEventListener('submit', (e) => {
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
          found.notes = fd.get('notes');
        }
      } else {
        const newEvent = {
          id: 'sched_' + Date.now(),
          date: fd.get('date'),
          slot: fd.get('slot'),
          title: fd.get('title'),
          participant: fd.get('participant'),
          visibility: fd.get('visibility'),
          location: fd.get('location'),
          notes: fd.get('notes'),
          status: 'pending'
        };
        all.push(newEvent);
      }

      window.spaceStore.saveTimetables(all);
      closeModal();
      const container = document.getElementById('content-timetable');
      if (container) {
        this.render(container);
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
}

window.timetableModule = new TimetableModule();
