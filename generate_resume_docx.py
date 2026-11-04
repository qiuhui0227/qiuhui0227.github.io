# -*- coding: utf-8 -*-
"""
生成用于联系研究生导师的专业医学学术简历 (.docx 与 .pdf)
学生：吉林大学口腔医学“5+3”一体化大四在读
意向导师：吉林大学口腔颌面外科 吴国民老师
严格控制在标准 A4 单页排版，遵循医学学术端庄配色与呼吸感留白。
"""

import os
import docx
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

def set_cell_background(cell, fill_hex):
    """设置单元格背景颜色"""
    tcPr = cell._tc.get_or_add_tcPr()
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{fill_hex}"/>')
    tcPr.append(shd)

def set_cell_margins(cell, top=40, bottom=40, left=60, right=60):
    """设置单元格内边距 (以 dxa 为单位，20 dxa = 1 pt)"""
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = OxmlElement('w:tcMar')
    for m, val in [('top', top), ('bottom', bottom), ('left', left), ('right', right)]:
        node = OxmlElement(f'w:{m}')
        node.set(qn('w:w'), str(val))
        node.set(qn('w:type'), 'dxa')
        tcMar.append(node)
    tcPr.append(tcMar)

def create_resume_docx(output_path):
    doc = Document()

    # 1. 设置标准 A4 页面与适度紧凑边距 (确保严格 1 页，无任何溢出)
    for section in doc.sections:
        section.page_width = Inches(8.27)    # 210 mm
        section.page_height = Inches(11.69)  # 297 mm
        section.top_margin = Inches(0.42)    # 10.6 mm
        section.bottom_margin = Inches(0.38) # 9.6 mm
        section.left_margin = Inches(0.65)   # 16.5 mm
        section.right_margin = Inches(0.65)  # 16.5 mm

    COLOR_PRIMARY = RGBColor(24, 53, 74)       # #18354A 深蓝主色
    COLOR_SECONDARY = RGBColor(27, 118, 89)    # #1B7659 学术辅助墨绿
    COLOR_TEXT = RGBColor(34, 34, 34)          # #222222 炭黑正文
    COLOR_MUTED = RGBColor(95, 105, 115)       # #5F6973 辅助说明灰色

    FONT_FAMILY = "微软雅黑"

    def format_run(run, font_name=FONT_FAMILY, size_pt=8.5, bold=False, color=COLOR_TEXT, italic=False):
        run.font.name = font_name
        run.font.size = Pt(size_pt)
        run.bold = bold
        run.italic = italic
        run.font.color.rgb = color
        rPr = run._r.get_or_add_rPr()
        rFonts = parse_xml(f'<w:rFonts {nsdecls("w")} w:eastAsia="{font_name}"/>')
        rPr.append(rFonts)

    def add_section_header(title_cn, title_en=""):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(3.8)
        p.paragraph_format.space_after = Pt(1.6)
        p.paragraph_format.line_spacing = 1.05

        r_bar = p.add_run("▌ ")
        format_run(r_bar, size_pt=10.2, bold=True, color=COLOR_PRIMARY)

        r_cn = p.add_run(title_cn)
        format_run(r_cn, size_pt=10.2, bold=True, color=COLOR_PRIMARY)

        if title_en:
            r_en = p.add_run(f"  {title_en.upper()}")
            format_run(r_en, size_pt=7.5, bold=True, color=COLOR_MUTED)

        pBdr = parse_xml(f'<w:pBdr {nsdecls("w")}><w:bottom w:val="single" w:sz="6" w:space="1" w:color="18354A"/></w:pBdr>')
        p._p.get_or_add_pPr().append(pBdr)

    # ==========================================
    # 顶部头部区域：双列表格 (左侧个人信息与求学意向，右侧规范证件照预留框)
    # ==========================================
    header_table = doc.add_table(rows=1, cols=2)
    header_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    header_table.autofit = False

    col_widths = [Inches(5.75), Inches(1.15)]
    for i, w in enumerate(col_widths):
        header_table.columns[i].width = w
        header_table.rows[0].cells[i].width = w

    cell_left = header_table.cell(0, 0)
    cell_right = header_table.cell(0, 1)
    set_cell_margins(cell_left, top=0, bottom=0, left=0, right=20)
    set_cell_margins(cell_right, top=0, bottom=0, left=10, right=0)

    p_name = cell_left.paragraphs[0]
    p_name.paragraph_format.space_before = Pt(0)
    p_name.paragraph_format.space_after = Pt(2)

    r_n = p_name.add_run("杜秋慧 / [待填写]")
    format_run(r_n, size_pt=16, bold=True, color=COLOR_PRIMARY)

    r_sub = p_name.add_run("   口腔医学“5+3”一体化培养（2022级·大四）")
    format_run(r_sub, size_pt=9.2, bold=False, color=COLOR_MUTED)

    p_intent = cell_left.add_paragraph()
    p_intent.paragraph_format.space_before = Pt(0)
    p_intent.paragraph_format.space_after = Pt(2.5)
    p_intent.paragraph_format.line_spacing = 1.1

    r_target_label = p_intent.add_run("申请意向：")
    format_run(r_target_label, size_pt=9.0, bold=True, color=COLOR_PRIMARY)
    r_target = p_intent.add_run("口腔颌面外科（硕士阶段）  |  意向导师：")
    format_run(r_target, size_pt=9.0, bold=False, color=COLOR_TEXT)
    r_mentor = p_intent.add_run("吴国民 教授 / 主任医师")
    format_run(r_mentor, size_pt=9.0, bold=True, color=COLOR_PRIMARY)

    p_contact = cell_left.add_paragraph()
    p_contact.paragraph_format.space_before = Pt(0)
    p_contact.paragraph_format.space_after = Pt(1)
    p_contact.paragraph_format.line_spacing = 1.1

    items_contact = [
        ("培养院校：", "吉林大学白求恩口腔医学院"),
        ("联系电话：", "[待填写]"),
        ("电子邮箱：", "[待填写，建议填吉大校园邮箱]"),
        ("政治面貌：", "[共青团员/中共预备党员/待填写]")
    ]
    for idx, (label, val) in enumerate(items_contact):
        r_lbl = p_contact.add_run(label)
        format_run(r_lbl, size_pt=8.2, bold=True, color=COLOR_MUTED)
        r_val = p_contact.add_run(val)
        format_run(r_val, size_pt=8.2, bold=False, color=COLOR_TEXT)
        if idx in [0, 2]:
            p_contact.add_run("   |   ")
        elif idx == 1:
            p_contact.add_run("\n")

    p_photo = cell_right.paragraphs[0]
    p_photo.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_photo.paragraph_format.space_before = Pt(1)
    p_photo.paragraph_format.space_after = Pt(0)

    set_cell_background(cell_right, "F4F7F9")
    r_pbox1 = p_photo.add_run("【标准证件照】\n")
    format_run(r_pbox1, size_pt=7.5, bold=True, color=COLOR_MUTED)
    r_pbox2 = p_photo.add_run("(建议白大褂\n或正装拍摄\n也可留空)")
    format_run(r_pbox2, size_pt=7.0, bold=False, color=COLOR_MUTED)

    # ==========================================
    # 一、 教育背景与学业排名 (核心硬实力)
    # ==========================================
    add_section_header("教育背景与学业排名", "Education & Academic Standing")

    p_edu = doc.add_paragraph()
    p_edu.paragraph_format.space_before = Pt(1)
    p_edu.paragraph_format.space_after = Pt(1)
    p_edu.paragraph_format.line_spacing = 1.1

    r_school = p_edu.add_run("吉林大学 (Jilin University)  ·  白求恩口腔医学院")
    format_run(r_school, size_pt=9.0, bold=True, color=COLOR_TEXT)
    r_sp = p_edu.add_run("\t\t")
    r_time = p_edu.add_run("2022.09 – 至今 (大四在读 / 5+3一体化)")
    format_run(r_time, size_pt=8.5, bold=True, color=COLOR_MUTED)

    p_stats = doc.add_paragraph()
    p_stats.paragraph_format.space_before = Pt(0.5)
    p_stats.paragraph_format.space_after = Pt(1.5)
    p_stats.paragraph_format.line_spacing = 1.12

    r_b1 = p_stats.add_run("● 学业排名硬实力：")
    format_run(r_b1, size_pt=8.5, bold=True, color=COLOR_PRIMARY)
    r_b2 = p_stats.add_run("大三学年专业综合排名 ")
    format_run(r_b2, size_pt=8.5, bold=False, color=COLOR_TEXT)
    r_rank = p_stats.add_run("2 / 39 (年级前 5%)")
    format_run(r_rank, size_pt=8.8, bold=True, color=COLOR_PRIMARY)
    r_b3 = p_stats.add_run("，学业成绩呈阶梯式稳步上升（大一大二综合排名均位居年级前列约第10名）。\n")
    format_run(r_b3, size_pt=8.5, bold=False, color=COLOR_TEXT)

    r_b4 = p_stats.add_run("● 外语学术能力：")
    format_run(r_b4, size_pt=8.5, bold=True, color=COLOR_PRIMARY)
    r_cet = p_stats.add_run("大学英语六级 (CET-6) 507 分")
    format_run(r_cet, size_pt=8.5, bold=True, color=COLOR_TEXT)
    r_b5 = p_stats.add_run("（大一入学首考一次性通过）；具备无障碍阅读口腔医学国际英文文献与检索前沿论文能力。\n")
    format_run(r_b5, size_pt=8.5, bold=False, color=COLOR_TEXT)

    r_b6 = p_stats.add_run("● 核心专业基础：")
    format_run(r_b6, size_pt=8.5, bold=True, color=COLOR_PRIMARY)
    r_courses = p_stats.add_run("口腔颌面外科学、口腔解剖生理学、口腔组织病理学、人体系统解剖学、诊断学、外科总论等（基础扎实优良）。")
    format_run(r_courses, size_pt=8.5, bold=False, color=COLOR_TEXT)

    # ==========================================
    # 二、 荣誉与奖学金情况
    # ==========================================
    add_section_header("学业荣誉与奖学金", "Honors & Scholarships")

    honors_list = [
        ("2024 – 2025 学年（大三）", "综合排名 2/39 优异成绩；获评校级优秀学生 / 优秀学业一等奖学金 [待填准确奖项名称]"),
        ("2023 – 2024 学年（大二）", "吉林大学校三等奖学金（学年综合排名前列，约 10/39）"),
        ("2022 – 2023 学年（大一）", "吉林大学校二等奖学金（学年综合排名前列，约 10/39）")
    ]
    for date_str, desc_str in honors_list:
        p_h = doc.add_paragraph()
        p_h.paragraph_format.space_before = Pt(0.5)
        p_h.paragraph_format.space_after = Pt(1.0)
        p_h.paragraph_format.line_spacing = 1.1

        r_dot = p_h.add_run("● ")
        format_run(r_dot, size_pt=8.0, bold=True, color=COLOR_SECONDARY)
        r_date = p_h.add_run(f"{date_str}   ")
        format_run(r_date, size_pt=8.5, bold=True, color=COLOR_TEXT)
        r_desc = p_h.add_run(desc_str)
        format_run(r_desc, size_pt=8.5, bold=False, color=COLOR_TEXT)

    # ==========================================
    # 三、 科研训练与学科竞赛 (诚实求真、展现科研素养)
    # ==========================================
    add_section_header("科研训练与学科竞赛", "Research Training & Academic Competitions")

    # 1. 生命科学竞赛
    p_comp = doc.add_paragraph()
    p_comp.paragraph_format.space_before = Pt(1)
    p_comp.paragraph_format.space_after = Pt(0.5)
    p_comp.paragraph_format.line_spacing = 1.1

    r_c_title = p_comp.add_run("全国大学生生命科学竞赛 (CULSC)  ·  吉林省赛区")
    format_run(r_c_title, size_pt=8.8, bold=True, color=COLOR_TEXT)
    r_c_role = p_comp.add_run("   |   项目团队成员   |   ")
    format_run(r_c_role, size_pt=8.3, bold=False, color=COLOR_MUTED)
    r_c_award = p_comp.add_run("省级三等奖")
    format_run(r_c_award, size_pt=8.8, bold=True, color=COLOR_PRIMARY)
    r_c_date = p_comp.add_run("\t2024年")
    format_run(r_c_date, size_pt=8.2, bold=False, color=COLOR_MUTED)

    p_comp_desc = doc.add_paragraph()
    p_comp_desc.paragraph_format.space_before = Pt(0)
    p_comp_desc.paragraph_format.space_after = Pt(1.5)
    p_comp_desc.paragraph_format.line_spacing = 1.1
    r_cd = p_comp_desc.add_run("   • 职责与心得：作为核心成员全程参与，协助完成实验前置英文文献检索、实验设计讨论及数据记录复核；系统经历科学探索完整流程，培养了求真务实的科研态度与团队协作素养。")
    format_run(r_cd, size_pt=8.3, bold=False, color=COLOR_TEXT)

    # 2. 大创项目
    p_proj = doc.add_paragraph()
    p_proj.paragraph_format.space_before = Pt(1)
    p_proj.paragraph_format.space_after = Pt(0.5)
    p_proj.paragraph_format.line_spacing = 1.1

    r_pj_title = p_proj.add_run("大学生创新创业训练项目《随行精灵》")
    format_run(r_pj_title, size_pt=8.8, bold=True, color=COLOR_TEXT)
    r_pj_role = p_proj.add_run("   |   项目组员 (指导教师：王红波 老师)")
    format_run(r_pj_role, size_pt=8.3, bold=False, color=COLOR_MUTED)
    r_pj_date = p_proj.add_run("\t\t2025年")
    format_run(r_pj_date, size_pt=8.2, bold=False, color=COLOR_MUTED)

    p_proj_desc = doc.add_paragraph()
    p_proj_desc.paragraph_format.space_before = Pt(0)
    p_proj_desc.paragraph_format.space_after = Pt(1.5)
    p_proj_desc.paragraph_format.line_spacing = 1.1
    r_pjd = p_proj_desc.add_run("   • 职责与心得：在指导教师带领下，参与项目论证、临床需求调研与方案框架构建；锻炼了跨学科解决实际问题的敏锐度与执行推进能力 [项目研究成果与结题状态待后续补充]。")
    format_run(r_pjd, size_pt=8.3, bold=False, color=COLOR_TEXT)

    # 3. 基础科研规范训练
    p_lab = doc.add_paragraph()
    p_lab.paragraph_format.space_before = Pt(1)
    p_lab.paragraph_format.space_after = Pt(1.5)
    p_lab.paragraph_format.line_spacing = 1.1
    r_l1 = p_lab.add_run("口腔医学“5+3”基础科研技能实训与学术方法积累\t\t\t\t2023 – 2024年\n")
    format_run(r_l1, size_pt=8.8, bold=True, color=COLOR_TEXT)
    r_l2 = p_lab.add_run("   • 技能训练：系统接受医学院基础实验规范化实训，掌握无菌操作、PCR 基因扩增、细胞培养等基础实验原理；熟练构建 PubMed、Web of Science 检索式，定期追踪颌面外科高水平文献。")
    format_run(r_l2, size_pt=8.3, bold=False, color=COLOR_TEXT)

    # ==========================================
    # 四、 临床学习与轮转实习经历 (突出责任心与临床严谨作风)
    # ==========================================
    add_section_header("临床学习与实习经历", "Clinical Training & Clerkship")

    p_clin1 = doc.add_paragraph()
    p_clin1.paragraph_format.space_before = Pt(1)
    p_clin1.paragraph_format.space_after = Pt(0.5)
    p_clin1.paragraph_format.line_spacing = 1.1
    r_cl_title = p_clin1.add_run("吉林大学口腔医院各临床专科实习  ·  担任【口腔实习组长】")
    format_run(r_cl_title, size_pt=8.8, bold=True, color=COLOR_TEXT)
    r_cl_date = p_clin1.add_run("\t2025.07 – 至今")
    format_run(r_cl_date, size_pt=8.2, bold=False, color=COLOR_MUTED)

    p_clin1_desc = doc.add_paragraph()
    p_clin1_desc.paragraph_format.space_before = Pt(0)
    p_clin1_desc.paragraph_format.space_after = Pt(1.5)
    p_clin1_desc.paragraph_format.line_spacing = 1.1
    r_c1d = p_clin1_desc.add_run("   • 组织协作：受聘担任实习组长，负责统筹轮转考勤、带教任务传达、病例讨论组织与沟通协调，具备强烈的责任心与抗压协作意识；\n")
    format_run(r_c1d, size_pt=8.3, bold=False, color=COLOR_TEXT)
    r_c1e = p_clin1_desc.add_run("   • 专科技能：系统在口腔颌面外科、牙体牙髓、修复等科室见习观摩与操作辅助；熟悉门诊接诊、无菌器械准备、拔牙器械配合与颌面 CBCT 读片识图。")
    format_run(r_c1e, size_pt=8.3, bold=False, color=COLOR_TEXT)

    p_clin2 = doc.add_paragraph()
    p_clin2.paragraph_format.space_before = Pt(1)
    p_clin2.paragraph_format.space_after = Pt(1.5)
    p_clin2.paragraph_format.line_spacing = 1.1
    r_cl2_title = p_clin2.add_run("综合医院大临床科室轮转见习 (心血管内科、肝胆外科等)\t\t2024.09 – 2025.06\n")
    format_run(r_cl2_title, size_pt=8.8, bold=True, color=COLOR_TEXT)
    r_c2d = p_clin2.add_run("   • 全科素养：跟随带教老师病房查房与疑难病例讨论，系统掌握住院病历规范书写、术前评估、生命体征监测；在指导下规范执行外科无菌换药与清创切开缝合基本功，为颌面外科围手术期综合管理打下扎实基石。")
    format_run(r_c2d, size_pt=8.3, bold=False, color=COLOR_TEXT)

    # ==========================================
    # 五、 专业素养、科研工具、志向与社会工作 (有机整合)
    # ==========================================
    add_section_header("专业素养、科研工具与学术志向", "Skills, Research Interests & Activities")

    skills_lines = [
        ("专业素养：", "严格恪守外科无菌观念，熟练掌握口腔专科器械操作规范、打结缝合基本功、住院病历书写规范及医患沟通技巧。"),
        ("科研与制图：", "接触并能运用 BioRender 绘制生物医学机制通路图；熟练运用 EndNote 进行引文管理，具备基础 SPSS 统计检验素养。"),
        ("学术志向：", "对口腔颌面外科（颌面创伤整形、颌面骨缺损重建与组织修复）怀有高度学术热爱。渴望在吴国民老师指导下，通过严谨求实的临床实践与扎实深入的课题训练，全面提升疑难病症诊疗能力与转化医学科研潜能。"),
        ("社会实践：", "受聘担任吉林大学防艾同伴教育宣传员，开展健康科普宣传；曾任新媒体部成员，积极参与无偿献血与志愿服务，具备踏实奉献品格。")
    ]
    for label, content in skills_lines:
        p_sk = doc.add_paragraph()
        p_sk.paragraph_format.space_before = Pt(0.5)
        p_sk.paragraph_format.space_after = Pt(1.0)
        p_sk.paragraph_format.line_spacing = 1.1

        r_dot = p_sk.add_run("● ")
        format_run(r_dot, size_pt=8.0, bold=True, color=COLOR_PRIMARY)
        r_lbl = p_sk.add_run(label)
        format_run(r_lbl, size_pt=8.5, bold=True, color=COLOR_PRIMARY)
        r_txt = p_sk.add_run(content)
        format_run(r_txt, size_pt=8.5, bold=False, color=COLOR_TEXT)

    doc.save(output_path)
    print(f"成功生成简历 Word 文档: {output_path}")

def convert_docx_to_pdf(docx_path, pdf_path):
    try:
        import win32com.client
        word = win32com.client.DispatchEx("Word.Application")
        word.Visible = False
        doc = word.Documents.Open(os.path.abspath(docx_path))
        doc.ExportAsFixedFormat(os.path.abspath(pdf_path), 17)
        page_count = doc.ComputeStatistics(2)
        doc.Close(False)
        word.Quit()
        print(f"成功生成简历 PDF 文档: {pdf_path} (精确页数: {page_count} 页)")
        return page_count
    except Exception as e:
        print(f"转换 PDF 时出现提示: {e}")
        return -1

if __name__ == "__main__":
    out_dir = r"e:\Library\git\github\qiuhui0227.github.io"
    filename_docx = "杜秋慧_吉林大学口腔医学5加3_联系研究生导师学术简历.docx"
    filename_pdf = "杜秋慧_吉林大学口腔医学5加3_联系研究生导师学术简历.pdf"
    target_docx = os.path.join(out_dir, filename_docx)
    target_pdf = os.path.join(out_dir, filename_pdf)
    create_resume_docx(target_docx)
    convert_docx_to_pdf(target_docx, target_pdf)
