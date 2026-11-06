/**
 * OASIS | Qiuhui & Yan
 * 人生ToDo · 星光愿景与人生心愿清单 (Life Bucket List & Dreams)
 * 
 * 核心设计特色：
 * 1. 两个人一起走过的山海、许下的约定与彼此的终身追求
 * 2. 仪式感圆梦打卡：支持记录圆梦日期、足迹地点、回忆感言与纪念瞬间照片
 * 3. 愿望灵感库：精选 60+ 浪漫情侣/人生必去/极致体验/学业高光灵感，一键采纳
 * 4. 多维筛选与数据看板：按两人共同/秋慧/王岩、类目、期待度与达成状态自由筛选
 * 5. 全球边缘双向同步：男女主人各端实时同步，永不丢失
 */

class TodoModule {
  constructor() {
    this.container = null;
    this.currentOwner = 'all';     // 'all' | 'both' | 'qiuhui' | 'yan'
    this.currentCategory = 'all';  // 'all' | 'romantic' | 'travel' | 'experience' | 'growth' | 'home' | 'other'
    this.currentStatus = 'all';    // 'all' | 'pending' | 'in_progress' | 'completed'
    this.searchKeyword = '';
    this.activeModal = null;
  }

  // --- 分类字典元数据 ---
  get categories() {
    return [
      { id: 'all', name: '全部类目', icon: '✨', color: '#18354a', bg: '#f1f5f9', border: '#e2e8f0' },
      { id: 'romantic', name: '浪漫约定', icon: '🎀', color: '#e11d48', bg: '#fff1f2', border: '#ffe4e6' },
      { id: 'travel', name: '环游世界', icon: '✈️', color: '#0284c7', bg: '#f0f9ff', border: '#e0f2fe' },
      { id: 'experience', name: '奇趣体验', icon: '🌟', color: '#7c3aed', bg: '#f5f3ff', border: '#ede9fe' },
      { id: 'growth', name: '精进成长', icon: '🎯', color: '#059669', bg: '#ecfdf5', border: '#d1fae5' },
      { id: 'home', name: '暖心安家', icon: '🏡', color: '#d97706', bg: '#fffbeb', border: '#fef3c7' },
      { id: 'other', name: '其他梦想', icon: '💫', color: '#4b5563', bg: '#f9fafb', border: '#f3f4f6' }
    ];
  }

  getCategoryMeta(catId) {
    return this.categories.find(c => c.id === catId) || this.categories[1];
  }

  // --- 归属人字典元数据 ---
  get owners() {
    return [
      { id: 'all', name: '全部归属', avatar: '✨' },
      { id: 'both', name: '两人共同', avatar: '👩‍❤️‍👨', short: '两人共同', tagClass: 'both' },
      { id: 'qiuhui', name: '杜秋慧', avatar: '👧', short: '秋慧专属', tagClass: 'qiuhui' },
      { id: 'yan', name: '王岩', avatar: '👦', short: '王岩专属', tagClass: 'yan' }
    ];
  }

  getOwnerMeta(ownerId) {
    return this.owners.find(o => o.id === ownerId) || this.owners[1];
  }

