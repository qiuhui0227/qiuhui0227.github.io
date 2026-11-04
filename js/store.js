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
          style: 'scrapbook',
          createdAt: '2024-02-14',
          count: 1
        },
        {
          id: 'album_sweet_life',
          title: '日常琐碎即是浪漫',
          desc: '关于一日三餐、四季更迭与我们的小小世界。',
          visibility: 'bedroom',
          style: 'scroll',
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
            name: '王岩 / Yan Wang',
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
            title: '吉林大学 口腔医学（5+3一体化）| 意向导师：吴国民 教授',
            email: '[待填写，建议填吉大校园邮箱]',
            phone: '[待填写]',
            location: '吉林省长春市 · 吉林大学白求恩口腔医学院',
            website: '意向方向：口腔颌面外科 / 颌面整形与组织修复',
            summary: '吉林大学口腔医学“5+3”一体化大四在读。大三年级综合排名 2/39（前5%），连续三年获学业奖学金；大一通过大学英语六级（CET-6 507分）。获全国大学生生命科学竞赛省级三等奖，完成基础科研与大创训练。担任口腔临床实习组长，工作严谨负责，具备良好的团队协同与抗压能力。对口腔颌面外科临床及科研具有极高热情，渴望在吴国民老师指导下进一步深造。'
          },
          education: [
            {
              school: '吉林大学 (Jilin University) · 白求恩口腔医学院',
              degree: '本硕连读（5+3一体化）大四在读',
              major: '口腔医学 (Stomatology)',
              period: '2022.09 - 至今',
              description: '大三学年综合排名：2 / 39 (Top 5%)；大一大二连续获校二等/三等奖学金；大学英语六级 CET-6 (507分，大一通过)。核心主修：口腔颌面外科学、口腔解剖生理学、口腔组织病理学、人体系统解剖学、诊断学、外科总论等。'
            }
          ],
          work: [
            {
              company: '吉林大学口腔医院 / 综合临床医院',
              position: '口腔实习组长 / 临床轮转见习生',
              period: '2025.07 - 至今',
              highlights: '担任实习组长，协助科室带教老师统筹组内轮转日程与病区协调；先后在口腔各专科及心内科、肝胆外科等临床科室轮转见习，熟悉外科无菌规范、换药拆线、病历规范书写及术前评估流程，具备严谨敏锐的临床思维与医患沟通素养。'
            }
          ],
          projects: [
            {
              name: '全国大学生生命科学竞赛 (CULSC)',
              role: '项目团队核心成员 | 省级三等奖',
              period: '2024.03 - 2024.11',
              description: '围绕生命科学前沿问题开展实验探索，协助完成实验前置文献调研、实验设计与数据复核，荣获吉林赛区省级三等奖。'
            },
            {
              name: '大学生创新创业训练项目《随行精灵》',
              role: '项目核心成员 (指导教师：王红波 老师)',
              period: '2025.01 - 至今',
              description: '在指导教师带领下开展创新项目方案论证、用户需求调研与功能框架搭建，锻炼跨学科团队协作与项目执行推进能力。'
            },
            {
              name: '白求恩口腔医学院“5+3”科研基本技能实训',
              role: '学术实训生',
              period: '2023.09 - 2024.06',
              description: '系统接受医学分子生物学、细胞培养、PCR 实验等科研基础操作规范训练，熟练运用 PubMed/Web of Science 开展医学英文文献检索与学术精读。'
            }
          ],
          skills: [
            '临床素养: 口腔颌面外科局部解剖基础、无菌操作规范、清创缝合、外科病历书写',
            '科研技能: BioRender 生物医学机制通路图绘制、SPSS 基础统计、EndNote 文献管理',
            '外语能力: 大学英语六级 (CET-6 507分，大一首考通过)，可流畅精读国际口腔医学英文文献 (SCI)',
            '综合荣誉: 2024-2025学年 综合排名 2/39；连续获校二等/三等奖学金；校艾滋病防治同伴教育宣传员'
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
      const albums = JSON.parse(localStorage.getItem('oasis_albums')) || [];
      return albums.map(a => {
        if (!a.style) {
          a.style = (a.id === 'album_sweet_life') ? 'scroll' : 'scrapbook';
        }
        return a;
      });
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
    return dual[person] || dual.yan || { basics: { name: person === 'yan' ? '王岩' : '杜秋慧' } };
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
