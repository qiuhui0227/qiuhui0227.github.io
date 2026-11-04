/**
 * OASIS | Qiuhui & Yan
 * 数据存储中心 (IndexedDB + LocalStorage)
 * 支持大体积压缩照片持久化存储，以及时刻表、相册元数据、简历与安全配置
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

  // 初始化 IndexedDB (用于存储大体积 Base64 图片)
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
        console.error('IndexedDB 打开失败，降级使用内存模式:', e);
        resolve(null);
      };
    });
  }

  // 初始化默认配置与种子数据
  initDefaultStorage() {
    // 1. 安全与权限配置
    if (!localStorage.getItem('oasis_auth_config')) {
      const defaultAuth = {
        masterPassword: 'admin',      // 主人密码 (卧室全权限)
        guestPassword: 'guest888',    // 来宾密码 (客厅受限访问)
        guestUsageLimit: 20,          // 允许最大使用次数 (-1 表示无限制)
        guestUsedCount: 0,            // 已使用次数
        guestExpiryDate: '2027-12-31',// 来宾密码有效截止日期
        rememberDays: 7
      };
      localStorage.setItem('oasis_auth_config', JSON.stringify(defaultAuth));
    }

    // 2. 默认相册元数据 (相册一本一本)
    if (!localStorage.getItem('oasis_albums')) {
      const defaultAlbums = [
        {
          id: 'album_first_sight',
          title: '初见 · 记忆序曲',
          desc: '定格那些心动的瞬间，每一次相遇都值得被永远珍藏。',
          coverPhotoId: 'photo_init_01',
          visibility: 'living_room', // 'living_room' (客厅开放) | 'bedroom' (仅卧室私密)
          createdAt: '2024-02-14',
          count: 1
        },
        {
          id: 'album_sweet_life',
          title: '日常琐碎即是浪漫',
          desc: '关于一日三餐、四季更迭与我们的小小世界。',
          coverPhotoId: '',
          visibility: 'bedroom',     // 卧室私密
          createdAt: '2024-05-20',
          count: 0
        }
      ];
      localStorage.setItem('oasis_albums', JSON.stringify(defaultAlbums));
    }

    // 3. 默认共享时刻表 (早中晚时段 + 实验室预约看板质感)
    if (!localStorage.getItem('oasis_timetables')) {
      const today = new Date().toISOString().split('T')[0];
      const defaultSchedules = [
        {
          id: 'sched_1',
          date: today,
          slot: 'morning', // 'morning' | 'afternoon' | 'evening'
          title: '晨光研磨咖啡 & 计划梳理',
          location: '书房 / 线上',
          participant: 'both', // 'yan' | 'qiuhui' | 'both'
          status: 'completed', // 'pending' | 'ongoing' | 'completed'
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
          notes: '优化情侣空间移动端配色与照片墙拍立得动效',
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

    // 4. 默认简历数据
    if (!localStorage.getItem('oasis_resume_data')) {
      const defaultResume = {
        basics: {
          name: '王琰 / Yan Wang',
          title: '嵌入式与智能控制算法工程师',
          email: 'yanwang20@mails.jlu.edu.cn',
          phone: '138-xxxx-xxxx',
          location: '中国 · 长春',
          website: 'https://qiuhui0227.github.io',
          summary: '专注于无人系统、智能感知与嵌入式全栈开发。具备扎实的控制算法与软件架构设计能力，注重工程落地与跨端交互审美。'
        },
        education: [
          {
            school: '吉林大学 (Jilin University)',
            degree: '硕士在读',
            major: '控制工程 / 智能系统',
            period: '2023.09 - 2026.06',
            description: '重点研究无人船外场仿真控制、多传感器融合与长效通信链路优化。'
          }
        ],
        work: [
          {
            company: '无人智能系统研发实验室',
            position: '算法与嵌入式负责人',
            period: '2024.03 - 至今',
            highlights: '主导江豚系列无人船 IPC 通信控制链重构；设计实战级湖试调度系统与高精度测控终端。'
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
            name: 'OASIS 双人协作与私密空间系统',
            role: '全栈架构',
            period: '2026.11 - 至今',
            description: '采用纯静态托管 + 隐私隔离设计，包含客厅/卧室分权、早中晚网格看板与客户端无损简历导出引擎。'
          }
        ],
        skills: [
          '技术栈: C/C++, Python, ROS2, Linux, Qt, JavaScript/HTML5',
          '专业技能: 运动控制规划, 传感器融合滤波 (LiDAR/IMU), 嵌入式系统调优',
          '工程素养: Git版本协作, 自动化流水线, 响应式用户界面设计'
        ]
      };
      localStorage.setItem('oasis_resume_data', JSON.stringify(defaultResume));
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

  async getPhotoById(photoId) {
    await this.dbReady;
    if (!this.db) return null;
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction([PHOTO_STORE], 'readonly');
      const store = tx.objectStore(PHOTO_STORE);
      const req = store.get(photoId);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    });
  }

  // --- 相册操作 (LocalStorage) ---
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

  // --- 简历操作 ---
  getResume() {
    try {
      return JSON.parse(localStorage.getItem('oasis_resume_data')) || {};
    } catch (e) {
      return {};
    }
  }

  saveResume(resume) {
    localStorage.setItem('oasis_resume_data', JSON.stringify(resume));
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
