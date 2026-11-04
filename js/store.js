/**
 * OASIS | Qiuhui & Yan
 * 数据存储中心 (IndexedDB + LocalStorage)
 * 支持大体积压缩照片、双人独立简历 (王岩 & 杜秋慧) 与相册艺术风格偏好
 */

const DB_NAME = 'OASIS_COUPLE_SPACE_DB';
const DB_VERSION = 1;
const PHOTO_STORE = 'photos';
const RESUME_STORAGE_VERSION = '20261105_v4_medical_omfs';

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

  getDefaultResumes() {
    return {
      yan: {
        id: 'yan',
        avatar: '',
        basics: {
          name: '王岩 / Yan Wang',
          title: '嵌入式与无人控制系统算法工程师',
          email: 'yanwang20@mails.jlu.edu.cn',
          phone: '138-0000-0001',
          location: '中国 · 吉林长春',
          website: 'https://iqiuqiu.me',
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
        isMedicalCV: true,
        basics: {
          name: '杜秋慧 / [待填写]',
          title: '吉林大学白求恩口腔医学院 · 口腔医学“5+3”一体化（2022级·大四）',
          target: '口腔颌面外科（硕士阶段） | 意向导师：吴国民 教授 / 主任医师',
          school: '吉林大学白求恩口腔医学院',
          phone: '[待填写]',
          email: '[待填写，建议填吉大校园邮箱]',
          location: '吉林省长春市 · 吉林大学白求恩口腔医学院',
          politics: '[共青团员/中共预备党员/待填写]',
          summary: '吉林大学口腔医学“5+3”一体化大四在读。大三年级综合排名 2/39（前5%），连续三年获学业奖学金；大一通过大学英语六级（CET-6 507分）。获全国大学生生命科学竞赛省级三等奖，完成基础科研与大创训练。担任口腔临床实习组长，工作严谨负责，具备良好的团队协同与抗压能力。对口腔颌面外科临床及科研具有极高热情，渴望在吴国民老师指导下进一步深造。'
        },
        education: [
          {
            school: '吉林大学 (Jilin University) · 白求恩口腔医学院',
            degree: '本硕连读 (5+3一体化)',
            major: '口腔医学专业 (大四在读)',
            period: '2022.09 - 至今',
            ranking: '大三综合排名 2 / 39 (年级前 5%)',
            cet6: 'CET-6 507分 (大一首考一次性通过)',
            description: '学业成绩呈阶梯式稳步上升（大一大二综合排名均位居年级前列约第10名，大三跃升至第2名）；大一入学首考通过大学英语六级，具备流利研读国际口腔医学英文前沿文献能力。核心主修：口腔颌面外科学、口腔解剖生理学、口腔组织病理学、人体系统解剖学、诊断学、外科总论等（成绩优良）。'
          }
        ],
        honors: [
          {
            period: '2024 – 2025 学年（大三）',
            title: '综合排名 2/39 优异成绩；获评校级优秀学生 / 优秀学业一等奖学金 [待填具体奖项名称]'
          },
          {
            period: '2023 – 2024 学年（大二）',
            title: '吉林大学校三等奖学金（学年综合排名前列，约 10/39）'
          },
          {
            period: '2022 – 2023 学年（大一）',
            title: '吉林大学校二等奖学金（学年综合排名前列，约 10/39）'
          }
        ],
        research: [
          {
            name: '全国大学生生命科学竞赛 (CULSC) · 吉林省赛区',
            role: '项目团队成员 | 省级三等奖',
            period: '2024年',
            description: '作为核心成员全程参与，协助完成实验前置英文文献检索、实验设计讨论及数据记录复核；系统经历科学探索完整流程，培养了求真务实的科研态度与团队协作素养。'
          },
          {
            name: '大学生创新创业训练项目《随行精灵》',
            role: '项目组员 (指导教师：王红波 老师)',
            period: '2025年',
            description: '在指导教师带领下参与项目论证、临床需求调研与方案框架构建；锻炼跨学科解决实际问题的敏锐度与执行推进能力 [项目成果与结题状态待后续补充]。'
          },
          {
            name: '口腔医学“5+3”基础科研技能实训与学术方法积累',
            role: '科研实训生',
            period: '2023 – 2024年',
            description: '系统接受医学院基础实验规范化实训，掌握无菌操作、PCR 基因扩增、细胞培养等基础实验原理；熟练构建 PubMed、Web of Science 检索式，定期追踪颌面外科高水平文献。'
          }
        ],
        clinical: [
          {
            hospital: '吉林大学口腔医院各临床专科实习',
            role: '担任【口腔实习组长】',
            period: '2025.07 – 至今',
            highlights: '受聘担任实习组长，负责统筹轮转考勤、带教任务传达、病例讨论组织与沟通协调，具备强烈的责任心与抗压协作意识；系统在口腔颌面外科、牙体牙髓、修复等科室见习观摩与操作辅助，熟悉门诊接诊、无菌器械准备、拔牙器械配合与颌面 CBCT 读片识图。'
          },
          {
            hospital: '综合医院大临床科室轮转见习 (心血管内科、肝胆外科等)',
            role: '临床见习生',
            period: '2024.09 – 2025.06',
            highlights: '跟随带教老师病房查房与疑难病例讨论，系统掌握住院病历规范书写、术前评估、生命体征监测；在指导下规范执行外科无菌换药与清创切开缝合基本功，为颌面外科围手术期综合管理打下扎实基石。'
          }
        ],
        skills: [
          '专业素养: 严格恪守外科无菌观念，熟练掌握口腔专科器械操作规范、打结缝合基本功、住院病历书写规范及医患沟通技巧。',
          '科研与制图: 接触并能运用 BioRender 绘制生物医学机制通路图；熟练运用 EndNote 进行引文管理，具备基础 SPSS 统计检验素养。',
          '学术志向: 对口腔颌面外科（颌面创伤整形、颌面骨缺损重建与组织修复）怀有高度学术热爱。渴望在吴国民老师指导下，通过严谨求实的临床实践与扎实深入的课题训练，全面提升疑难病症诊疗能力与转化医学科研潜能。',
          '社会实践: 受聘担任吉林大学防艾同伴教育宣传员，开展健康科普宣传；曾任新媒体部成员，积极参与无偿献血与志愿服务，具备踏实奉献品格。'
        ]
      }
    };
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

    // 2. 默认相簿 (包含横竖屏风格)
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
          title: '课题方案整理 & 仿真建模',
          location: '工程控制中心 / 线上',
          participant: 'yan',
          status: 'ongoing',
          notes: '测试松花湖湖试方案第二阶段通信延时',
          visibility: 'living_room'
        },
        {
          id: 'sched_3',
          date: today,
          slot: 'afternoon',
          title: '口腔临床查房与病例讨论',
          location: '口腔颌面外科病区',
          participant: 'qiuhui',
          status: 'ongoing',
          notes: '整理颌骨骨折复位固定及游离皮瓣修复术前讨论资料',
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

    // 4. 双人独立简历数据 (强版本迁移，确保最新医学生学术范式与王岩数据立即生效)
    const storedVersion = localStorage.getItem('oasis_resumes_dual_version');
    const existingDual = localStorage.getItem('oasis_resumes_dual');

    if (!existingDual || storedVersion !== RESUME_STORAGE_VERSION) {
      localStorage.setItem('oasis_resumes_dual', JSON.stringify(this.getDefaultResumes()));
      localStorage.setItem('oasis_resumes_dual_version', RESUME_STORAGE_VERSION);
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
      req.onerror = () => resolve([]);
    });
  }

  async deletePhoto(photoId) {
    await this.dbReady;
    if (!this.db) return false;
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

  // --- 双人独立简历操作 ---
  getDualResumes() {
    try {
      return JSON.parse(localStorage.getItem('oasis_resumes_dual')) || this.getDefaultResumes();
    } catch (e) {
      return this.getDefaultResumes();
    }
  }

  getResume(person = 'yan') {
    let dual = this.getDualResumes();
    if (!dual || !dual[person]) {
      this.initDefaultStorage();
      dual = this.getDualResumes();
    }
    return dual[person] || dual.yan || this.getDefaultResumes()[person];
  }

  saveResume(person = 'yan', data) {
    // 兼容性保护：若只传了一个参数（如整份简历对象），自适应识别所属人物
    if (typeof person === 'object' && !data) {
      data = person;
      person = data.id || (data.isMedicalCV ? 'qiuhui' : 'yan');
    }
    const dual = this.getDualResumes();
    dual[person] = data;
    localStorage.setItem('oasis_resumes_dual', JSON.stringify(dual));
  }

  resetDefaultResume(person = 'qiuhui') {
    const defaults = this.getDefaultResumes();
    const dual = this.getDualResumes();
    dual[person] = defaults[person];
    localStorage.setItem('oasis_resumes_dual', JSON.stringify(dual));
    return dual[person];
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
