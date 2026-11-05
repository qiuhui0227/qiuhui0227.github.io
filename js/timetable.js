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
            ${isMaster ? '<button type="button" class="bb-btn-link accent" id="tt-btn-add">+ 记事</button>' : ''}
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

        <!-- 3. 极简白描画板主容器 (支持鼠标拖拽 / 触屏横向左右滑动切天) -->
        <div class="bb-board" id="bb-drag-board">
          <!-- 晨光/上午 -->
          <div class="bb-col" data-slot="morning">
            <div class="bb-col-head">
              <span class="bb-col-title">晨 · 上午</span>
              <span class="bb-col-meta">08:00 - 12:00</span>
              ${isMaster ? '<button type="button" class="bb-col-quick-add" data-slot="morning" title="记上午事项">+</button>' : ''}
            </div>
            <div class="bb-col-body">
              ${morningNotes.length === 0 ? `
                <div class="bb-empty-hint" data-slot="morning">
                  ${isMaster ? '点击记录早间计划' : '无事项'}
                </div>
              ` : morningNotes.map(n => this.renderNoteRow(n, isMaster)).join('')}
            </div>
          </div>

          <!-- 白昼/午后 -->
          <div class="bb-col" data-slot="afternoon">
            <div class="bb-col-head">
              <span class="bb-col-title">昼 · 午后</span>
              <span class="bb-col-meta">12:00 - 18:00</span>
              ${isMaster ? '<button type="button" class="bb-col-quick-add" data-slot="afternoon" title="记午后事项">+</button>' : ''}
            </div>
            <div class="bb-col-body">
              ${afternoonNotes.length === 0 ? `
                <div class="bb-empty-hint" data-slot="afternoon">
                  ${isMaster ? '点击记录午后专注' : '无事项'}
                </div>
              ` : afternoonNotes.map(n => this.renderNoteRow(n, isMaster)).join('')}
            </div>
          </div>

          <!-- 晚风/暮色 -->
          <div class="bb-col" data-slot="evening">
            <div class="bb-col-head">
              <span class="bb-col-title">暮 · 晚间</span>
              <span class="bb-col-meta">18:00 - 24:00</span>
              ${isMaster ? '<button type="button" class="bb-col-quick-add" data-slot="evening" title="记晚间事项">+</button>' : ''}
            </div>
            <div class="bb-col-body">
              ${eveningNotes.length === 0 ? `
                <div class="bb-empty-hint" data-slot="evening">
                  ${isMaster ? '点击记录夜间时光' : '无事项'}
                </div>
              ` : eveningNotes.map(n => this.renderNoteRow(n, isMaster)).join('')}
            </div>
          </div>
        </div>

        <!-- 底部微弱手势指引 -->
        <div class="bb-hint-footer">
          <span>‹ 横向拖动或按键盘 ← → 切换日期 ›</span>
        </div>
      </div>
    `;

    this.bindEvents(container);
  }

  // 极简单行待办呈现
  renderNoteRow(n, isMaster) {
    const isDone = n.status === 'completed';
    const part = n.participant || 'both';
    const partName = part === 'yan' ? '王岩' : (part === 'qiuhui' ? '秋慧' : '共同');

    return `
      <div class="bb-row ${isDone ? 'is-done' : ''}" data-id="${n.id}">
        <!-- 打卡标记圈 -->
        <button type="button" class="bb-chk ${isDone ? 'checked' : ''} btn-toggle-status" data-id="${n.id}" title="${isDone ? '标记为未做' : '打卡完成'}">
          ${isDone ? '✓' : ''}
        </button>

        <!-- 极简身份圆点与姓名 -->
        <span class="bb-part-dot ${part}" title="${partName}"></span>

        <!-- 事项内容 -->
        <div class="bb-row-content">
          <span class="bb-row-title">${this.escapeHtml(n.title)}</span>
          ${n.location ? `<span class="bb-row-loc">@${this.escapeHtml(n.location)}</span>` : ''}
        </div>

        <!-- 悬浮操作图标 -->
        ${isMaster ? `
          <div class="bb-row-actions">
            <button type="button" class="bb-act-btn edit-note-btn" data-id="${n.id}" title="编辑">✎</button>
            <button type="button" class="bb-act-btn del del-note-btn" data-id="${n.id}" title="删除">×</button>
          </div>
        ` : ''}
      </div>
    `;
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
                  <option value="evening" ${(item?.slot || defaultSlot) === 'evening' ? 'selected' : ''}>暮 · 晚间 (18:00 - 24:00)</option>
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
      const slotName = item.slot === 'morning' ? '晨·上午' : (item.slot === 'afternoon' ? '昼·午后' : '暮·晚间');
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