  // --- 灵感库预设数据 (60+ 经典精选) ---
  get inspirationBank() {
    return [
      // 两人共同 · 浪漫与约定
      { title: '去冰岛追一场漫天欧若拉极光', category: 'travel', owner: 'both', priority: 3, targetDate: '2027年冬天', desc: '在极夜星空与冰原下，牵手看漫天舞动的绿色光带。' },
      { title: '自驾穿越独库公路与伊犁空中草原', category: 'travel', owner: 'both', priority: 3, targetDate: '2027年夏天', desc: '一天领略四季，从雪山峡谷穿行至无垠的绿色花海。' },
      { title: '去看一场五月天或陈奕迅的现场演唱会', category: 'romantic', owner: 'both', priority: 2, targetDate: '2027年', desc: '在荧光棒的海洋里并肩大声合唱青春的歌。' },
      { title: '在海边并肩等一场日出与晚霞', category: 'romantic', owner: 'both', priority: 2, targetDate: '随时', desc: '听着海浪，从晨曦微露坐到夕阳西下。' },
      { title: '坐一次土耳其卡帕多奇亚的热气球', category: 'travel', owner: 'both', priority: 3, targetDate: '2028年前', desc: '清晨数百只热气球一同升空，俯瞰奇幻的喀斯特地貌。' },
      { title: '穿情侣厚毛衣在初雪的街头喝热红酒', category: 'romantic', owner: 'both', priority: 1, targetDate: '今年冬天', desc: '踩着松软的白雪，热气腾腾的肉桂香气弥漫四周。' },
      { title: '拍一套极简胶片风复古结婚照', category: 'romantic', owner: 'both', priority: 3, targetDate: '订婚/婚期', desc: '不落俗套的胶片质感，定格最真挚纯粹的笑容。' },
      { title: '挑战一次双人高空跳伞', category: 'experience', owner: 'both', priority: 3, targetDate: '30岁前', desc: '从4000米高空一跃而下，拥抱大地与强烈的失重尖叫！' },
      { title: '一起坐绿皮火车去西藏看布达拉宫', category: 'travel', owner: 'both', priority: 2, targetDate: '2028年', desc: '沿着青藏铁路漫行，在可可西里眺望藏羚羊与雪山。' },
      { title: '亲手用陶艺拉胚做一套专属情侣对杯', category: 'experience', owner: 'both', priority: 1, targetDate: '近期周末', desc: '沾满泥巴的双手和独一无二的弧度，每天喝水都甜甜的。' },
      { title: '连续一周放下手机，在山野间隐居慢生活', category: 'romantic', owner: 'both', priority: 2, targetDate: '度假时', desc: '晨起听鸟鸣，日暮煮清茶，只有彼此的对话。' },
      { title: '去现场看一次奥运会或世界杯关键比赛', category: 'experience', owner: 'both', priority: 2, targetDate: '未来', desc: '在山呼海啸的万人球场里共同呐喊助威。' },

      // 暖心安家
      { title: '拥有一间带着大落地窗和整墙书架的温馨小家', category: 'home', owner: 'both', priority: 3, targetDate: '2028年前', desc: '阳光洒满木地板，有舒适的独立咖啡角、大书桌和毛茸茸的地毯。' },
      { title: '在小家里领养一只可爱温顺的小布偶猫', category: 'home', owner: 'both', priority: 2, targetDate: '新家入住后', desc: '给它取个可爱的名字，每天下班回到家都有呼噜呼噜的小猫蹭蹭。' },
      { title: '带双方父母去一次惬意舒适的度假疗养旅行', category: 'home', owner: 'both', priority: 3, targetDate: '2027年秋', desc: '安排全程无忧的慢节奏行程，给长辈拍美美的合照，陪伴是最好的心意。' },
      { title: '在小家阳台打造属于两人的浪漫花园咖啡角', category: 'home', owner: 'both', priority: 2, targetDate: '新家入住后', desc: '种满迷迭香、绣球花和小番茄，周末手冲一杯拿铁。' },
      { title: '每年都为全家人拍摄一张高规格的全家福', category: 'home', owner: 'both', priority: 2, targetDate: '每年春节', desc: '时光慢慢走，记录岁月的痕迹与全家人的温情。' },
      { title: '学会做10道双方父母赞不绝口的拿手硬菜', category: 'home', owner: 'both', priority: 2, targetDate: '今年内', desc: '逢年过节亲自掌勺，一桌热气腾腾的家宴让全家暖胃暖心。' },

      // 杜秋慧专属 · 医科学术与个人高光
      { title: '成为一名温和且医术卓越的口腔临床正畸专家', category: 'growth', owner: 'qiuhui', priority: 3, targetDate: '终身追求', desc: '用专业与耐心为每一位患者重塑健康自信的笑容。' },
      { title: '发表高水平 SCI 学术论文并在全国口腔年会汇报', category: 'growth', owner: 'qiuhui', priority: 3, targetDate: '2027年春', desc: '踏实推进大创与临床科研课题，展现口腔医学学术风采。' },
      { title: '独立完成 50 例复杂疑难正畸/牙周综合诊疗病例', category: 'growth', owner: 'qiuhui', priority: 3, targetDate: '规培期间', desc: '精细操作每一个步骤，积累扎实扎手的临床手感。' },
      { title: '学会烤制口感蓬松完美的法式舒芙蕾松饼', category: 'experience', owner: 'qiuhui', priority: 1, targetDate: '随心尝试', desc: '云朵般轻盈细腻的口感，给周末早晨带来满满幸福感。' },
      { title: '打卡日本京都古寺并在枫叶季穿一次和服漫步', category: 'travel', owner: 'qiuhui', priority: 2, targetDate: '秋季', desc: '漫步二年坂三年坂与岚山竹林，看漫山红叶尽染。' },
      { title: '完成一次城市 10km 晨跑并打卡纪念奖牌', category: 'experience', owner: 'qiuhui', priority: 1, targetDate: '春秋季', desc: '感受运动挥洒汗水的快乐与多巴胺分泌的成就感。' },

      // 王岩专属 · 工科极客与冒险探索
      { title: '独立主导研发一套智能自主无人系统并在实装验证', category: 'growth', owner: 'yan', priority: 3, targetDate: '2026年', desc: '攻克运动规划与感知融合底层核心算法，打造稳定优雅的智能控制架构。' },
      { title: '考取 PADI 进阶潜水员执照 (AOW) 探访神秘沉船', category: 'experience', owner: 'yan', priority: 2, targetDate: '2027年', desc: '潜入蔚蓝的深海世界，在静谧的海洋深处感受水流与生命的律动。' },
      { title: '维护一个获得 500+ Star 的前沿开源技术项目', category: 'growth', owner: 'yan', priority: 2, targetDate: '2027年', desc: '用优雅的代码解决实际工程痛点，连接全球开发者。' },
      { title: '解锁高级黑道单板滑雪并在崇礼完成粉雪刷坡', category: 'experience', owner: 'yan', priority: 2, targetDate: '雪季', desc: '在茫茫雪道上风驰电掣，体验贴地飞行的快感。' },
      { title: '搭建属于自己的极客个人智能硬件工作台', category: 'growth', owner: 'yan', priority: 2, targetDate: '未来工位', desc: '示波器、电烙铁、3D打印机与多屏联动，随时把创意变成现实。' },
      { title: '乘坐直升机俯瞰火山与冰川全貌', category: 'travel', owner: 'yan', priority: 3, targetDate: '环球旅行时', desc: '在旋翼轰鸣中俯瞰地表最壮阔的地质奇观。' }
    ];
  }

