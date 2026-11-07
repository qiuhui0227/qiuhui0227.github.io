/**
 * OASIS | Qiuhui & Yan
 * 数据存储中枢与持久化适配器
 * 
 * 升级特性：
 * 1. 履历文库 / 像书本一样多简历体系 (oasis_resume_books)：
 *    - 男女主人各自拥有多份简历（书架管理模式）
 *    - 涵盖不同风格场景：招聘简历(job)、申请奖学金简历(scholarship)、找导师简历(advisor)
 *    - 支持以已有简历为蓝本复制新建，自动带入基础个人信息
 *    - 普适化、标准化示范文案，杜绝过度个人隐私或偏门内容
 * 2. 日程排期纯净化：
 *    - 移除所有初始样例模拟数据，默认为干净的空排期
 *    - 新建日程默认均为卧室私密模式 (bedroom)
 * 3. 兼容双模门禁、双人独立密码与多访客体系
 */

const DB_NAME = 'oasis_media_db';
const DB_VERSION = 1;
const PHOTO_STORE = 'photos';

class SpaceStore {
  constructor() {
    this.db = null;
    const isVpsOrigin = typeof window !== 'undefined' && window.location && (
      window.location.hostname.includes('iqiuqiu.me') ||
      window.location.hostname === '8.220.209.101' ||
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1'
    );
    // 权威主服务器：同源优先直连，外域 (如 qiuhui0227.github.io) 统一无缝直连 https://iqiuqiu.me 独立 VPS
    this.cloudBaseUrl = isVpsOrigin ? window.location.origin : 'https://iqiuqiu.me';
    this.cloudFallbackUrl = 'https://api.iqiuqiu.me';
    this.activeCloudUrl = this.cloudBaseUrl;
    this.syncStatus = 'idle';
    this.lastSyncTime = null;
    this.syncDebounceTimer = null;
    this.dbReady = this.initIndexedDB();
    this.initDefaultStorage();
    this.initCloudSync();
  }

