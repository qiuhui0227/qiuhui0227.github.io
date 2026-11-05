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
    this.dbReady = this.initIndexedDB();
    this.initDefaultStorage();
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

    // 2. 默认相簿 (包含横竖屏多风格)
    if (!localStorage.getItem('oasis_albums')) {
      const defaultAlbums = [
        {
          id: 'album_sweet_life',
          title: '日常漫步 · 诗意长卷',
          description: '从松花湖的微风到实验室的深夜，记录生活的每帧细碎温柔。',
          cover: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?auto=format&fit=crop&w=600&q=80',
          style: 'scroll',
          visibility: 'bedroom',
          createdAt: '2026-10-01'
        },
        {
          id: 'album_travel_notes',
          title: '山海远行 · 手账集',
          description: '跨越山川与城市的足迹，拍立得与胶带剪贴的情感信物。',
          cover: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80',
          style: 'scrapbook',
          visibility: 'living_room',
          createdAt: '2026-10-15'
        },
        {
          id: 'album_accordion_memories',
          title: '光阴褶皱 · 经折典藏',
          description: '传统经折装风琴光影折痕，如屏风般展开属于两个人的岁月长歌。',
          cover: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=600&q=80',
          style: 'accordion',
          visibility: 'bedroom',
          createdAt: '2026-10-25'
        }
      ];
      localStorage.setItem('oasis_albums', JSON.stringify(defaultAlbums));
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
}

window.spaceStore = new SpaceStore();