  // --- 主渲染入口 ---
  render(container) {
    if (container) this.container = container;
    if (!this.container) return;

    const isMaster = window.spaceAuth ? window.spaceAuth.isMaster() : true;
    const allTodos = window.spaceStore ? window.spaceStore.getTodos() : [];

    // 严密访客过滤：非主人仅展示标记为 living_room 的公开愿望
    const visibleTodos = allTodos.filter(t => isMaster || t.visibility === 'living_room');

    // 统计计算
    const totalCount = visibleTodos.length;
    const completedCount = visibleTodos.filter(t => t.status === 'completed').length;
    const inProgressCount = visibleTodos.filter(t => t.status === 'in_progress').length;
    const pendingCount = visibleTodos.filter(t => t.status === 'pending' || !t.status).length;
    const pct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    // 筛选过滤
    const filteredTodos = this.getFilteredTodos(visibleTodos);

    this.container.innerHTML = `
      <div class="todo-container">
        
        <!-- 1. 统一主模块标头栏 -->
        <div class="oasis-header-bar">
          <div class="oasis-header-main">
            <div class="oasis-header-kicker">
              <svg class="ico" width="13" height="13" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
              <span>星光愿景 · 两个人的奔赴与一生的期许</span>
            </div>
            <h2 class="oasis-header-title">🌟 人生ToDo · 愿望清单</h2>
            <p class="oasis-header-sub">记录想一起看的世界、想共同实现的约定与彼此的人生追求</p>
          </div>
          <div class="oasis-header-actions">
            <button type="button" class="btn btn-outline btn-sm" id="btn-todo-inspiration">
              💡 愿望灵感库
            </button>
            <button type="button" class="btn btn-outline btn-sm" id="btn-todo-export" title="导出为美观文档">
              📥 导出清单
            </button>
            ${isMaster ? `
              <button type="button" class="btn btn-primary btn-sm" id="btn-todo-add">
                <svg class="ico" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>
                记下新愿望
              </button>
            ` : ''}
          </div>
        </div>

        <!-- 2. 顶部统揽进度与数据卡片 (Hero Stats Card) -->
        <div class="todo-hero-card">
          <div class="todo-hero-main">
            <div class="todo-hero-kicker">
              <span>💫 BUCKET LIST PROGRESS</span>
            </div>
            <h3 class="todo-hero-quote">步履不停，心愿会一个一个变成温暖的现实 ✨</h3>
            <p class="todo-hero-sub">已共同点亮 <strong>${completedCount}</strong> 个美好心愿，还有 <strong>${totalCount - completedCount}</strong> 处风景等待探寻</p>
            
            <div class="todo-progress-box">
              <div class="todo-progress-label">
                <span>总体圆梦进度</span>
                <span class="todo-progress-pct">${pct}% (${completedCount}/${totalCount})</span>
              </div>
              <div class="todo-progress-track">
                <div class="todo-progress-fill" style="width: ${pct}%;"></div>
              </div>
            </div>
          </div>

          <div class="todo-stats-grid">
            <div class="todo-stat-cell" data-filter-status="completed" title="点击筛选已圆梦">
              <span class="todo-stat-num achieved">${completedCount}</span>
              <span class="todo-stat-desc">🎉 已圆梦</span>
            </div>
            <div class="todo-stat-cell" data-filter-status="in_progress" title="点击筛选筹备中">
              <span class="todo-stat-num in-progress">${inProgressCount}</span>
              <span class="todo-stat-desc">🚀 筹备中</span>
            </div>
            <div class="todo-stat-cell" data-filter-status="pending" title="点击筛选待实现">
              <span class="todo-stat-num pending">${pendingCount}</span>
              <span class="todo-stat-desc">🌟 期待中</span>
            </div>
          </div>
        </div>

        <!-- 3. 多维度筛选器与实时搜索工具栏 -->
        <div class="todo-filter-panel">
          <!-- 归属行 (Who) -->
          <div class="todo-filter-row">
            <div class="todo-pill-group">
              <span class="todo-pill-label">归属：</span>
              ${this.owners.map(o => `
                <button type="button" class="todo-pill ${this.currentOwner === o.id ? 'active' : ''}" data-owner="${o.id}">
                  <span>${o.avatar}</span>
                  <span>${o.name}</span>
                </button>
              `).join('')}
            </div>

            <!-- 搜索框 -->
            <div class="todo-search-wrap">
              <svg class="todo-search-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
              <input type="text" class="todo-search-input" id="todo-search-input" placeholder="搜索心愿关键词..." value="${this.escapeHtml(this.searchKeyword)}">
            </div>
          </div>

          <!-- 分类与状态行 -->
          <div class="todo-filter-row">
            <div class="todo-pill-group">
              <span class="todo-pill-label">分类：</span>
              ${this.categories.map(c => `
                <button type="button" class="todo-pill ${this.currentCategory === c.id ? 'active' : ''}" data-category="${c.id}">
                  <span>${c.icon}</span>
                  <span>${c.name}</span>
                </button>
              `).join('')}
            </div>

            <div class="todo-pill-group">
              <span class="todo-pill-label">状态：</span>
              <button type="button" class="todo-pill mint ${this.currentStatus === 'all' ? 'active' : ''}" data-status="all">全部</button>
              <button type="button" class="todo-pill mint ${this.currentStatus === 'pending' ? 'active' : ''}" data-status="pending">🌟 期待中</button>
              <button type="button" class="todo-pill mint ${this.currentStatus === 'in_progress' ? 'active' : ''}" data-status="in_progress">🚀 筹备中</button>
              <button type="button" class="todo-pill mint ${this.currentStatus === 'completed' ? 'active' : ''}" data-status="completed">🎉 已圆梦</button>
            </div>
          </div>
        </div>

        <!-- 4. 心愿卡片网格列表 (Bucket List Grid) -->
        <div class="todo-grid">
          ${filteredTodos.length > 0 ? filteredTodos.map(todo => this.renderCard(todo, isMaster)).join('') : this.renderEmptyState(isMaster)}
        </div>

      </div>
    `;

    this.bindEvents(isMaster);
  }

  // --- 过滤逻辑 ---
  getFilteredTodos(list) {
    return list.filter(item => {
      // 归属过滤
      if (this.currentOwner !== 'all') {
        if (item.owner !== this.currentOwner) return false;
      }
      // 分类过滤
      if (this.currentCategory !== 'all') {
        if (item.category !== this.currentCategory) return false;
      }
      // 状态过滤
      if (this.currentStatus !== 'all') {
        const itemStatus = item.status || 'pending';
        if (itemStatus !== this.currentStatus) return false;
      }
      // 关键词搜索
      if (this.searchKeyword.trim()) {
        const kw = this.searchKeyword.toLowerCase().trim();
        const matchTitle = (item.title || '').toLowerCase().includes(kw);
        const matchDesc = (item.desc || '').toLowerCase().includes(kw);
        const matchLoc = (item.completedLocation || '').toLowerCase().includes(kw);
        const matchNote = (item.memoryNote || '').toLowerCase().includes(kw);
        if (!matchTitle && !matchDesc && !matchLoc && !matchNote) return false;
      }
      return true;
    }).sort((a, b) => {
      // 已圆梦排在后面，或按完成时间倒序
      if (a.status === 'completed' && b.status !== 'completed') return 1;
      if (a.status !== 'completed' && b.status === 'completed') return -1;
      // 待办/进行中按优先级倒序 (3星优先)
      const pDiff = (b.priority || 2) - (a.priority || 2);
      if (pDiff !== 0) return pDiff;
      // 相同优先级按创建时间倒序
      return (b.createdAt || '').localeCompare(a.createdAt || '');
    });
  }

