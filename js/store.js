/**
 * OASIS | Qiuhui & Yan
 * 数据存储中心 (IndexedDB + LocalStorage)
 * 支持大体积压缩照片、双人独立简历 (Yan & Qiuhui) 与相册艺术风格偏好
 */

const DB_NAME = 'OASIS_COUPLE_SPACE_DB';
const DB_VERSION = 1;
const PHOTO_STORE = 'photos';

class SpaceStore {
  constructor() {
    this.db = null;
    this.dbReady = this.initIndexedDB();
    this.initDefaultStorage();
  }

  initIndexedDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(PHOTO_STORE)) {
          db.createObjectStore(PHOTO_STORE, { keyPath: 'id' });
        }
      };
      request.onsuccess = (e) => {
        this.db = e.target.result;
        resolve(this.db);
      };
      request.onerror = (e) => {
        console.error('IndexedDB 打开失败:', e);
        resolve(null);
      };
    });
  }

  initDefaultStorage() {
    // 1. 安全配置
    if (!localStorage.getItem('oasis_auth_config')) {
      const defaultAuth = {
        masterPassword: 'admin',
        guestPassword: 'guest888',
        guestUsageLimit: 20,
        guestUsedCount: 0,
        guestExpiryDate: '2027-12-31',
        rememberDays: 7
      };
      localStorage.setItem('oasis_auth_config', JSON.stringify(defaultAuth));
    }

    // 2. 默认相簿
    if (!localStorage.getItem('oasis_albums')) {
      const defaultAlbums = [
        {
          id: 'album_first_sight',
          title: '初见 · 记忆序曲',
          desc: '定格那些心动的瞬间，每一次相遇都值得被永远珍藏。',
          visibility: 'living_room',
          createdAt: '2024-02-14',
          count: 1
        },
        {
          id: 'album_sweet_life',
          title: '日常琐碎即是浪漫',
          desc: '关于一日三餐、四季更迭与我们的小小世界。',
          visibility: 'bedroom',
          createdAt: '2024-05-20',
          count: 0
        }
      ];
      localStorage.setItem('oasis_albums', JSON.stringify(defaultAlbums));
    }

    // 3. 默认时刻表
    if (!localStorage.getItem('oasis_timetables')) {
      const today = new Date().toISOString().split('T')[0];
      const defaultSchedules = [
        {
          id: 'sched_1',
          date: today,
          slot: 'morning',
          title: '晨光研磨咖啡 & 计划梳理',
          location: '书房 / 线上',
          participant: 'both',
          status: 'completed',
          notes: '梳理今天各自的工作要点与晚上聚餐安排',
          visibility: 'living_room'
        },
        {
          id: 'sched_2',
          date: today,
          slot: 'afternoon',
          title: '课题方案整理 & 实验验证',
          location: '智能无人船工程实验室',
          participant: 'yan',
          status: 'ongoing',
          notes: '测试松花湖湖试方案第二阶段通信延时',
          visibility: 'living_room'
        },
        {
          id: 'sched_3',
          date: today,
          slot: 'afternoon',
          title: '艺术设计与交互组件复盘',
          location: '创意工作室',
          participant: 'qiuhui',
          status: 'ongoing',
          notes: '优化情侣空间手账风格排版与相册卷轴展开动画',
          visibility: 'living_room'
        },
        {
          id: 'sched_4',
          date: today,
          slot: 'evening',
          title: '散步漫谈 & 周末露营采购',
          location: '湖滨步道 / 烘焙小馆',
          participant: 'both',
          status: 'pending',
          notes: '挑选露营用的野餐毯与手冲器具',
          visibility: 'bedroom'
        }
      ];
      localStorage.setItem('oasis_timetables', JSON.stringify(defaultSchedules));
    }

    // 4. 双人独立简历数据 (男主 Yan & 女主 Qiuhui 均支持独立保存与证件照)
    if (!localStorage.getItem('oasis_resumes_dual')) {
      const defaultDualResumes = {
        yan: {
          id: 'yan',
          avatar: '',
          basics: {
            name: '王琰 / Yan Wang',
            title: '嵌入式与无人控制系统算法工程师',
            email: 'yanwang20@mails.jlu.edu.cn',
            phone: '138-0000-0001',
            location: '中国 · 吉林长春',
            website: 'https://qiuhui0227.github.io',
            summary: '专注于无人系统、智能感知与嵌入式全栈开发。具备扎实的控制算法与软件架构设计能力，注重工程严谨性与跨端审美。'
          },
          education: [
            {
              school: '吉林大学 (Jilin University)',
              degree: '工学硕士在读',
              major: '控制工程 / 智能系统',
              period: '2023.09 - 2026.06',
              description: '主攻无人船外场仿真控制、传感器融合滤波与高可靠远程通信链路优化。'
            }
          ],
          work: [
            {
              company: '无人智能系统研发实验室',
              position: '控制算法与嵌入式负责人',
              period: '2024.03 - 至今',
              highlights: '主导江豚系列无人船 IPC 控制链重构；设计实战级湖试调度系统与高精度测控终端。'
            }
          ],
          projects: [
            {
              name: '江豚-16 无人船外场试验综合测控系统',
              role: '核心研发',
              period: '2026.05 - 2026.10',
              description: '基于 ROS2 与 Gazebo 搭建仿真与实船双向同步平台，设计低时延音视频遥测与双机热备架构。'
            },
            {
              name: 'OASIS 专属情侣空间系统',
              role: '架构与全栈开发',
              period: '2026.11 - 至今',
              description: '移植 USV Lab 工整秩序美学，集成客厅卧室双模门禁、双人独立简历与多风格艺术相簿。'
            }
          ],
          skills: [
            '编程语言: C/C++, Python, Linux Shell, JavaScript',
            '专业领域: 机器人运动规划, 传感器融合 (LiDAR / IMU), ROS2 / Gazebo 仿真',
            '工程素养: Git版本控制, 嵌入式全栈调试, 响应式现代化用户界面'
          ]
        },
        qiuhui: {
          id: 'qiuhui',
          avatar: '',
          basics: {
            name: '杜秋慧 / Qiuhui Du',
            title: '视觉传达与数字交互设计师',
            email: 'duqh9923@mails.jlu.edu.cn',
            phone: '138-0000-0002',
            location: '中国 · 吉林长春',
            website: 'https://qiuhui0227.github.io',
            summary: '专注于交互设计、视觉美学与数字体验建构。对色彩层次、手账艺术与排版秩序拥有敏锐洞察，善于以温度感赋予数字产品灵魂。'
          },
          education: [
            {
              school: '吉林大学 (Jilin University)',
              degree: '硕士在读',
              major: '设计艺术学 / 数字媒体交互',
              period: '2023.09 - 2026.06',
              description: '研究方向为人机情感化界面设计、手账视觉修辞与跨媒介信息架构。'
            }
          ],
          work: [
            {
              company: '数字媒体与情感设计工作室',
              position: '资深 UI/UX 设计师',
              period: '2024.04 - 至今',
              highlights: '负责数字生活类产品设计规范制定；主导多套高好评手账与国风卷轴数字化视觉资产落地。'
            }
          ],
          projects: [
            {
              name: 'OASIS 浪漫手账与古风卷轴视觉体系',
              role: '艺术设计主创',
              period: '2026.11 - 至今',
              description: '设计纸胶带、藏书印章、经折装与宣纸卷轴展开交互，将工整秩序感与手作温度感高度交融。'
            },
            {
              name: '智能人机协同系统交互界面',
              role: '界面主设计师',
              period: '2025.06 - 2025.12',
              description: '打造面向严苛户外环境的高对比度、易读性极佳的测控看板。'
            }
          ],
          skills: [
            '设计工具: Figma, Sketch, Photoshop, Illustrator, Procreate',
            '专业能力: 情感化交互设计, 视觉风格定义, 手账插画, 版式微排版',
            '跨界沟通: 熟悉前端 CSS Grid/Flexbox 还原规范与设计工程协同'
          ]
        }
      };
      localStorage.setItem('oasis_resumes_dual', JSON.stringify(defaultDualResumes));
    }

    // 5. 默认相册艺术风格 (classic, scroll, accordion, scrapbook)
    if (!localStorage.getItem('oasis_album_style')) {
      localStorage.setItem('oasis_album_style', 'scrapbook'); // 默认手账风格，惊艳浪漫
    }
  }

  // --- 照片操作 (IndexedDB) ---
  async savePhoto(photo) {
    await this.dbReady;
    if (!this.db) return null;
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction([PHOTO_STORE], 'readwrite');
      const store = tx.objectStore(PHOTO_STORE);
      const req = store.put(photo);
      req.onsuccess = () => resolve(photo);
      req.onerror = (e) => reject(e);
    });
  }

  async getPhotosByAlbum(albumId) {
    await this.dbReady;
    if (!this.db) return [];
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction([PHOTO_STORE], 'readonly');
      const store = tx.objectStore(PHOTO_STORE);
      const req = store.getAll();
      req.onsuccess = () => {
        const all = req.result || [];
        resolve(all.filter(p => p.albumId === albumId));
      };
      req.onerror = (e) => reject(e);
    });
  }

  async deletePhoto(photoId) {
    await this.dbReady;
    if (!this.db) return;
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction([PHOTO_STORE], 'readwrite');
      const store = tx.objectStore(PHOTO_STORE);
      const req = store.delete(photoId);
      req.onsuccess = () => resolve(true);
      req.onerror = (e) => reject(e);
    });
  }

  // --- 相簿操作 ---
  getAlbums() {
    try {
      return JSON.parse(localStorage.getItem('oasis_albums')) || [];
    } catch (e) {
      return [];
    }
  }

  saveAlbums(albums) {
    localStorage.setItem('oasis_albums', JSON.stringify(albums));
  }

  // 相册艺术风格偏好
  getAlbumStyle() {
    return localStorage.getItem('oasis_album_style') || 'scrapbook';
  }

  saveAlbumStyle(style) {
    localStorage.setItem('oasis_album_style', style);
  }

  // --- 时刻表操作 ---
  getTimetables() {
    try {
      return JSON.parse(localStorage.getItem('oasis_timetables')) || [];
    } catch (e) {
      return [];
    }
  }

  saveTimetables(timetables) {
    localStorage.setItem('oasis_timetables', JSON.stringify(timetables));
  }

  // --- 双人独立简历操作 (支持独立保存与证件照) ---
  getDualResumes() {
    try {
      return JSON.parse(localStorage.getItem('oasis_resumes_dual')) || {};
    } catch (e) {
      return {};
    }
  }

  getResume(person = 'yan') {
    let dual = this.getDualResumes();
    if (!dual || !dual[person]) {
      this.initDefaultStorage();
      dual = this.getDualResumes();
    }
    return dual[person] || dual.yan || { basics: { name: person === 'yan' ? '王琰' : '杜秋慧' } };
  }

  saveResume(person = 'yan', data) {
    const dual = this.getDualResumes();
    dual[person] = data;
    localStorage.setItem('oasis_resumes_dual', JSON.stringify(dual));
  }

  // --- 认证配置操作 ---
  getAuthConfig() {
    try {
      return JSON.parse(localStorage.getItem('oasis_auth_config')) || {};
    } catch (e) {
      return {};
    }
  }

  saveAuthConfig(config) {
    localStorage.setItem('oasis_auth_config', JSON.stringify(config));
  }
}

window.spaceStore = new SpaceStore();