  // --- IndexedDB 媒体离线引擎 ---
  initIndexedDB() {
    return new Promise((resolve) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onerror = (e) => {
        console.error('IndexedDB open error:', e);
        resolve(null);
      };
      request.onsuccess = (e) => {
        this.db = e.target.result;
        resolve(this.db);
      };
      request.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(PHOTO_STORE)) {
          const store = db.createObjectStore(PHOTO_STORE, { keyPath: 'id' });
          store.createIndex('albumId', 'albumId', { unique: false });
          store.createIndex('createdAt', 'createdAt', { unique: false });
        }
      };
    });
  }

  async savePhoto(photoObj) {
    await this.dbReady;
    if (!this.db) return false;
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction([PHOTO_STORE], 'readwrite');
      const store = tx.objectStore(PHOTO_STORE);
      const req = store.put(photoObj);
      req.onsuccess = () => resolve(true);
      req.onerror = (e) => reject(e);
    });
  }

  async getPhotosByAlbum(albumId) {
    await this.dbReady;
    if (!this.db) return [];
    return new Promise((resolve) => {
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

  // --- 标准普适化简历多书本模板生成器 ---
  getDefaultResumeBooks() {
    const todayStr = new Date().toISOString().split('T')[0];

    return {
      yan: [
        {
          id: 'res_yan_job',
          owner: 'yan',
          title: '工科与软件工程 · 重点名企/大厂求职通用版',
          style: 'job',
          themeColor: '#1e3a8a',
          updatedAt: todayStr,
          avatar: '',
          basics: {
            name: '王岩',
            gender: '男',
            birthDate: '2001-08',
            phone: '138-0000-0000',
            email: 'yanwang@alumni.univ.edu.cn',
            school: '重点大学 · 计算机与软件工程学院',
            major: '软件工程 / 智能系统与控制',
            degree: '硕士研究生 (在读)',
            target: '软件研发工程师 / 算法与嵌入式研发岗位',
            politicalStatus: '共青团员',
            gpaRank: 'GPA 3.82 / 前 5%',
            englishLevel: 'CET-6 (570+)',
            nativePlace: '吉林长春'
          },
          education: [
            {
              school: '重点大学 (一流大学建设高校)',
              degree: '工学硕士在读',
              major: '软件工程 / 智能控制与机器人系统',
              period: '2023.09 - 2026.06',
              gpa: '3.85 / 4.0 (专业前 5%)',
              desc: '主修课程：分布式系统设计、现代控制理论、机器人学、嵌入式Linux系统架构。'
            },
            {
              school: '重点大学 (一流学科建设高校)',
              degree: '工学学士',
              major: '计算机科学与技术',
              period: '2019.09 - 2023.06',
              gpa: '3.78 / 4.0 (连续三年学业奖学金)',
              desc: '主修课程：数据结构与算法、计算机操作系统、计算机网络、C++程序设计、软件工程导论。'
            }
          ],
          experiences: [
            {
              org: '智能装备与无人系统研发组',
              role: '算法与软件工程组骨干',
              period: '2023.10 - 至今',
              bullets: [
                '负责智能无人装备底层感知融合与运动规划算法设计，完成与上位机控制协议全链路联调。',
                '主导搭建轻量化跨平台数据通信中间件，实现高并发传感器数据（IMU/激光雷达）的低延迟回传，传输延迟降低约 35%。',
                '编写规范完备的工程开发与接口API文档，配合团队完成多轮外场综合实测与系统稳定性验收。'
              ]
            },
            {
              org: '高新科技企业研发中心 (实习)',
              role: '后端研发实习生',
              period: '2022.07 - 2022.11',
              bullets: [
                '参与核心业务服务模块的微服务架构重构，利用消息队列优化数据异步处理管道。',
                '协助排查生产环境内存泄漏与接口超时瓶颈，优化高频SQL查询与缓存策略，系统QPS提升近 40%。'
              ]
            }
          ],
          projects: [
            {
              name: '自主无人系统轨迹规划与协同仿真平台',
              role: '核心研发人员',
              period: '2024.03 - 2024.12',
              keywords: 'C++, ROS2, Gazebo, 运动控制',
              bullets: [
                '基于 ROS2 与 Gazebo 搭建高保真动力学仿真环境，实现复杂障碍物场景下的动态避障与路径平滑重规划。',
                '针对实车算力受限条件，对优化算法进行矩阵加速与轻量化裁剪，单帧解算时间稳定在 15ms 以内。'
              ]
            }
          ],
          honors: [
            { date: '2024', title: '研究生国家奖学金 / 校级学业一等奖学金', level: '国家级 / 校级', desc: '综合素质测评与学业位次均位居年级前列' },
            { date: '2023', title: '全国大学生数学建模竞赛省级一等奖', level: '省部级', desc: '负责算法设计、数学模型推导与论文主体撰写' },
            { date: '2022', title: '校级优秀学生标兵 & 优秀共青团员', level: '校级', desc: '德智体综合表现优异' }
          ],
          publications: [
            { authors: '王岩 (学生一作), 指导教师等', title: '基于改进状态预测算法的移动平台运动控制优化', journal: '自动化与控制工程学报', year: '2024', status: '已发表' },
            { authors: '王岩等', title: '一种面向嵌入式系统的轻量级时序数据滤波传输方法', journal: '国家发明专利', year: '2024', status: '实审公开' }
          ],
          studentWork: [
            { org: '研究生党支部 / 团总支', role: '组织委员 / 青年志愿者骨干', period: '2023.09 - 2025.06', desc: '组织多期学术沙龙与技术分享会，累计志愿服务时长超 60 小时。' }
          ],
          skills: [
            '编程语言: 扎实掌握 C/C++、Python、Linux Shell，熟悉现代 JavaScript / Web 技术栈',
            '专业领域: 机器人运动规划、传感器融合滤波 (LiDAR/IMU)、嵌入式通信协议 (CAN/UART/TCP)',
            '工程素养: 熟练使用 Git、Docker、Linux 核心调试工具，遵循严格的敏捷开发与规范注释习惯',
            '语言能力: 英语 CET-6 (具备良好的英文技术文档阅读与英文论文写作交流能力)'
          ],
          selfEvaluation: '具备扎实的计算机与控制工程基础，擅长复杂工程问题的逻辑拆解与全栈落地。求真务实，注重代码可读性与系统稳定性，富有团队协同精神与高强度科研攻坚抗压能力。'
        },
        {
          id: 'res_yan_scholarship',
          owner: 'yan',
          title: '学业特等奖学金与国家奖学金申报自述',
          style: 'scholarship',
          themeColor: '#881337',
          updatedAt: todayStr,
          avatar: '',
          basics: {
            name: '王岩',
            gender: '男',
            birthDate: '2001-08',
            phone: '138-0000-0000',
            email: 'yanwang@alumni.univ.edu.cn',
            school: '重点大学 · 计算机与软件工程学院',
            major: '软件工程 / 智能控制',
            degree: '硕士研究生 (在读)',
            target: '研究生国家奖学金 / 学业特等奖学金申报',
            politicalStatus: '中共党员 (或中共预备党员)',
            gpaRank: 'GPA 3.90 / 4.0 (专业前 2%)',
            englishLevel: 'CET-6',
            nativePlace: '吉林长春'
          },
          education: [
            {
              school: '重点大学',
              degree: '工学硕士在读',
              major: '软件工程',
              period: '2023.09 - 2026.06',
              gpa: '3.90 / 4.0 (专业第 1 名)',
              desc: '所修 12 门学位核心课均在 90 分以上，核心课均分 93.6 分。'
            }
          ],
          experiences: [],
          projects: [
            {
              name: '国家级科研课题支撑子课题研发',
              role: '学生主要负责人',
              period: '2023.10 - 2024.11',
              keywords: '控制算法, 实时优化',
              bullets: ['高质量推进阶段性里程碑验收，核心指标超出预期，发表高水平核心论文 1 篇。']
            }
          ],
          honors: [
            { date: '2024', title: '研究生国家奖学金', level: '国家级', desc: '全学院综合评定第一名获得' },
            { date: '2024', title: '校级三好学生标兵称号', level: '校级', desc: '表彰在思想道德与学业科研方面表现卓越的学生' },
            { date: '2023', title: '全国大学生数学建模竞赛一等奖', level: '省部级', desc: '团队主力' }
          ],
          publications: [
            { authors: '王岩等', title: '面向复杂工况的嵌入式智能感知控制系统设计', journal: '控制与决策', year: '2024', status: '已收录' }
          ],
          studentWork: [
            { org: '院研究生学生会', role: '学术部部长', period: '2023.09 - 2024.06', desc: '统筹组织全院学术年会与学术讲座 16 场，受到师生广泛好评。' }
          ],
          skills: ['核心课程全优', '国家级学科竞赛获奖', '中共党员思想端正'],
          selfEvaluation: '思想端正，严于律己，始终以严谨求实的科学态度钻研专业学业。乐于奉献，积极投身班级与学院公共事务，德智体美劳全面发展。'
        },
        {
          id: 'res_yan_advisor',
          owner: 'yan',
          title: '学术科研与博士/名师课题组申请学术自述',
          style: 'advisor',
          themeColor: '#134e4a',
          updatedAt: todayStr,
          avatar: '',
          basics: {
            name: '王岩',
            gender: '男',
            birthDate: '2001-08',
            phone: '138-0000-0000',
            email: 'yanwang@alumni.univ.edu.cn',
            school: '重点大学 · 计算机与软件工程学院',
            major: '软件工程 / 控制工程',
            degree: '工学硕士 (拟申请博士 / 课题组)',
            target: '智能装备与无人自主系统 · 意向课题组攻读',
            politicalStatus: '中共党员',
            gpaRank: 'GPA 3.88 / 专业前 3%',
            englishLevel: 'CET-6 (570+)',
            nativePlace: '吉林长春'
          },
          education: [
            {
              school: '重点大学',
              degree: '工学硕士',
              major: '控制工程与软件系统',
              period: '2023.09 - 2026.06',
              gpa: '3.88 / 4.0',
              desc: '系统学习现代控制理论、凸优化方法、机器人运动规划及传感器信息融合等主干理论。'
            }
          ],
          experiences: [],
          projects: [
            {
              name: '复杂非结构化环境自主感知与智能避障系统',
              role: '课题核心研究成员',
              period: '2024.01 - 2025.03',
              keywords: 'LiDAR-SLAM, 轨迹规划, 嵌入式控制',
              bullets: [
                '深入研读自主系统国际前沿文献，独立实现经典规划算法复现并进行收敛性优化改进。',
                '具备完整的软硬件一体化实操经验，具备从数学模型构建到工程代码落地的全闭环科研能力。'
              ]
            }
          ],
          honors: [
            { date: '2024', title: '校级优秀学术论文一等奖', level: '校级', desc: '学术成果评审位列前茅' }
          ],
          publications: [
            { authors: '王岩 (一作) 等', title: 'Robust Motion Planning in Uncertain Dynamics', journal: 'IEEE / 核心学术期刊在投', year: '2025', status: 'Under Review' }
          ],
          studentWork: [],
          skills: [
            '扎实的数理基础与推导能力，熟练运用 MATLAB / Python 进行算法仿真建模与数据统计',
            '熟练阅读高水平外文期刊文献，具备良好的英文科技论文撰写能力与学术表达素养'
          ],
          selfEvaluation: '对智能自主系统领域怀有持久的研究热忱，作风严谨求真，具有较强的独立发现问题与跨学科攻关能力。若有幸加入课题组，将恪尽职守，全力投入高水平科研产出。'
        }
      ],
      qiuhui: [
        {
          id: 'res_qh_advisor',
          owner: 'qiuhui',
          title: '临床医学/口腔医学 · 优秀导师与课题组联系学术简历',
          style: 'advisor',
          themeColor: '#134e4a',
          updatedAt: todayStr,
          avatar: '',
          basics: {
            name: '杜秋慧',
            gender: '女',
            birthDate: '2003-02',
            phone: '156-0000-0000',
            email: 'qiuhui@mails.jlu.edu.cn',
            school: '一流医科大学 · 白求恩口腔医学院',
            major: '口腔医学（“5+3”一体化培养）',
            degree: '医学学士在读 / 拟攻读硕士学位',
            target: '口腔颌面外科 / 口腔正畸学 专业/学术型硕士研究生意向',
            politicalStatus: '共青团员 / 入党积极分子',
            gpaRank: 'GPA 3.86 / 4.0 (专业前 5%)',
            englishLevel: 'CET-6 (560+)',
            nativePlace: '吉林长春'
          },
          education: [
            {
              school: '一流医科大学 (白求恩医学部 / 重点大学)',
              degree: '口腔医学“5+3”一体化培养在读',
              major: '口腔医学专业',
              period: '2022.09 - 至今',
              gpa: '3.86 / 4.0 (连续获校级学业一等奖学金)',
              desc: '主修课程：系统解剖学、局部解剖学、病理生理学、口腔解剖生理学、口腔组织病理学、口腔颌面外科学、牙体牙髓病学、口腔修复学等，专业核心课均分 91 分以上。'
            }
          ],
          experiences: [
            {
              org: '大学附属口腔医院 (三甲口腔专科医院)',
              role: '临床科室实习轮转',
              period: '2025.03 - 至今',
              bullets: [
                '在带教教师指导下规范进行门诊病史采集、口腔专科临床检查与电子病历规范化书写。',
                '熟练掌握无菌原则与口腔感染控制规范，掌握标准橡皮障隔离技术、制取印模及基础阻生牙拔除术前准备。',
                '协助上级医师完成门诊颌面部小肿物切除及缝合操作，手术作风严谨稳健。'
              ]
            }
          ],
          projects: [
            {
              name: '大学生创新创业训练计划项目 (省级/国家级培育课题)',
              role: '核心研究成员',
              period: '2024.03 - 2025.04',
              keywords: '颌骨骨再生, 组织工程, 生物材料',
              bullets: [
                '参与实验技术路线设计与方案论证，查阅研读高水平 PubMed 外文文献 40 余篇并完成文献综述撰写。',
                '在实验室老师指导下规范掌握动物细胞复苏、传代培养、成骨诱导分化及茜素红染色实验技能。',
                '协助完成实时荧光定量 PCR (RT-qPCR) 及 Western Blot 样本预处理与实验数据统计分析。'
              ]
            }
          ],
          honors: [
            { date: '2024', title: '校级学业一等奖学金 & 优秀学生', level: '校级', desc: '综合素质测评位列年级前列' },
            { date: '2023', title: '国家励志奖学金', level: '国家级', desc: '表彰学习成绩优异且综合表现突出的学子' },
            { date: '2023', title: '白求恩医学基础知识竞赛二等奖', level: '校级', desc: '基础医学理论知识扎实' }
          ],
          publications: [
            { authors: '杜秋慧等 (共同作者)', title: '骨组织工程生物活性支架在骨缺损修复中的研究进展', journal: '口腔医学前沿期刊在审', year: '2024', status: '审稿中' }
          ],
          studentWork: [
            { org: '医学院青年志愿者协会 / 团支部', role: '宣传委员 / 口腔健康义诊骨干', period: '2022.10 - 至今', desc: '组织进社区、敬老院开展口腔健康科普义诊与宣教活动 10 余场，累计志愿服务 80 小时。' }
          ],
          skills: [
            '临床操作: 严格遵循无菌原则，掌握规范口腔检查、缝合打结、病历书写及基础门诊操作技能',
            '科研实验: 掌握基础细胞生物学实验操作、引物设计、GraphPad Prism 数据统计与作图分析',
            '外语交流: 英语 CET-6 (560+)，能熟练阅读专业英文 SCI 医学文献并进行规范书面交流'
          ],
          selfEvaluation: '热爱医学事业，秉承白求恩“对工作极端的负责任，对同志对人民极端的热忱”精神。为人踏实勤勉，科研思维活跃且动手操作规范。渴望在研究生阶段跟随导师潜心专研临床与科学问题，为口腔医学事业贡献扎实力量。'
        },
        {
          id: 'res_qh_scholarship',
          owner: 'qiuhui',
          title: '国家奖学金 / 校级特等学业奖学金申报自述',
          style: 'scholarship',
          themeColor: '#881337',
          updatedAt: todayStr,
          avatar: '',
          basics: {
            name: '杜秋慧',
            gender: '女',
            birthDate: '2003-02',
            phone: '156-0000-0000',
            email: 'qiuhui@mails.jlu.edu.cn',
            school: '一流医科大学 · 白求恩口腔医学院',
            major: '口腔医学一体化培养',
            degree: '医学学士在读',
            target: '国家奖学金 / 校级特等学业奖学金申报',
            politicalStatus: '入党积极分子 / 共青团员',
            gpaRank: 'GPA 3.88 / 4.0 (专业前 3%)',
            englishLevel: 'CET-6',
            nativePlace: '吉林长春'
          },
          education: [
            {
              school: '一流医科大学',
              degree: '口腔医学一体化培养在读',
              major: '口腔医学',
              period: '2022.09 - 至今',
              gpa: '3.88 / 4.0',
              desc: '德育考核满分，连续两年综合测评成绩与学业排名稳居专业前 3%。'
            }
          ],
          experiences: [],
          projects: [
            {
              name: '大学生创新创业训练重点科研项目',
              role: '核心骨干',
              period: '2024.03 - 2024.12',
              keywords: '基础医学研究',
              bullets: ['高质量完成课题结题答辩，参与发表学术成果。']
            }
          ],
          honors: [
            { date: '2024', title: '校级一等学业奖学金', level: '校级', desc: '学业成绩优异' },
            { date: '2023', title: '国家励志奖学金', level: '国家级', desc: '国家级荣誉' },
            { date: '2023', title: '校级优秀学生标兵', level: '校级', desc: '综合素质全面过硬' }
          ],
          publications: [],
          studentWork: [
            { org: '班级团支部', role: '团支书 / 宣传委员', period: '2022.09 - 2024.06', desc: '带领班级团支部获评“五四红旗团支部”，组织多次医学生社区义诊与无偿献血。' }
          ],
          skills: ['核心医学课程名列前茅', '积极投身基层医疗宣教与社会公益'],
          selfEvaluation: '思想上积极要求进步，时刻以一名优秀医学生标准严格律己。学风严谨求真，敬畏生命，心怀仁爱，立志成为一名兼具精湛医术与崇高医德的好医生。'
        },
        {
          id: 'res_qh_job',
          owner: 'qiuhui',
          title: '三甲医院规范化培训 / 口腔临床医师应聘简历',
          style: 'job',
          themeColor: '#1e3a8a',
          updatedAt: todayStr,
          avatar: '',
          basics: {
            name: '杜秋慧',
            gender: '女',
            birthDate: '2003-02',
            phone: '156-0000-0000',
            email: 'qiuhui@mails.jlu.edu.cn',
            school: '一流医科大学 · 白求恩口腔医学院',
            major: '口腔医学',
            degree: '医学学士',
            target: '三甲医院住院医师规范化培训学员 / 口腔科临床医师',
            politicalStatus: '共青团员',
            gpaRank: 'GPA 3.85 / 4.0',
            englishLevel: 'CET-6',
            nativePlace: '吉林长春'
          },
          education: [
            {
              school: '一流医科大学',
              degree: '医学学士',
              major: '口腔医学专业',
              period: '2022.09 - 2027.06',
              gpa: '3.85 / 4.0',
              desc: '系统接受口腔临床各亚专科理论教学与临床技能实训。'
            }
          ],
          experiences: [
            {
              org: '大学附属口腔医院',
              role: '临床实习医师',
              period: '2025.01 - 至今',
              bullets: [
                '熟练配合完成口腔颌面外科常见门诊手术、牙槽外科手术及术后创口护理。',
                '严格执行医疗核心制度与病历书写规范，医患沟通耐心细致，无任何医疗差错或纠纷记录。'
              ]
            }
          ],
          projects: [],
          honors: [
            { date: '2024', title: '口腔医学院临床技能操作比赛二等奖', level: '校级', desc: '无菌操作与缝合手法规范稳健' }
          ],
          publications: [],
          studentWork: [],
          skills: [
            '掌握口腔颌面外科、牙体牙髓科、牙周科及口腔修复科常见病的诊疗规范',
            '具备良好的医患沟通能力与团队协作意识，持有规培所需的相关资质证明材料'
          ],
          selfEvaluation: '做事认真细致，执行力强，对临床医疗工作充满热忱。遵守医疗规范，具备良好的应急处置能力与强烈的责任担当意识。'
        }
      ]
    };
  }

  // --- 初始化系统默认数据 ---
  initDefaultStorage() {
    // 1. 安全配置与双人独立主人密码 + 多访客体系
    let authConfig = this.getAuthConfig();
    let needSaveAuth = false;

    if (!authConfig || Object.keys(authConfig).length === 0) {
      authConfig = {
        version: '20261105_v5_multi_account',
        masterPasswords: {
          yan: 'adminwy',      // 男主初始密码
          qiuhui: 'adminqh'    // 女主初始密码
        },
        guestAccounts: [
          {
            id: 'guest_default',
            name: '亲友通用通行证',
            code: 'guest888',
            usageLimit: 20,
            usedCount: 0,
            expiryDate: '2027-12-31',
            createdAt: new Date().toISOString().split('T')[0]
          }
        ]
      };
      needSaveAuth = true;
    } else {
      if (!authConfig.masterPasswords) {
        authConfig.masterPasswords = {
          yan: 'adminwy',
          qiuhui: 'adminqh'
        };
        needSaveAuth = true;
      } else {
        if (!authConfig.masterPasswords.yan) authConfig.masterPasswords.yan = 'adminwy';
        if (!authConfig.masterPasswords.qiuhui) authConfig.masterPasswords.qiuhui = 'adminqh';
      }

      if (!Array.isArray(authConfig.guestAccounts)) {
        authConfig.guestAccounts = [
          {
            id: 'guest_default',
            name: '亲友通用通行证',
            code: authConfig.guestPassword || 'guest888',
            usageLimit: authConfig.guestUsageLimit ?? 20,
            usedCount: authConfig.guestUsedCount || 0,
            expiryDate: authConfig.guestExpiryDate || '2027-12-31',
            createdAt: new Date().toISOString().split('T')[0]
          }
        ];
        needSaveAuth = true;
      }
    }

    if (needSaveAuth) {
      this.saveAuthConfig(authConfig);
    }

    // 2. 相簿初始化 (绝不自动创建虚假默认相簿，仅保留用户真实创建的相册)
    const existingAlbums = localStorage.getItem('oasis_albums');
    if (!existingAlbums) {
      localStorage.setItem('oasis_albums', JSON.stringify([]));
    } else {
      try {
        const parsed = JSON.parse(existingAlbums);
        const sampleIds = new Set(['album_sweet_life', 'album_travel_notes', 'album_accordion_memories']);
        const cleaned = (Array.isArray(parsed) ? parsed : []).filter(a => a && !sampleIds.has(a.id));
        localStorage.setItem('oasis_albums', JSON.stringify(cleaned));
      } catch (e) {
        localStorage.setItem('oasis_albums', JSON.stringify([]));
      }
    }

    // 2.1 三餐数据清理 (彻底剔除误插入的 meal_init_01，严格保留用户实际拍摄的照片)
    const existingMeals = localStorage.getItem('oasis_meals');
    if (existingMeals) {
      try {
        const parsedMeals = JSON.parse(existingMeals);
        if (Array.isArray(parsedMeals)) {
          const cleanedMeals = parsedMeals.filter(m => m && m.id && m.id !== 'meal_init_01');
          localStorage.setItem('oasis_meals', JSON.stringify(cleanedMeals));
        }
      } catch (_) {}
    }

    // 3. 日程排期数据初始化 (彻底清空旧样例数据，纯净初始状态)
    const existingTimetables = localStorage.getItem('oasis_timetables');
    if (!existingTimetables) {
      localStorage.setItem('oasis_timetables', JSON.stringify([]));
    } else {
      try {
        const parsed = JSON.parse(existingTimetables);
        const sampleIds = new Set(['sched_1', 'sched_2', 'sched_3', 'sched_4']);
        const cleaned = parsed.filter(item => 
          !sampleIds.has(item.id) && 
          !item.title?.includes('复杂疑难病例示教讨论') && 
          !item.title?.includes('散步漫谈 & 周末露营采购') &&
          !item.title?.includes('自制手冲咖啡 & 松花湖测试') &&
          !item.title?.includes('无人船自主航行算法')
        );
        localStorage.setItem('oasis_timetables', JSON.stringify(cleaned));
      } catch (e) {
        localStorage.setItem('oasis_timetables', JSON.stringify([]));
      }
    }

    // 4. 履历文库 / 像书本一样多简历体系 (oasis_resume_books)
    const existingBooks = localStorage.getItem('oasis_resume_books');
    const defaultBooks = this.getDefaultResumeBooks();

    if (!existingBooks) {
      // 检查是否有历史单份简历数据进行平滑迁移
      const legacyDual = localStorage.getItem('oasis_resumes_dual');
      if (legacyDual) {
        try {
          const parsedLegacy = JSON.parse(legacyDual);
          if (parsedLegacy.yan && defaultBooks.yan[0]) {
            defaultBooks.yan[0].basics = { ...defaultBooks.yan[0].basics, ...(parsedLegacy.yan.basics || {}) };
            if (parsedLegacy.yan.avatar) defaultBooks.yan[0].avatar = parsedLegacy.yan.avatar;
          }
          if (parsedLegacy.qiuhui && defaultBooks.qiuhui[0]) {
            defaultBooks.qiuhui[0].basics = { ...defaultBooks.qiuhui[0].basics, ...(parsedLegacy.qiuhui.basics || {}) };
            if (parsedLegacy.qiuhui.avatar) defaultBooks.qiuhui[0].avatar = parsedLegacy.qiuhui.avatar;
          }
        } catch (e) {}
      }
      localStorage.setItem('oasis_resume_books', JSON.stringify(defaultBooks));
      localStorage.setItem('oasis_resume_books_version', '20261105_v6_books');
    } else {
      try {
        const parsed = JSON.parse(existingBooks);
        if (!Array.isArray(parsed.yan) || !Array.isArray(parsed.qiuhui)) {
          localStorage.setItem('oasis_resume_books', JSON.stringify(defaultBooks));
        }
      } catch (e) {
        localStorage.setItem('oasis_resume_books', JSON.stringify(defaultBooks));
      }
    }

    // 5. 人生ToDo / 星光愿景与心愿清单初始化 (oasis_todos)
    const existingTodos = localStorage.getItem('oasis_todos');
    if (!existingTodos) {
      localStorage.setItem('oasis_todos', JSON.stringify(this.getDefaultTodos()));
    }
  }

  // --- 相簿操作 (自动规避 Unsplash 阻断网络，秒开零延迟) ---
  getAlbums() {
    try {
      const albums = JSON.parse(localStorage.getItem('oasis_albums')) || [];
      return albums.map(a => {
        if (!a.style) {
          a.style = (a.id === 'album_sweet_life') ? 'scroll' : 'scrapbook';
        }
        if (a.cover && a.cover.includes('unsplash.com')) {
          a.cover = './images/1001_1_thumb.jpg';
        }
        if (a.coverUrl && a.coverUrl.includes('unsplash.com')) {
          a.coverUrl = './images/1001_1_thumb.jpg';
        }
        return a;
      });
    } catch (e) {
      return [];
    }
  }

  saveAlbums(albums) {
    localStorage.setItem('oasis_albums', JSON.stringify(albums));
    try { this.scheduleCloudPush(); } catch (_) {}
  }

  async deleteAlbum(id) {
    const list = this.getAlbums().filter(a => a.id !== id);
    this.saveAlbums(list);
    try {
      const photos = await this.getPhotosByAlbum(id);
      for (const p of photos) {
        await this.deletePhoto(p.id);
      }
    } catch (_) {}
    return list;
  }

  saveAlbumStyle(style) {
    try {
      localStorage.setItem('oasis_album_default_style', style);
    } catch (_) {}
  }

  getAlbumStyle() {
    try {
      return localStorage.getItem('oasis_album_default_style') || 'scrapbook';
    } catch (_) {
      return 'scrapbook';
    }
  }

  // ==========================================================================
  // 三餐相机 / 美食手帐 (Meal Camera & Diary)
  // 不可删除、不可创建的唯一私属永久手帐相册
  // ==========================================================================

  getMeals() {
    try {
      const data = localStorage.getItem("oasis_meals");
      const list = data ? JSON.parse(data) : [];
      if (Array.isArray(list)) {
        // 严格剔除 meal_init_01，绝不插入任何未经拍摄的虚假照片
        const cleaned = list.filter(m => m && m.id && m.id !== 'meal_init_01');
        if (cleaned.length !== list.length) {
          try {
            localStorage.setItem("oasis_meals", JSON.stringify(cleaned));
          } catch (_) {}
        }
        return cleaned;
      }
      return [];
    } catch (e) {
      return [];
    }
  }

  // 双向智能合并三餐手帐，杜绝云端空覆盖与丢失
  mergeMeals(localMeals, cloudMeals) {
    const map = new Map();
    (localMeals || []).forEach(m => {
      if (m && m.id && m.id !== 'meal_init_01') map.set(m.id, m);
    });
    (cloudMeals || []).forEach(m => {
      if (m && m.id && m.id !== 'meal_init_01') {
        if (!map.has(m.id)) {
          map.set(m.id, m);
        } else {
          const existing = map.get(m.id);
          map.set(m.id, { ...existing, ...m });
        }
      }
    });
    return Array.from(map.values()).sort((a, b) => {
      const tA = new Date(a.time || a.createdAt || 0).getTime();
      const tB = new Date(b.time || b.createdAt || 0).getTime();
      return tB - tA;
    });
  }

  saveMeals(meals) {
    localStorage.setItem("oasis_meals", JSON.stringify(meals));
    try { this.scheduleCloudPush(); } catch (_) {}
  }

  addMeal(meal) {
    const list = this.getMeals();
    const item = {
      id: "meal_" + Date.now() + "_" + Math.random().toString(36).substr(2, 6),
      title: meal.title || "今日美餐",
      imageUrl: meal.imageUrl || "",
      mealType: meal.mealType || "lunch", // breakfast, lunch, dinner, tea, snack
      time: meal.time || new Date().toISOString(),
      location: meal.location || "",
      author: meal.author || "both", // yan, qiuhui, both
      filter: meal.filter || "none",
      createdAt: Date.now(),
      ...meal
    };
    list.unshift(item);
    this.saveMeals(list);
    return item;
  }

  deleteMeal(id) {
    const list = this.getMeals().filter(m => m.id !== id);
    this.saveMeals(list);
    return list;
  }

  updateMeal(id, patch) {
    const list = this.getMeals().map(m => m.id === id ? { ...m, ...patch } : m);
    this.saveMeals(list);
    return list;
  }


  // --- 排期时刻表操作 (无样例纯净日程) ---
  getTimetables() {
    try {
      const list = JSON.parse(localStorage.getItem('oasis_timetables')) || [];
      const sampleIds = new Set(['sched_1', 'sched_2', 'sched_3', 'sched_4']);
      return list.filter(item => 
        !sampleIds.has(item.id) && 
        !item.title?.includes('复杂疑难病例示教讨论') && 
        !item.title?.includes('散步漫谈 & 周末露营采购') &&
        !item.title?.includes('自制手冲咖啡 & 松花湖测试') &&
        !item.title?.includes('无人船自主航行算法')
      );
    } catch (e) {
      return [];
    }
  }

  saveTimetables(timetables) {
    localStorage.setItem('oasis_timetables', JSON.stringify(timetables));
    try { this.scheduleCloudPush(); } catch (_) {}
  }

  // 本地删除的便签记录（防云端拉取时被旧备份复活）
  recordDeletedNoteId(id) {
    try {
      const deleted = JSON.parse(localStorage.getItem('oasis_deleted_note_ids') || '[]');
      if (!deleted.includes(id)) {
        deleted.unshift(id);
        if (deleted.length > 200) deleted.pop();
        localStorage.setItem('oasis_deleted_note_ids', JSON.stringify(deleted));
      }
    } catch (e) {}
  }

  getDeletedNoteIds() {
    try {
      return new Set(JSON.parse(localStorage.getItem('oasis_deleted_note_ids') || '[]'));
    } catch (e) {
      return new Set();
    }
  }

  deleteTimetable(id) {
    this.recordDeletedNoteId(id);
    const list = this.getTimetables().filter(item => item.id !== id);
    this.saveTimetables(list);
    return list;
  }

  // 小黑板智能双向合并（男女主人多设备协同防丢失）
  mergeTimetables(localList = [], cloudList = []) {
    const deletedIds = this.getDeletedNoteIds();
    const map = new Map();

    // 1. 载入云端数据
    for (const item of (cloudList || [])) {
      if (item && item.id && !deletedIds.has(item.id)) {
        map.set(item.id, item);
      }
    }

    // 2. 载入本地数据
    for (const item of (localList || [])) {
      if (item && item.id) {
        if (!map.has(item.id)) {
          if (!deletedIds.has(item.id)) {
            map.set(item.id, item);
          }
        } else {
          const cloudItem = map.get(item.id);
          const localTime = new Date(item.updatedAt || item.createdAt || 0).getTime();
          const cloudTime = new Date(cloudItem.updatedAt || cloudItem.createdAt || 0).getTime();
          if (localTime >= cloudTime) {
            map.set(item.id, item);
          }
        }
      }
    }

    const merged = Array.from(map.values());
    merged.sort((a, b) => {
      const cmp = (a.date || '').localeCompare(b.date || '');
      if (cmp !== 0) return cmp;
      return (a.createdAt || '').localeCompare(b.createdAt || '');
    });
    return merged;
  }

  // 本地日期格式化工具（避免东八区时区转换 UTC 减一天 bug）
  formatLocalDate(d = new Date()) {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  getTodayDate() {
    return this.formatLocalDate(new Date());
  }

  // ==========================================================================
  // 人生ToDo / 星光愿景与人生心愿清单 (Life Bucket List & Dreams)
  // ==========================================================================

  getDefaultTodos() {
    return [
      {
        id: 'todo_seed_01',
        title: '去冰岛追一场欧若拉极光',
        category: 'travel',
        owner: 'both',
        priority: 3,
        status: 'pending',
        targetDate: '2027年冬天',
        desc: '在极夜星空与冰原下，牵手看漫天舞动的绿色光带。',
        visibility: 'living_room',
        completedAt: null,
        completedLocation: '',
        memoryNote: '',
        memoryPhoto: '',
        createdAt: '2026-11-01T10:00:00Z',
        updatedAt: '2026-11-01T10:00:00Z'
      },
      {
        id: 'todo_seed_02',
        title: '在海边并肩等一场日出与晚霞',
        category: 'romantic',
        owner: 'both',
        priority: 2,
        status: 'completed',
        targetDate: '2025年夏',
        desc: '听着海浪，从晨曦微露坐到夕阳西下。',
        visibility: 'living_room',
        completedAt: '2025-08-15',
        completedLocation: '青岛石老人海滩',
        memoryNote: '清晨微凉的海风与初升的太阳，橘红色的海浪涌来，那一刻时间仿佛静止。',
        memoryPhoto: '',
        createdAt: '2025-08-01T10:00:00Z',
        updatedAt: '2025-08-15T18:00:00Z'
      },
      {
        id: 'todo_seed_03',
        title: '自驾穿越独库公路与伊犁空中草原',
        category: 'travel',
        owner: 'both',
        priority: 3,
        status: 'pending',
        targetDate: '2027年夏天',
        desc: '一天领略四季，从雪山峡谷穿行至无垠的绿色花海。',
        visibility: 'living_room',
        completedAt: null,
        completedLocation: '',
        memoryNote: '',
        memoryPhoto: '',
        createdAt: '2026-11-02T10:00:00Z',
        updatedAt: '2026-11-02T10:00:00Z'
      },
      {
        id: 'todo_seed_04',
        title: '去看一场五月天或陈奕迅的现场演唱会',
        category: 'romantic',
        owner: 'both',
        priority: 2,
        status: 'in_progress',
        targetDate: '2027年',
        desc: '在荧光棒的海洋里并肩大声合唱青春的歌。',
        visibility: 'living_room',
        completedAt: null,
        completedLocation: '',
        memoryNote: '',
        memoryPhoto: '',
        createdAt: '2026-11-03T10:00:00Z',
        updatedAt: '2026-11-03T10:00:00Z'
      },
      {
        id: 'todo_seed_05',
        title: '拥有一间带着大落地窗和落地书架的温馨小家',
        category: 'home',
        owner: 'both',
        priority: 3,
        status: 'in_progress',
        targetDate: '2028年前',
        desc: '阳光洒满木地板，有舒适的独立咖啡角、大书桌和毛茸茸的地毯。',
        visibility: 'living_room',
        completedAt: null,
        completedLocation: '',
        memoryNote: '',
        memoryPhoto: '',
        createdAt: '2026-11-03T11:00:00Z',
        updatedAt: '2026-11-03T11:00:00Z'
      },
      {
        id: 'todo_seed_06',
        title: '发表高水平 SCI 学术论文并在全国口腔年会汇报',
        category: 'growth',
        owner: 'qiuhui',
        priority: 3,
        status: 'in_progress',
        targetDate: '2027年春',
        desc: '踏实推进大创与临床科研课题，展现口腔医学学术风采。',
        visibility: 'living_room',
        completedAt: null,
        completedLocation: '',
        memoryNote: '',
        memoryPhoto: '',
        createdAt: '2026-11-04T09:00:00Z',
        updatedAt: '2026-11-04T09:00:00Z'
      },
      {
        id: 'todo_seed_07',
        title: '成为一名温和且医术卓越的口腔临床正畸专家',
        category: 'growth',
        owner: 'qiuhui',
        priority: 3,
        status: 'in_progress',
        targetDate: '终身追求',
        desc: '用专业与耐心为每一位患者重塑健康自信的笑容。',
        visibility: 'living_room',
        completedAt: null,
        completedLocation: '',
        memoryNote: '',
        memoryPhoto: '',
        createdAt: '2026-11-04T09:30:00Z',
        updatedAt: '2026-11-04T09:30:00Z'
      },
      {
        id: 'todo_seed_08',
        title: '独立主导研发一套智能自主无人系统并在实装验证',
        category: 'growth',
        owner: 'yan',
        priority: 3,
        status: 'in_progress',
        targetDate: '2026年',
        desc: '攻克运动规划与感知融合底层核心算法，打造稳定优雅的智能控制架构。',
        visibility: 'living_room',
        completedAt: null,
        completedLocation: '',
        memoryNote: '',
        memoryPhoto: '',
        createdAt: '2026-11-04T10:00:00Z',
        updatedAt: '2026-11-04T10:00:00Z'
      },
      {
        id: 'todo_seed_09',
        title: '考取 PADI 进阶潜水员执照 (AOW) 探访神秘沉船',
        category: 'experience',
        owner: 'yan',
        priority: 2,
        status: 'pending',
        targetDate: '2027年',
        desc: '潜入蔚蓝的深海世界，在静谧的海洋深处感受水流与生命的律动。',
        visibility: 'living_room',
        completedAt: null,
        completedLocation: '',
        memoryNote: '',
        memoryPhoto: '',
        createdAt: '2026-11-04T10:30:00Z',
        updatedAt: '2026-11-04T10:30:00Z'
      },
      {
        id: 'todo_seed_10',
        title: '在小家里领养一只可爱温顺的小布偶猫',
        category: 'home',
        owner: 'both',
        priority: 2,
        status: 'pending',
        targetDate: '新家入住后',
        desc: '给它取个可爱的名字，每天下班回到家都有呼噜呼噜的小猫蹭蹭。',
        visibility: 'living_room',
        completedAt: null,
        completedLocation: '',
        memoryNote: '',
        memoryPhoto: '',
        createdAt: '2026-11-05T10:00:00Z',
        updatedAt: '2026-11-05T10:00:00Z'
      },
      {
        id: 'todo_seed_11',
        title: '带双方父母去一次惬意舒适的度假疗养旅行',
        category: 'home',
        owner: 'both',
        priority: 3,
        status: 'pending',
        targetDate: '2027年秋',
        desc: '安排全程无忧的慢节奏行程，给长辈拍美美的合照，陪伴是最好的心意。',
        visibility: 'living_room',
        completedAt: null,
        completedLocation: '',
        memoryNote: '',
        memoryPhoto: '',
        createdAt: '2026-11-05T11:00:00Z',
        updatedAt: '2026-11-05T11:00:00Z'
      },
      {
        id: 'todo_seed_12',
        title: '两人共同完成一次城市 10km 晨跑或彩色跑',
        category: 'experience',
        owner: 'both',
        priority: 1,
        status: 'completed',
        targetDate: '2025年秋',
        desc: '迎着晨光冲过终点线，挂上闪亮奖牌击掌庆祝！',
        visibility: 'living_room',
        completedAt: '2025-10-20',
        completedLocation: '长春南湖公园',
        memoryNote: '虽然最后两公里腿像灌了铅，但牵着手冲过终点的那一刻，多巴胺彻底爆棚！',
        memoryPhoto: '',
        createdAt: '2025-10-01T10:00:00Z',
        updatedAt: '2025-10-20T12:00:00Z'
      }
    ];
  }

  getTodos() {
    try {
      const data = localStorage.getItem('oasis_todos');
      let list = data ? JSON.parse(data) : null;
      if (!list || !Array.isArray(list)) {
        list = this.getDefaultTodos();
        localStorage.setItem('oasis_todos', JSON.stringify(list));
      }
      return list;
    } catch (e) {
      return this.getDefaultTodos();
    }
  }

  saveTodos(todos) {
    localStorage.setItem('oasis_todos', JSON.stringify(todos));
    try { this.scheduleCloudPush(); } catch (_) {}
  }

  recordDeletedTodoId(id) {
    try {
      const deleted = JSON.parse(localStorage.getItem('oasis_deleted_todo_ids') || '[]');
      if (!deleted.includes(id)) {
        deleted.unshift(id);
        if (deleted.length > 200) deleted.pop();
        localStorage.setItem('oasis_deleted_todo_ids', JSON.stringify(deleted));
      }
    } catch (e) {}
  }

  getDeletedTodoIds() {
    try {
      return new Set(JSON.parse(localStorage.getItem('oasis_deleted_todo_ids') || '[]'));
    } catch (e) {
      return new Set();
    }
  }

  addTodo(todo) {
    const list = this.getTodos();
    const item = {
      id: 'todo_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
      title: todo.title || '新心愿',
      category: todo.category || 'romantic',
      owner: todo.owner || 'both',
      priority: Number(todo.priority) || 2,
      status: todo.status || 'pending',
      targetDate: todo.targetDate || '',
      desc: todo.desc || '',
      visibility: todo.visibility || 'living_room',
      completedAt: todo.completedAt || null,
      completedLocation: todo.completedLocation || '',
      memoryNote: todo.memoryNote || '',
      memoryPhoto: todo.memoryPhoto || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...todo
    };
    list.unshift(item);
    this.saveTodos(list);
    return item;
  }

  updateTodo(id, patch) {
    const list = this.getTodos();
    const nowIso = new Date().toISOString();
    const updated = list.map(item => {
      if (item.id === id) {
        return { ...item, ...patch, updatedAt: nowIso };
      }
      return item;
    });
    this.saveTodos(updated);
    return updated;
  }

  deleteTodo(id) {
    this.recordDeletedTodoId(id);
    const list = this.getTodos().filter(item => item.id !== id);
    this.saveTodos(list);
    // 立即向云端同步，防止延迟导致另一端或刷新时拉取旧数据
    try { this.pushToCloud(false); } catch (_) {}
    return list;
  }

  // 人生ToDo智能双向合并 (以云端最新修改为准，绝不让已删除项死灰复燃，同时保护离线新增条目)
  // cloudDeletedIds: 云端下发的对方已删除的 ID 列表，用于跨设备传播"删除"操作
  mergeTodos(localList = [], cloudList = [], cloudDeletedIds = []) {
    // 合并本地 + 云端（对方）的已删除 ID，实现跨设备删除同步
    const deletedIds = new Set([
      ...this.getDeletedTodoIds(),
      ...(cloudDeletedIds || [])
    ]);
    // 将对方的已删除 ID 也写入本地，防止后续再次复活
    if (cloudDeletedIds && cloudDeletedIds.length > 0) {
      try {
        const local = JSON.parse(localStorage.getItem('oasis_deleted_todo_ids') || '[]');
        const merged = [...new Set([...local, ...cloudDeletedIds])].slice(0, 500);
        localStorage.setItem('oasis_deleted_todo_ids', JSON.stringify(merged));
      } catch (_) {}
    }

    const map = new Map();

    // 1. 优先载入云端最新列表（剔除本地+云端已删的）
    for (const item of (cloudList || [])) {
      if (item && item.id && !deletedIds.has(item.id)) {
        map.set(item.id, item);
      }
    }

    // 2. 本地检查：仅当条目是本地在离线状态下新增的（创建时间晚于上次同步时间且不在云端）才追加
    const lastSaved = parseInt(localStorage.getItem('oasis_last_saved_at') || '0', 10);
    for (const item of (localList || [])) {
      if (item && item.id && !deletedIds.has(item.id)) {
        if (!map.has(item.id)) {
          const createdTime = new Date(item.createdAt || 0).getTime();
          // 仅保留未同步到云端的新增心愿，防止已删心愿复活
          if (createdTime > lastSaved) {
            map.set(item.id, item);
          }
        } else {
          // 若同一心愿本地 updatedAt 显著更新（离线修改），才覆盖云端
          const cloudItem = map.get(item.id);
          const localTime = new Date(item.updatedAt || item.createdAt || 0).getTime();
          const cloudTime = new Date(cloudItem.updatedAt || cloudItem.createdAt || 0).getTime();
          if (localTime > cloudTime) {
            map.set(item.id, item);
          }
        }
      }
    }

    return Array.from(map.values()).sort((a, b) => {
      const tA = new Date(a.createdAt || 0).getTime();
      const tB = new Date(b.createdAt || 0).getTime();
      return tB - tA;
    });
  }

  // --- 履历文库 / 多简历体系 (Resume Books) ---
  getResumeBooks() {
    try {
      const books = JSON.parse(localStorage.getItem('oasis_resume_books'));
      if (books && Array.isArray(books.yan) && Array.isArray(books.qiuhui)) {
        return books;
      }
      return this.getDefaultResumeBooks();
    } catch (e) {
      return this.getDefaultResumeBooks();
    }
  }

  saveResumeBooks(books) {
    localStorage.setItem('oasis_resume_books', JSON.stringify(books));
    // 同步维护双人兼容对象，保证全局历史引用不崩
    try {
      const dual = {
        yan: books.yan?.[0] || null,
        qiuhui: books.qiuhui?.[0] || null
      };
      localStorage.setItem('oasis_resumes_dual', JSON.stringify(dual));
    } catch (e) {}
    try { this.scheduleCloudPush(); } catch (_) {}
  }

  getResumeBook(owner, id) {
    const books = this.getResumeBooks();
    const list = books[owner] || [];
    return list.find(r => r.id === id) || list[0] || null;
  }

  saveResumeBook(owner, resumeObj) {
    const books = this.getResumeBooks();
    if (!books[owner]) books[owner] = [];
    const idx = books[owner].findIndex(r => r.id === resumeObj.id);
    resumeObj.updatedAt = new Date().toISOString().split('T')[0];
    if (idx !== -1) {
      books[owner][idx] = resumeObj;
    } else {
      books[owner].push(resumeObj);
    }
    this.saveResumeBooks(books);
    return resumeObj;
  }

  createResumeBook(owner, resumeObj) {
    const books = this.getResumeBooks();
    if (!books[owner]) books[owner] = [];
    if (!resumeObj.id) {
      resumeObj.id = 'res_' + owner + '_' + Date.now();
    }
    resumeObj.owner = owner;
    resumeObj.updatedAt = new Date().toISOString().split('T')[0];
    books[owner].push(resumeObj);
    this.saveResumeBooks(books);
    return resumeObj;
  }

  deleteResumeBook(owner, id) {
    const books = this.getResumeBooks();
    if (!books[owner]) return { success: false, message: '书架不存在' };
    if (books[owner].length <= 1) {
      return { success: false, message: '至少需保留一份简历作为蓝本，不可全部删除。' };
    }
    books[owner] = books[owner].filter(r => r.id !== id);
    this.saveResumeBooks(books);
    return { success: true, message: '简历已从书架移除。' };
  }

  // 历史兼容接口 (供备份导出/导入与旧代码调用)
  getDualResumes() {
    const books = this.getResumeBooks();
    return {
      yan: books.yan?.[0] || null,
      qiuhui: books.qiuhui?.[0] || null
    };
  }

  saveResume(person = 'yan', data) {
    if (typeof person === 'object' && !data) {
      data = person;
      person = data.owner || (data.isMedicalCV ? 'qiuhui' : 'yan');
    }
    this.saveResumeBook(person, data);
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
    try { this.scheduleCloudPush(); } catch (_) {}
  }

  // --- 访客多账号管理 ---
  getGuestAccounts() {
    const config = this.getAuthConfig();
    return Array.isArray(config.guestAccounts) ? config.guestAccounts : [];
  }

  saveGuestAccounts(accounts) {
    const config = this.getAuthConfig();
    config.guestAccounts = accounts;
    this.saveAuthConfig(config);
  }

  // ==========================================================================
  // Cloudflare 全球云端实时双向同步中枢 (OASIS Cloud Sync Engine)
  // ==========================================================================

  initCloudSync() {
    // 1. 启动延迟从云端拉取最新全量数据
    setTimeout(() => {
      this.pullFromCloud(true);
    }, 300);

    // 2. 针对微信浮窗、切回前台、移动端多重唤醒生命周期的即时同步中枢
    if (typeof window !== 'undefined') {
      // 窗口聚焦
      window.addEventListener('focus', () => {
        this.pullFromCloud(false);
      });

      // 标签可见性恢复（同时记录离开时间，恢复时若超过 3s 强制 pull）
      let _lastHiddenAt = 0;
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
          _lastHiddenAt = Date.now();
        } else if (document.visibilityState === 'visible') {
          // 无论间隔多短，只要从隐藏恢复就拉取，确保微信浮窗唤醒必同步
          this.pullFromCloud(false);
        }
      });

      // 微信浮窗还原 / 浏览器从 BFCache 恢复时触发
      window.addEventListener('pageshow', (e) => {
        // persisted=true 表示从 BFCache 恢复，强制拉取
        this.pullFromCloud(false);
      });

      // 微信/移动端 WebView 原生 resume 唤醒事件
      document.addEventListener('resume', () => {
        this.pullFromCloud(false);
      });

      // 网络由断开恢复连接
      window.addEventListener('online', () => {
        this.pullFromCloud(false);
      });

      // 用户交互主动触发（防止微信浮窗在后台冻结定时器后，唤醒时无标准生命周期事件派发）
      // 缩短触发间隔至 3s（原 5s），提高恢复后首次交互的同步及时性
      let lastUserInteractPull = 0;
      const onUserActive = () => {
        const now = Date.now();
        if (now - lastUserInteractPull > 3000) {
          lastUserInteractPull = now;
          this.pullFromCloud(false);
        }
      };
      ['touchstart', 'pointerdown', 'click'].forEach(evt => {
        window.addEventListener(evt, onUserActive, { passive: true });
      });

      // 3. 定时每 10 秒静默无感轮询拉取（原 15s，缩短以提升实时性）
      setInterval(() => {
        this.pullFromCloud(false);
      }, 10000);
    }
  }

  // 健壮的双轨云端网络请求适配器 (优先国内直连自定义域名 api.iqiuqiu.me，自动兜底 workers.dev)
  async cloudFetch(path, options = {}, timeoutMs = 5000) {
    // 强制增加动态时间戳防缓存（对 GET/HEAD 彻底消除微信内核/代理服务强缓存）
    const isGetOrHead = !options.method || options.method === 'GET' || options.method === 'HEAD';
    const separator = path.includes('?') ? '&' : '?';
    const cacheBustedPath = isGetOrHead ? `${path}${separator}_t=${Date.now()}` : path;

    const candidateUrls = [];
    if (this.cloudBaseUrl) candidateUrls.push(`${this.cloudBaseUrl}${cacheBustedPath}`);
    if (this.cloudBaseUrl !== 'https://api.iqiuqiu.me') {
      candidateUrls.push(`https://api.iqiuqiu.me${cacheBustedPath}`);
    }
    candidateUrls.push(`${this.cloudFallbackUrl}${cacheBustedPath}`);
    const urls = [...new Set(candidateUrls)];
    let lastError = null;

    const fetchOptions = {
      credentials: 'omit',
      cache: 'no-store', // 严禁微信或浏览器使用内存/磁盘缓存
      ...options,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        ...(options.headers || {})
      }
    };

    for (const url of urls) {
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), timeoutMs);

        const res = await fetch(url, {
          ...fetchOptions,
          signal: controller.signal
        });
        clearTimeout(timer);

        if (res.ok) {
          const u = new URL(url);
          this.activeCloudUrl = `${u.protocol}//${u.host}`;
          return res;
        }
        lastError = new Error(`HTTP ${res.status} from ${url}`);
      } catch (err) {
        lastError = err;
      }
    }
    throw lastError || new Error('All cloud sync endpoints unreachable');
  }

  // 从 Cloudflare 云端拉取全量数据并合并
  async pullFromCloud(isInitial = false) {
    try {
      this.syncStatus = 'syncing';
      this.notifyCloudStateChanged('syncing');

      const res = await this.cloudFetch('/api/sync');
      const json = await res.json();

      if (json.exists && json.data) {
        const cloud = json.data;
        const localSavedAt = parseInt(localStorage.getItem('oasis_last_saved_at') || '0', 10);
        const cloudSavedAt = cloud.savedAt || 0;

        const localMealsCount = this.getMeals().length;
        const cloudMealsCount = Array.isArray(cloud.meals) ? cloud.meals.length : 0;
        const localTodosCount = this.getTodos().length;
        const cloudTodosCount = Array.isArray(cloud.todos) ? cloud.todos.length : 0;
        const countDiff = cloudMealsCount !== localMealsCount || cloudTodosCount !== localTodosCount;

        // 无论如何，三餐照片每次都无条件合并（merge 是幂等的，确保数量差异一定被修复）
        let hasUpdated = false;

        // 1. 三餐手帐：无条件双向合并
        if (cloud.meals && Array.isArray(cloud.meals)) {
          const localList = this.getMeals();
          const merged = this.mergeMeals(localList, cloud.meals);
          const localStr = JSON.stringify(localList.map(m => m.id).sort());
          const mergedStr = JSON.stringify(merged.map(m => m.id).sort());
          if (localStr !== mergedStr) {
            localStorage.setItem('oasis_meals', JSON.stringify(merged));
            hasUpdated = true;
          }
        }

        // 2. 小黑板日程/备忘：每次都进行双向智能合并（男女主人任何设备上写下的日程均不遗漏）
        const localTimetables = this.getTimetables();
        const cloudTimetables = Array.isArray(cloud.timetables) ? cloud.timetables : [];
        const mergedTimetables = this.mergeTimetables(localTimetables, cloudTimetables);
        if (JSON.stringify(localTimetables) !== JSON.stringify(mergedTimetables)) {
          localStorage.setItem('oasis_timetables', JSON.stringify(mergedTimetables));
          hasUpdated = true;
        }

        // 3. 人生愿望清单：双向合并
        const localTodos = this.getTodos();
        const cloudTodos = Array.isArray(cloud.todos) ? cloud.todos : [];
        const mergedTodos = this.mergeTodos(localTodos, cloudTodos, cloud.deleted_todo_ids || []);
        if (JSON.stringify(localTodos) !== JSON.stringify(mergedTodos)) {
          localStorage.setItem('oasis_todos', JSON.stringify(mergedTodos));
          hasUpdated = true;
        }

        // 4. 其余模块（履历、相册、认证）
        if (cloud.resume_books && cloud.resume_books.yan) {
          localStorage.setItem('oasis_resume_books', JSON.stringify(cloud.resume_books));
          hasUpdated = true;
        }
        if (cloud.albums && Array.isArray(cloud.albums)) {
          const sampleIds = new Set(['album_sweet_life', 'album_travel_notes', 'album_accordion_memories']);
          const cleanCloudAlbums = cloud.albums.filter(a => a && !sampleIds.has(a.id));
          localStorage.setItem('oasis_albums', JSON.stringify(cleanCloudAlbums));
          hasUpdated = true;
        }
        if (cloud.auth_config && (cloud.auth_config.masterPasswords || cloud.auth_config.guestAccounts)) {
          localStorage.setItem('oasis_auth_config', JSON.stringify(cloud.auth_config));
          hasUpdated = true;
        }

        localStorage.setItem('oasis_last_saved_at', String(cloudSavedAt));
        localStorage.setItem('oasis_has_synced', 'true');

        // 5. 关键权威收录机制：如果本地存在云端尚未收录的备忘/数据（如用户在 io 或原有本地浏览器中保存的昨晚小黑板），立即反推云端，权威持久化！
        const cloudTimetableIds = new Set(cloudTimetables.map(t => t.id));
        const hasUnsyncedTimetables = localTimetables.some(t => t && t.id && !cloudTimetableIds.has(t.id));

        const cloudTodoIds = new Set(cloudTodos.map(t => t.id));
        const hasUnsyncedTodos = localTodos.some(t => t && t.id && !cloudTodoIds.has(t.id));

        const cloudMealIds = new Set((cloud.meals || []).map(m => m.id));
        const hasUnsyncedMeals = this.getMeals().some(m => m && m.id && !cloudMealIds.has(m.id));

        const localDeletedTodos = [...this.getDeletedTodoIds()];
        const cloudDeletedTodos = Array.isArray(cloud.deleted_todo_ids) ? cloud.deleted_todo_ids : [];
        const hasUnsyncedDeletedTodos = localDeletedTodos.some(id => !cloudDeletedTodos.includes(id));

        const localDeletedNotes = [...this.getDeletedNoteIds()];
        const cloudDeletedNotes = Array.isArray(cloud.deleted_note_ids) ? cloud.deleted_note_ids : [];
        const hasUnsyncedDeletedNotes = localDeletedNotes.some(id => !cloudDeletedNotes.includes(id));

        if (hasUnsyncedTimetables || hasUnsyncedTodos || hasUnsyncedMeals || hasUnsyncedDeletedTodos || hasUnsyncedDeletedNotes) {
          console.log('[OASIS] 本地发现未同步至服务端的离线/历史数据（如小黑板），正在自动回推 VPS 权威库...');
          this.scheduleCloudPush();
        }

        // 触发 UI 刷新（meals 合并在条件外，故 hasUpdated 可能在条件内为 true）
        if (hasUpdated) {
          if (window.spaceApp) {
            window.spaceApp.refreshCurrentModule();
          }
          if (window.todoModule) {
            window.todoModule.renderIfOpen();
          }
          if (window.mealsModule && window.mealsModule.isOpen) {
            window.mealsModule.renderGallery();
          }
          if (window.albumsModule) {
            window.albumsModule.updateSpecialMealCover();
          }
        }
        this.lastSyncTime = new Date(cloudSavedAt || Date.now());
        this.syncStatus = 'synced';
        this.notifyCloudStateChanged('synced');
        if (window.albumsModule) {
          window.albumsModule.updateSpecialMealCover();
        }
      } else {
        // 云端为空，立即将当前本地数据全量推送至云端存档
        await this.pushToCloud(true);
      }
    } catch (err) {
      console.warn('Cloud sync error or offline:', err);
      this.syncStatus = 'error';
      this.notifyCloudStateChanged('error');
    }
  }

  // 将本地全量数据推送到 Cloudflare 云端
  async pushToCloud(silent = false) {
    try {
      this.syncStatus = 'syncing';
      this.notifyCloudStateChanged('syncing');

      const payload = {
        timetables: this.getTimetables(),
        resume_books: this.getResumeBooks(),
        albums: this.getAlbums(),
        meals: this.getMeals(),
        todos: this.getTodos(),
        auth_config: this.getAuthConfig(),
        // 携带本地已删除的 todo ID，让对方设备拉取后也能过滤掉这些已删条目
        deleted_todo_ids: [...this.getDeletedTodoIds()].slice(0, 500),
        // 携带本地已删除的 note/日程 ID
        deleted_note_ids: [...this.getDeletedNoteIds()].slice(0, 500),
        clientTimestamp: Date.now()
      };

      const res = await this.cloudFetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const json = await res.json();
      if (json.success) {
        localStorage.setItem('oasis_last_saved_at', String(json.savedAt));
        localStorage.setItem('oasis_has_synced', 'true');
        this.lastSyncTime = new Date(json.savedAt);
        this.syncStatus = 'synced';
        this.notifyCloudStateChanged('synced');
      }
    } catch (err) {
      console.warn('Cloud push error:', err);
      this.syncStatus = 'error';
      this.notifyCloudStateChanged('error');
    }
  }

  // 防抖延迟上云
  scheduleCloudPush() {
    if (this.syncDebounceTimer) {
      clearTimeout(this.syncDebounceTimer);
    }
    this.notifyCloudStateChanged('syncing');
    this.syncDebounceTimer = setTimeout(() => {
      this.pushToCloud();
    }, 1000);
  }

  // 状态指示通知 (支持纯灯指示器与浮动说明)
  notifyCloudStateChanged(status) {
    const badge = document.getElementById('header-cloud-badge');
    if (!badge) return;
    badge.className = `cloud-tag-lamp ${status}`;
    if (status === 'syncing') {
      badge.title = '正在与 Cloudflare 全球边缘云端实时双向同步...';
    } else if (status === 'synced') {
      badge.title = 'Cloudflare 全球边缘云端已同步 (点击可立即同步)';
    } else if (status === 'error') {
      badge.title = '云端连接异常，当前为本地离线模式 (点击重试同步)';
    }
    const textEl = badge.querySelector('.cloud-text');
    if (textEl) {
      if (status === 'syncing') textEl.innerText = '正在同步...';
      else if (status === 'synced') textEl.innerText = '云端已同步';
      else if (status === 'error') textEl.innerText = '离线缓存';
    }
  }

  // 上传图片至 Cloudflare 存储，返回永久 CDN 链接
  async uploadPhoto(fileOrBase64, albumId = '', name = '') {
    try {
      let body;
      let headers = {};

      if (fileOrBase64 instanceof File || fileOrBase64 instanceof Blob) {
        const fd = new FormData();
        fd.append('file', fileOrBase64);
        fd.append('albumId', albumId);
        body = fd;
      } else if (typeof fileOrBase64 === 'string') {
        body = JSON.stringify({
          base64: fileOrBase64,
          albumId,
          name: name || 'photo.jpg'
        });
        headers['Content-Type'] = 'application/json';
      }

      const res = await this.cloudFetch('/api/upload', {
        method: 'POST',
        headers,
        body
      });

      const data = await res.json();
      if (data.success && data.url) {
        const root = this.activeCloudUrl || this.cloudBaseUrl;
        return `${root}${data.url}`;
      }
      return null;
    } catch (e) {
      console.error('uploadPhoto error:', e);
      throw e;
    }
  }
}

window.spaceStore = new SpaceStore();