  // --- 单个心愿卡片渲染 ---
  renderCard(todo, isMaster) {
    const isCompleted = todo.status === 'completed';
    const isInProgress = todo.status === 'in_progress';
    const statusClass = isCompleted ? 'status-completed' : (isInProgress ? 'status-in_progress' : 'status-pending');
    
    const ownerMeta = this.getOwnerMeta(todo.owner);
    const catMeta = this.getCategoryMeta(todo.category);
    const stars = '⭐'.repeat(Math.max(1, Math.min(3, todo.priority || 2)));

    return `
      <div class="todo-card ${statusClass}" data-id="${todo.id}">
        <!-- 头部徽章栏 -->
        <div class="todo-card-head">
          <div class="todo-card-tags">
            <span class="todo-owner-tag ${ownerMeta.tagClass}">
              <span>${ownerMeta.avatar}</span>
              <span>${ownerMeta.short}</span>
            </span>
            <span class="todo-cat-tag" style="background:${catMeta.bg}; color:${catMeta.color}; border-color:${catMeta.border};">
              <span>${catMeta.icon}</span>
              <span>${catMeta.name}</span>
            </span>
          </div>
          <div class="todo-stars" title="心动期待度：${todo.priority || 2}星">${stars}</div>
        </div>

        <!-- 标题与描述 -->
        <h4 class="todo-card-title">${this.escapeHtml(todo.title)}</h4>
        ${todo.desc ? `<p class="todo-card-desc">${this.escapeHtml(todo.desc)}</p>` : ''}

        <!-- 目标预期元信息 -->
        <div class="todo-card-meta">
          ${todo.targetDate ? `
            <span class="todo-target-time" title="计划/预期实现时间">
              <svg class="ico" width="12" height="12" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              <span>${this.escapeHtml(todo.targetDate)}</span>
            </span>
          ` : ''}

          ${isMaster ? `
            <span class="todo-visibility-tag" title="${todo.visibility === 'bedroom' ? '卧室私密（仅主人可见）' : '客厅公开（访客可见）'}">
              ${todo.visibility === 'bedroom' ? '🛏️ 私密' : '🛋️ 客厅'}
            </span>
          ` : ''}
        </div>

        <!-- 已圆梦专属高光块 (达成印章、地点、感言、纪念照) -->
        ${isCompleted ? `
          <div class="todo-achieved-box">
            <div class="todo-achieved-header">
              <span class="todo-stamp">
                <svg class="ico" width="12" height="12" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
                DREAM ACHIEVED
              </span>
              <span class="todo-achieved-date">
                ${todo.completedAt ? `达成于 ${this.escapeHtml(todo.completedAt)}` : '已点亮'}
                ${todo.completedLocation ? `· 📍 ${this.escapeHtml(todo.completedLocation)}` : ''}
              </span>
            </div>

            ${todo.memoryNote ? `
              <p class="todo-memory-quote">${this.escapeHtml(todo.memoryNote)}</p>
            ` : ''}

            ${todo.memoryPhoto ? `
              <div class="todo-memory-photo-thumb" data-photo="${this.escapeHtml(todo.memoryPhoto)}" title="点击查看大图">
                <img src="${this.escapeHtml(todo.memoryPhoto)}" alt="圆梦瞬间" loading="lazy">
                <span class="todo-photo-badge">📸 纪念瞬间</span>
              </div>
            ` : ''}
          </div>
        ` : ''}

        <!-- 底部操作按钮 -->
        <div class="todo-card-foot">
          <div class="todo-foot-left">
            ${isMaster ? `
              ${!isCompleted ? `
                <button type="button" class="btn-achieve" data-action="achieve" title="打卡圆梦，记录美好时刻">
                  🎉 打卡圆梦
                </button>
                <button type="button" class="btn-status-toggle" data-action="toggle-progress" title="切换期待/筹备状态">
                  ${isInProgress ? '🌟 设为待办' : '🚀 开启筹备'}
                </button>
              ` : `
                <button type="button" class="btn-status-toggle" data-action="edit-memory" title="修改圆梦回忆与照片">
                  ✍️ 编辑回忆
                </button>
              `}
            ` : `
              <span class="pill ${isCompleted ? 'good' : 'neutral'}" style="font-size:11px;">
                ${isCompleted ? '🎉 已圆梦' : (isInProgress ? '🚀 筹备中' : '🌟 期待中')}
              </span>
            `}
          </div>

          ${isMaster ? `
            <div class="todo-foot-right">
              <button type="button" class="btn-icon-soft" data-action="edit" title="编辑心愿">
                <svg class="ico" width="14" height="14" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              </button>
              <button type="button" class="btn-icon-soft delete" data-action="delete" title="删除心愿">
                <svg class="ico" width="14" height="14" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
              </button>
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }

  // --- 空状态 ---
  renderEmptyState(isMaster) {
    return `
      <div class="todo-empty-state">
        <div class="todo-empty-icon">🌟</div>
        <h4 class="todo-empty-title">当前筛选下暂无心愿</h4>
        <p class="todo-empty-text">生活是一场长途旅行，去想去的地方，做想做的事，记录下每一刻的心动与渴望。</p>
        <div style="display:flex; justify-content:center; gap:10px;">
          <button type="button" class="btn btn-outline btn-sm" id="btn-empty-inspo">💡 从灵感库挑选</button>
          ${isMaster ? `<button type="button" class="btn btn-primary btn-sm" id="btn-empty-add">+ 记下新愿望</button>` : ''}
        </div>
      </div>
    `;
  }

  // --- 事件绑定 ---
  bindEvents(isMaster) {
    if (!this.container) return;

    // 1. 归属切换
    this.container.querySelectorAll('[data-owner]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.currentOwner = btn.dataset.owner;
        this.render();
      });
    });

    // 2. 分类切换
    this.container.querySelectorAll('[data-category]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.currentCategory = btn.dataset.category;
        this.render();
      });
    });

    // 3. 状态切换
    this.container.querySelectorAll('[data-status]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.currentStatus = btn.dataset.status;
        this.render();
      });
    });

    // 3.1 点击 Hero 数据方块快捷筛选状态
    this.container.querySelectorAll('[data-filter-status]').forEach(cell => {
      cell.addEventListener('click', () => {
        this.currentStatus = cell.dataset.filterStatus;
        this.render();
      });
    });

    // 4. 实时搜索输入 (带轻微防抖)
    const searchInput = this.container.querySelector('#todo-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchKeyword = e.target.value;
        this.render();
        // 重新聚焦搜索框
        const newInp = this.container.querySelector('#todo-search-input');
        if (newInp) {
          newInp.focus();
          newInp.setSelectionRange(newInp.value.length, newInp.value.length);
        }
      });
    }

    // 5. 顶部按钮事件
    this.container.querySelector('#btn-todo-inspiration')?.addEventListener('click', () => {
      this.openInspirationModal();
    });
    this.container.querySelector('#btn-empty-inspo')?.addEventListener('click', () => {
      this.openInspirationModal();
    });
    this.container.querySelector('#btn-todo-add')?.addEventListener('click', () => {
      this.openEditModal();
    });
    this.container.querySelector('#btn-empty-add')?.addEventListener('click', () => {
      this.openEditModal();
    });
    this.container.querySelector('#btn-todo-export')?.addEventListener('click', () => {
      this.exportTodos();
    });

    // 6. 卡片点击与操作事件
    this.container.querySelectorAll('.todo-card').forEach(card => {
      const todoId = card.dataset.id;
      const allTodos = window.spaceStore ? window.spaceStore.getTodos() : [];
      const todo = allTodos.find(t => t.id === todoId);
      if (!todo) return;

      // 打卡圆梦
      card.querySelector('[data-action="achieve"]')?.addEventListener('click', () => {
        this.openAchieveModal(todo);
      });

      // 切换待办 / 筹备中
      card.querySelector('[data-action="toggle-progress"]')?.addEventListener('click', () => {
        const nextStatus = todo.status === 'in_progress' ? 'pending' : 'in_progress';
        window.spaceStore.updateTodo(todoId, { status: nextStatus });
        this.showToast(nextStatus === 'in_progress' ? '🚀 已将心愿设为“筹备中”' : '🌟 已重置为“期待中”');
        this.render();
      });

      // 编辑回忆与照片
      card.querySelector('[data-action="edit-memory"]')?.addEventListener('click', () => {
        this.openAchieveModal(todo);
      });

      // 编辑心愿
      card.querySelector('[data-action="edit"]')?.addEventListener('click', () => {
        this.openEditModal(todo);
      });

      // 删除心愿
      card.querySelector('[data-action="delete"]')?.addEventListener('click', () => {
        if (confirm(`确定要从清单中移除心愿「${todo.title}」吗？`)) {
          window.spaceStore.deleteTodo(todoId);
          this.showToast('🗑️ 心愿已移除');
          this.render();
        }
      });

      // 点击照片缩略图展开大图预览
      card.querySelector('.todo-memory-photo-thumb')?.addEventListener('click', (e) => {
        const imgUrl = e.currentTarget.dataset.photo;
        if (imgUrl) this.openPhotoLightbox(imgUrl, todo.title);
      });
    });
  }

  // --- 新建/编辑心愿弹窗 ---
  openEditModal(todo = null) {
    if (!window.spaceAuth || !window.spaceAuth.isMaster()) {
      this.showToast('🔑 仅卧室主人可添加或编辑心愿');
      return;
    }

    const isEdit = !!todo;
    const item = todo || {
      title: '',
      category: 'romantic',
      owner: 'both',
      priority: 2,
      status: 'pending',
      targetDate: '',
      desc: '',
      visibility: 'living_room'
    };

    const modalHtml = `
      <div class="overlay" id="modal-todo-edit">
        <div class="sheet" style="max-width: 520px;">
          <div class="sheet-head">
            <div>
              <h3>${isEdit ? '编辑心愿细节' : '✨ 记下新的心愿'}</h3>
              <div class="fine">人生ToDo · 记录两个人奔赴的美好与梦想</div>
            </div>
            <button type="button" class="logout" id="btn-edit-modal-close" style="font-size: 20px; line-height: 1;">×</button>
          </div>

          <form id="form-todo-edit" style="display:flex; flex-direction:column; gap:14px;">
            <div>
              <label class="form-label" for="edit-todo-title">心愿名称 *</label>
              <input type="text" class="input" id="edit-todo-title" required placeholder="如：去冰岛追一场欧若拉极光" value="${this.escapeHtml(item.title)}">
            </div>

            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:12px;">
              <div>
                <label class="form-label" for="edit-todo-owner">归属对象</label>
                <select class="input" id="edit-todo-owner">
                  <option value="both" ${item.owner === 'both' ? 'selected' : ''}>👩‍❤️‍👨 两人共同</option>
                  <option value="qiuhui" ${item.owner === 'qiuhui' ? 'selected' : ''}>👧 杜秋慧专属</option>
                  <option value="yan" ${item.owner === 'yan' ? 'selected' : ''}>👦 王岩专属</option>
                </select>
              </div>

              <div>
                <label class="form-label" for="edit-todo-category">心愿分类</label>
                <select class="input" id="edit-todo-category">
                  <option value="romantic" ${item.category === 'romantic' ? 'selected' : ''}>🎀 浪漫约定</option>
                  <option value="travel" ${item.category === 'travel' ? 'selected' : ''}>✈️ 环游世界</option>
                  <option value="experience" ${item.category === 'experience' ? 'selected' : ''}>🌟 奇趣体验</option>
                  <option value="growth" ${item.category === 'growth' ? 'selected' : ''}>🎯 精进成长</option>
                  <option value="home" ${item.category === 'home' ? 'selected' : ''}>🏡 暖心安家</option>
                  <option value="other" ${item.category === 'other' ? 'selected' : ''}>💫 其他梦想</option>
                </select>
              </div>
            </div>

            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:12px;">
              <div>
                <label class="form-label" for="edit-todo-priority">心动指数 (优先级)</label>
                <select class="input" id="edit-todo-priority">
                  <option value="3" ${item.priority === 3 ? 'selected' : ''}>⭐⭐⭐ 魂牵梦绕 · 必做</option>
                  <option value="2" ${(item.priority === 2 || !item.priority) ? 'selected' : ''}>⭐⭐ 满心期待 · 体验</option>
                  <option value="1" ${item.priority === 1 ? 'selected' : ''}>⭐ 随心探索 · 尝鲜</option>
                </select>
              </div>

              <div>
                <label class="form-label" for="edit-todo-target">计划/预期时间</label>
                <input type="text" class="input" id="edit-todo-target" placeholder="如：2027年冬天 / 30岁前" value="${this.escapeHtml(item.targetDate || '')}">
              </div>
            </div>

            <div>
              <label class="form-label" for="edit-todo-desc">心愿灵感与美好细节补充</label>
              <textarea class="input" id="edit-todo-desc" rows="3" placeholder="写下这个心愿背后的约定、灵感或具体构想...">${this.escapeHtml(item.desc || '')}</textarea>
            </div>

            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:12px;">
              <div>
                <label class="form-label" for="edit-todo-status">当前状态</label>
                <select class="input" id="edit-todo-status">
                  <option value="pending" ${item.status === 'pending' ? 'selected' : ''}>🌟 期待中</option>
                  <option value="in_progress" ${item.status === 'in_progress' ? 'selected' : ''}>🚀 筹备中</option>
                  <option value="completed" ${item.status === 'completed' ? 'selected' : ''}>🎉 已圆梦</option>
                </select>
              </div>

              <div>
                <label class="form-label" for="edit-todo-vis">访问隐私范围</label>
                <select class="input" id="edit-todo-vis">
                  <option value="living_room" ${item.visibility === 'living_room' ? 'selected' : ''}>🛋️ 客厅公开 (受邀访客可见)</option>
                  <option value="bedroom" ${item.visibility === 'bedroom' ? 'selected' : ''}>🛏️ 卧室私密 (仅主人可见)</option>
                </select>
              </div>
            </div>

            <div style="display:flex; justify-content:flex-end; gap:10px; margin-top:8px;">
              <button type="button" class="btn btn-outline" id="btn-edit-modal-cancel">取消</button>
              <button type="submit" class="btn btn-primary">
                ${isEdit ? '保存修改' : '✨ 铭刻进清单'}
              </button>
            </div>
          </form>
        </div>
      </div>
    `;

    this.renderModalContainer(modalHtml);

    const modal = document.getElementById('modal-todo-edit');
    const form = document.getElementById('form-todo-edit');
    const btnClose = document.getElementById('btn-edit-modal-close');
    const btnCancel = document.getElementById('btn-edit-modal-cancel');

    const closeModal = () => {
      modal?.remove();
    };

    btnClose?.addEventListener('click', closeModal);
    btnCancel?.addEventListener('click', closeModal);
    modal?.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });

    form?.addEventListener('submit', (e) => {
      e.preventDefault();
      const title = document.getElementById('edit-todo-title').value.trim();
      if (!title) return;

      const payload = {
        title,
        owner: document.getElementById('edit-todo-owner').value,
        category: document.getElementById('edit-todo-category').value,
        priority: Number(document.getElementById('edit-todo-priority').value),
        targetDate: document.getElementById('edit-todo-target').value.trim(),
        desc: document.getElementById('edit-todo-desc').value.trim(),
        status: document.getElementById('edit-todo-status').value,
        visibility: document.getElementById('edit-todo-vis').value
      };

      if (isEdit) {
        window.spaceStore.updateTodo(todo.id, payload);
        this.showToast('✓ 心愿已成功更新');
      } else {
        window.spaceStore.addTodo(payload);
        this.showToast('✨ 新心愿已记录入清单！');
      }

      closeModal();
      this.render();
    });
  }

  // --- 圆梦打卡庆祝弹窗 (Achieve Celebration Modal) ---
  openAchieveModal(todo) {
    if (!window.spaceAuth || !window.spaceAuth.isMaster()) {
      this.showToast('🔑 仅卧室主人可记录圆梦打卡');
      return;
    }

    const todayStr = window.spaceStore?.getTodayDate ? window.spaceStore.getTodayDate() : new Date().toISOString().split('T')[0];
    let photoBase64 = todo.memoryPhoto || '';

    const modalHtml = `
      <div class="overlay" id="modal-todo-achieve">
        <div class="sheet" style="max-width: 520px;">
          <div class="achieve-modal-hero">
            <div class="achieve-modal-icon">🎉</div>
            <h3 class="achieve-modal-title">恭喜圆梦！为你点亮这颗璀璨星光</h3>
            <p class="achieve-modal-sub">「${this.escapeHtml(todo.title)}」</p>
          </div>

          <form id="form-todo-achieve" style="display:flex; flex-direction:column; gap:14px;">
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:12px;">
              <div>
                <label class="form-label" for="achieve-date">圆梦达成日期 *</label>
                <input type="date" class="input" id="achieve-date" required value="${todo.completedAt || todayStr}">
              </div>

              <div>
                <label class="form-label" for="achieve-location">圆梦打卡地点 (可选)</label>
                <input type="text" class="input" id="achieve-location" placeholder="如：青岛石老人海湾" value="${this.escapeHtml(todo.completedLocation || '')}">
              </div>
            </div>

            <div>
              <label class="form-label" for="achieve-note">圆梦感言与回忆小记</label>
              <textarea class="input" id="achieve-note" rows="3" placeholder="那一刻的微风、手心的温度与难忘的心情...">${this.escapeHtml(todo.memoryNote || '')}</textarea>
            </div>

            <div>
              <label class="form-label">圆梦纪念瞬间照片 (可选)</label>
              <div class="todo-photo-uploader" id="achieve-photo-dropzone">
                <input type="file" id="achieve-photo-file" accept="image/*" style="display:none;">
                <div id="achieve-photo-placeholder" style="${photoBase64 ? 'display:none;' : ''}">
                  <div style="font-size:26px; margin-bottom:4px;">📸</div>
                  <div style="font-size:12.5px; font-weight:700; color:#18354a;">点击或拖拽上传现场照片</div>
                  <div class="fine">支持手机实拍或相册上传 · 自动压缩云端秒开</div>
                </div>
                <div id="achieve-photo-preview-wrap" class="todo-photo-preview-wrap" style="${photoBase64 ? '' : 'display:none;'}">
                  <img id="achieve-photo-img" src="${photoBase64}" alt="预览">
                  <button type="button" class="btn-remove-photo" id="btn-remove-achieve-photo" title="移除照片">×</button>
                </div>
              </div>
            </div>

            <div style="display:flex; justify-content:space-between; align-items:center; margin-top:8px;">
              ${todo.status === 'completed' ? `
                <button type="button" class="btn btn-outline btn-sm" id="btn-revert-pending" style="color:#a7464c;" title="将此心愿重新设为未完成">
                  ↩️ 重置为未完成
                </button>
              ` : '<div></div>'}

              <div style="display:flex; gap:10px;">
                <button type="button" class="btn btn-outline" id="btn-achieve-modal-cancel">取消</button>
                <button type="submit" class="btn btn-primary" style="background:#10b981; border-color:#10b981;">
                  🌟 确认点亮，铭刻回忆
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    `;

    this.renderModalContainer(modalHtml);

    const modal = document.getElementById('modal-todo-achieve');
    const form = document.getElementById('form-todo-achieve');
    const dropzone = document.getElementById('achieve-photo-dropzone');
    const fileInput = document.getElementById('achieve-photo-file');
    const previewWrap = document.getElementById('achieve-photo-preview-wrap');
    const placeholder = document.getElementById('achieve-photo-placeholder');
    const previewImg = document.getElementById('achieve-photo-img');
    const btnRemovePhoto = document.getElementById('btn-remove-achieve-photo');
    const btnCancel = document.getElementById('btn-achieve-modal-cancel');
    const btnRevert = document.getElementById('btn-revert-pending');

    const closeModal = () => modal?.remove();
    btnCancel?.addEventListener('click', closeModal);
    modal?.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });

    // 照片上传处理
    dropzone?.addEventListener('click', (e) => {
      if (e.target === btnRemovePhoto) return;
      fileInput?.click();
    });

    fileInput?.addEventListener('change', async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      try {
        const compressed = await this.compressImage(file);
        photoBase64 = compressed.dataUrl;
        previewImg.src = photoBase64;
        previewWrap.style.display = 'inline-block';
        placeholder.style.display = 'none';
      } catch (err) {
        this.showToast('图片加载失败，请重试');
      }
    });

    btnRemovePhoto?.addEventListener('click', (e) => {
      e.stopPropagation();
      photoBase64 = '';
      previewImg.src = '';
      previewWrap.style.display = 'none';
      placeholder.style.display = 'block';
      if (fileInput) fileInput.value = '';
    });

    // 重置为未完成
    btnRevert?.addEventListener('click', () => {
      if (confirm('确定要将该心愿重置为“期待中”吗？')) {
        window.spaceStore.updateTodo(todo.id, {
          status: 'pending',
          completedAt: null,
          completedLocation: '',
          memoryNote: '',
          memoryPhoto: ''
        });
        this.showToast('🌟 心愿已重置为待实现状态');
        closeModal();
        this.render();
      }
    });

    // 提交圆梦
    form?.addEventListener('submit', (e) => {
      e.preventDefault();
      const completedAt = document.getElementById('achieve-date').value;
      const completedLocation = document.getElementById('achieve-location').value.trim();
      const memoryNote = document.getElementById('achieve-note').value.trim();

      window.spaceStore.updateTodo(todo.id, {
        status: 'completed',
        completedAt,
        completedLocation,
        memoryNote,
        memoryPhoto: photoBase64
      });

      this.showToast('🎉 恭喜圆梦！心愿已被永恒点亮！');
      closeModal();
      this.render();
    });
  }

  // --- 愿望灵感库弹窗 (Inspiration Bank Modal) ---
  openInspirationModal() {
    const isMaster = window.spaceAuth ? window.spaceAuth.isMaster() : true;
    let selectedTab = 'all';

    const renderInspoList = (tab) => {
      const bank = this.inspirationBank;
      const filtered = tab === 'all' ? bank : bank.filter(item => {
        if (tab === 'both') return item.owner === 'both';
        if (tab === 'qiuhui') return item.owner === 'qiuhui';
        if (tab === 'yan') return item.owner === 'yan';
        return item.category === tab;
      });

      return filtered.map(item => {
        const catMeta = this.getCategoryMeta(item.category);
        const ownerMeta = this.getOwnerMeta(item.owner);

        return `
          <div class="todo-inspo-card">
            <div>
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
                <span class="todo-owner-tag ${ownerMeta.tagClass}" style="font-size:10.5px;">
                  ${ownerMeta.avatar} ${ownerMeta.short}
                </span>
                <span class="todo-cat-tag" style="background:${catMeta.bg}; color:${catMeta.color}; border-color:${catMeta.border}; font-size:10.5px;">
                  ${catMeta.icon} ${catMeta.name}
                </span>
              </div>
              <h5 class="todo-inspo-card-title">${this.escapeHtml(item.title)}</h5>
              <p class="todo-inspo-card-desc">${this.escapeHtml(item.desc)}</p>
            </div>
            <div class="todo-inspo-card-foot">
              <span class="fine" style="color:#718894;">预期：${this.escapeHtml(item.targetDate || '随心')}</span>
              ${isMaster ? `
                <button type="button" class="btn-adopt-inspo" data-inspo-title="${this.escapeHtml(item.title)}">
                  ✨ 采纳此心愿
                </button>
              ` : ''}
            </div>
          </div>
        `;
      }).join('');
    };

    const modalHtml = `
      <div class="overlay" id="modal-todo-inspiration">
        <div class="sheet" style="max-width: 680px;">
          <div class="sheet-head">
            <div>
              <h3>💡 人生心愿灵感库</h3>
              <div class="fine">精选 30+ 浪漫情侣/环球旅行/极致体验与学业高光灵感，一键加入清单</div>
            </div>
            <button type="button" class="logout" id="btn-inspo-modal-close" style="font-size: 20px; line-height: 1;">×</button>
          </div>

          <!-- 分类选项卡 -->
          <div class="todo-inspo-tabs">
            <button type="button" class="todo-pill active" data-inspo-tab="all">✨ 全部精选</button>
            <button type="button" class="todo-pill" data-inspo-tab="both">👩‍❤️‍👨 两人共同</button>
            <button type="button" class="todo-pill" data-inspo-tab="romantic">🎀 浪漫约定</button>
            <button type="button" class="todo-pill" data-inspo-tab="travel">✈️ 环游世界</button>
            <button type="button" class="todo-pill" data-inspo-tab="experience">🌟 奇趣体验</button>
            <button type="button" class="todo-pill" data-inspo-tab="home">🏡 暖心安家</button>
            <button type="button" class="todo-pill" data-inspo-tab="qiuhui">👧 秋慧专属</button>
            <button type="button" class="todo-pill" data-inspo-tab="yan">👦 王岩专属</button>
          </div>

          <!-- 灵感卡片网格容器 -->
          <div class="todo-inspo-grid" id="inspo-grid-container">
            ${renderInspoList('all')}
          </div>

          <div style="display:flex; justify-content:flex-end; margin-top:16px;">
            <button type="button" class="btn btn-outline" id="btn-inspo-modal-finish">关闭</button>
          </div>
        </div>
      </div>
    `;

    this.renderModalContainer(modalHtml);

    const modal = document.getElementById('modal-todo-inspiration');
    const btnClose = document.getElementById('btn-inspo-modal-close');
    const btnFinish = document.getElementById('btn-inspo-modal-finish');
    const gridContainer = document.getElementById('inspo-grid-container');

    const closeModal = () => modal?.remove();
    btnClose?.addEventListener('click', closeModal);
    btnFinish?.addEventListener('click', closeModal);
    modal?.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });

    // 选项卡切换
    modal.querySelectorAll('[data-inspo-tab]').forEach(tabBtn => {
      tabBtn.addEventListener('click', () => {
        modal.querySelectorAll('[data-inspo-tab]').forEach(b => b.classList.remove('active'));
        tabBtn.classList.add('active');
        selectedTab = tabBtn.dataset.inspoTab;
        if (gridContainer) {
          gridContainer.innerHTML = renderInspoList(selectedTab);
          bindAdoptButtons();
        }
      });
    });

    // 一键采纳事件绑定
    const bindAdoptButtons = () => {
      modal.querySelectorAll('[data-inspo-title]').forEach(btn => {
        btn.addEventListener('click', () => {
          const title = btn.dataset.inspoTitle;
          const found = this.inspirationBank.find(i => i.title === title);
          if (found) {
            closeModal();
            this.openEditModal({
              ...found,
              status: 'pending',
              visibility: 'living_room'
            });
          }
        });
      });
    };

    bindAdoptButtons();
  }

  // --- 照片全屏 Lightbox 预览 ---
  openPhotoLightbox(photoUrl, title = '') {
    const lightboxHtml = `
      <div class="todo-lightbox-overlay" id="todo-lightbox">
        <div class="todo-lightbox-box">
          <button type="button" class="todo-lightbox-close" id="btn-lightbox-close">×</button>
          <img src="${this.escapeHtml(photoUrl)}" class="todo-lightbox-img" alt="${this.escapeHtml(title)}">
          ${title ? `<div style="color:#ffffff; margin-top:10px; font-size:14px; font-weight:700;">${this.escapeHtml(title)}</div>` : ''}
        </div>
      </div>
    `;

    this.renderModalContainer(lightboxHtml);
    const overlay = document.getElementById('todo-lightbox');
    const closeBtn = document.getElementById('btn-lightbox-close');

    const closeLightbox = () => overlay?.remove();
    closeBtn?.addEventListener('click', closeLightbox);
    overlay?.addEventListener('click', (e) => {
      if (e.target === overlay) closeLightbox();
    });

    const keyHandler = (e) => {
      if (e.key === 'Escape') {
        closeLightbox();
        document.removeEventListener('keydown', keyHandler);
      }
    };
    document.addEventListener('keydown', keyHandler);
  }

  // --- 导出清单为 Markdown 文档 ---
  exportTodos() {
    const todos = window.spaceStore ? window.spaceStore.getTodos() : [];
    if (todos.length === 0) {
      this.showToast('清单为空，暂无可导出内容');
      return;
    }

    const completed = todos.filter(t => t.status === 'completed');
    const inProgress = todos.filter(t => t.status === 'in_progress');
    const pending = todos.filter(t => t.status === 'pending' || !t.status);

    let md = `# OASIS | Qiuhui & Yan 人生ToDo愿望清单\n\n`;
    md += `> 星辰大海，和你一步一步走过 ✨\n`;
    md += `> 导出时间：${new Date().toLocaleString()} · 总心愿数：${todos.length} · 已实现：${completed.length}\n\n`;

    md += `## 🎉 已圆梦星光 (${completed.length})\n\n`;
    if (completed.length === 0) {
      md += `*暂无已圆梦心愿*\n\n`;
    } else {
      completed.forEach((t, idx) => {
        md += `### ${idx + 1}. ${t.title} [已实现]\n`;
        md += `- **归属**：${this.getOwnerMeta(t.owner).name} | **分类**：${this.getCategoryMeta(t.category).name}\n`;
        if (t.completedAt) md += `- **实现日期**：${t.completedAt}${t.completedLocation ? ` · 📍 ${t.completedLocation}` : ''}\n`;
        if (t.memoryNote) md += `- **圆梦感言**：“${t.memoryNote}”\n`;
        if (t.desc) md += `- **心愿备注**：${t.desc}\n`;
        md += `\n`;
      });
    }

    md += `## 🚀 正在筹备中 (${inProgress.length})\n\n`;
    if (inProgress.length === 0) {
      md += `*暂无筹备中心愿*\n\n`;
    } else {
      inProgress.forEach((t, idx) => {
        md += `### ${idx + 1}. ${t.title}\n`;
        md += `- **归属**：${this.getOwnerMeta(t.owner).name} | **分类**：${this.getCategoryMeta(t.category).name} | **心动指数**：${'⭐'.repeat(t.priority || 2)}\n`;
        if (t.targetDate) md += `- **计划时间**：${t.targetDate}\n`;
        if (t.desc) md += `- **描述**：${t.desc}\n`;
        md += `\n`;
      });
    }

    md += `## 🌟 心动期待中 (${pending.length})\n\n`;
    if (pending.length === 0) {
      md += `*暂无期待中心愿*\n\n`;
    } else {
      pending.forEach((t, idx) => {
        md += `### ${idx + 1}. ${t.title}\n`;
        md += `- **归属**：${this.getOwnerMeta(t.owner).name} | **分类**：${this.getCategoryMeta(t.category).name} | **心动指数**：${'⭐'.repeat(t.priority || 2)}\n`;
        if (t.targetDate) md += `- **预期时间**：${t.targetDate}\n`;
        if (t.desc) md += `- **描述**：${t.desc}\n`;
        md += `\n`;
      });
    }

    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `OASIS_人生ToDo清单_${new Date().toISOString().split('T')[0]}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    this.showToast('📥 人生ToDo清单已成功导出！');
  }

  // --- 图片客户端轻量压缩工具 (限制最大 1200px, 保证流畅无卡顿) ---
  compressImage(fileOrUrl, maxWidth = 1200, maxHeight = 1200, quality = 0.8) {
    return new Promise((resolve, reject) => {
      const handleImage = (img) => {
        let width = img.naturalWidth || img.width;
        let height = img.naturalHeight || img.height;

        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        let dataUrl = canvas.toDataURL('image/webp', quality);
        if (!dataUrl.startsWith('data:image/webp')) {
          dataUrl = canvas.toDataURL('image/jpeg', quality);
        }
        resolve({ dataUrl, width, height });
      };

      if (typeof fileOrUrl === 'string') {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => handleImage(img);
        img.onerror = reject;
        img.src = fileOrUrl;
      } else {
        const reader = new FileReader();
        reader.onload = (e) => {
          const img = new Image();
          img.onload = () => handleImage(img);
          img.onerror = reject;
          img.src = e.target.result;
        };
        reader.onerror = reject;
        reader.readAsDataURL(fileOrUrl);
      }
    });
  }

  // 渲染弹窗容器辅助
  renderModalContainer(html) {
    const existing = document.querySelector('.overlay');
    if (existing) existing.remove();
    document.body.insertAdjacentHTML('beforeend', html);
  }

  // Toast 提示辅助
  showToast(msg) {
    if (window.spaceApp && window.spaceApp.showToast) {
      window.spaceApp.showToast(msg);
    } else {
      const toast = document.getElementById('toast');
      if (toast) {
        toast.innerText = msg;
        toast.style.opacity = '1';
        setTimeout(() => { toast.style.opacity = '0'; }, 2500);
      }
    }
  }

  // HTML 安全转义
  escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
}

// 实例化并挂载全局
window.todoModule = new TodoModule();
