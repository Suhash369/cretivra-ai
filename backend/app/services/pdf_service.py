import os
import re
import uuid
from typing import Dict, Any, List, Optional
from datetime import datetime

from reportlab.lib.pagesizes import A4
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    HRFlowable,
    KeepTogether,
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.pdfgen import canvas

from app.core.config import settings
from app.core.security import sanitize_filename
from app.core.logging import logger


class NumberedCanvas(canvas.Canvas):
    """
    Two-pass canvas to dynamically compute and print 'Page X of Y' along with
    a sleek corporate header and footer on each page.
    """
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super().showPage()
        super().save()

    def draw_page_decorations(self, page_count: int):
        self.saveState()
        page_width, page_height = A4

        # Running Header (pages after page 1)
        if self._pageNumber > 1:
            self.setFont("Helvetica-Bold", 8)
            self.setFillColor(colors.HexColor("#0284C7"))
            self.drawString(40, page_height - 30, "ASURA AI")
            self.setFont("Helvetica", 8)
            self.setFillColor(colors.HexColor("#64748B"))
            self.drawString(88, page_height - 30, "|  Frontier Intelligence & Document Synthesis")

            self.setStrokeColor(colors.HexColor("#CBD5E1"))
            self.setLineWidth(0.5)
            self.line(40, page_height - 35, page_width - 40, page_height - 35)

        # Running Footer (all pages)
        self.setStrokeColor(colors.HexColor("#E2E8F0"))
        self.setLineWidth(0.5)
        self.line(40, 42, page_width - 40, 42)

        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#64748B"))
        self.drawString(40, 30, "Asura AI by Cretivra  •  Confidential & Factual Grounding (2026)")

        page_str = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(page_width - 40, 30, page_str)

        self.restoreState()


class PDFService:
    def __init__(self, output_dir: Optional[str] = None):
        self.output_dir = os.path.abspath(output_dir or os.path.join(settings.UPLOAD_DIR, "generated"))
        os.makedirs(self.output_dir, exist_ok=True)

    def detect_pdf_request(self, text: str) -> bool:
        """
        Determines whether the user prompt asks to generate, export, or download a PDF.
        """
        p = text.lower().strip()
        triggers = [
            "generate pdf", "generate a pdf", "create pdf", "create a pdf",
            "make pdf", "make a pdf", "export pdf", "export to pdf",
            "download pdf", "download as pdf", "save as pdf", "convert to pdf",
            "pdf for this", "pdf of this", "pdf format", "as a pdf",
            "pdf document", "pdf report", "give me pdf", "give me a pdf",
            "send pdf", "prepare pdf", "produce pdf", "build pdf"
        ]
        return any(t in p for t in triggers)

    def extract_title_from_prompt(self, text: str, default_title: str = "Executive Report") -> str:
        """
        Extracts a clean subject/title from a prompt like 'generate a pdf for 2026 Tamil Nadu elections'.
        """
        cleaned = re.sub(
            r"(?:create|generate|make|prepare|build|export|download)\s+(?:a\s+)?(?:comprehensive\s+)?(?:pdf|document|report|file)\s+(?:for|on|about|of)?\s*",
            "",
            text,
            flags=re.IGNORECASE
        ).strip()
        cleaned = re.sub(r"(?:for\s+this\s+content|for\s+above|of\s+this\s+content|this\s+content|above|here)$", "", cleaned, flags=re.IGNORECASE).strip()
        if not cleaned or len(cleaned) < 3:
            return default_title
        return cleaned.title()

    def _safe_xml(self, s: str) -> str:
        """
        Escapes XML special characters for safe rendering in ReportLab Paragraphs,
        while converting basic Markdown syntax to supported ReportLab HTML tags.
        """
        if not s:
            return ""
        # Escape entities first
        s = s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")

        # Convert markdown bold: **text** -> <b>text</b>
        s = re.sub(r'\*\*(.+?)\*\*', r'<b>\1</b>', s)

        # Convert markdown italic: *text* -> <i>text</i>
        s = re.sub(r'(?<!\*)\*([^*]+?)\*(?!\*)', r'<i>\1</i>', s)

        # Convert markdown code: `code` -> Courier tag
        s = re.sub(r'`(.+?)`', r'<font face="Courier" color="#0284C7"><b>\1</b></font>', s)

        return s

    def _parse_markdown_table(self, lines: List[str], body_style: ParagraphStyle) -> Optional[Table]:
        """
        Parses Markdown pipe table lines into a styled ReportLab Table.
        """
        table_data = []
        for line in lines:
            line = line.strip()
            if not line or re.match(r"^\|?\s*[-:]+[-| :]*\|?$", line):
                continue
            cells = [c.strip() for c in line.strip("|").split("|")]
            row = [Paragraph(self._safe_xml(cell), body_style) for cell in cells]
            if row:
                table_data.append(row)

        if not table_data or len(table_data) < 2:
            return None

        # Determine column count
        col_count = max(len(r) for r in table_data)
        for r in table_data:
            while len(r) < col_count:
                r.append(Paragraph("", body_style))

        col_width = (A4[0] - 80) / col_count

        t = Table(table_data, colWidths=[col_width] * col_count)
        t.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#0F172A')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
            ('TOPPADDING', (0, 0), (-1, -1), 6),
            ('LEFTPADDING', (0, 0), (-1, -1), 8),
            ('RIGHTPADDING', (0, 0), (-1, -1), 8),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.HexColor('#F8FAFC'), colors.HexColor('#FFFFFF')]),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#CBD5E1')),
        ]))
        return t

    def generate_pdf(
        self,
        title: str,
        content: str,
        subtitle: Optional[str] = None,
        author: str = "Asura AI by Cretivra"
    ) -> Dict[str, Any]:
        """
        Generates a publication-grade, professionally formatted PDF document from markdown/text.
        """
        clean_name = sanitize_filename(title) or "Asura_Report"
        file_id = str(uuid.uuid4())[:8]
        output_filename = f"{clean_name}_{file_id}.pdf"
        output_path = os.path.join(self.output_dir, output_filename)

        doc = SimpleDocTemplate(
            output_path,
            pagesize=A4,
            leftMargin=40,
            rightMargin=40,
            topMargin=46,
            bottomMargin=46
        )

        styles = getSampleStyleSheet()

        title_style = ParagraphStyle(
            'DocTitle',
            parent=styles['Title'],
            fontName='Helvetica-Bold',
            fontSize=22,
            leading=26,
            textColor=colors.HexColor('#0F172A'),
            alignment=0,
            spaceAfter=4
        )

        sub_style = ParagraphStyle(
            'DocSubtitle',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=10,
            leading=14,
            textColor=colors.HexColor('#64748B'),
            spaceAfter=10
        )

        meta_style = ParagraphStyle(
            'DocMeta',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=8.5,
            leading=12,
            textColor=colors.HexColor('#94A3B8'),
            spaceAfter=12
        )

        h1_style = ParagraphStyle(
            'DocH1',
            parent=styles['Heading1'],
            fontName='Helvetica-Bold',
            fontSize=15,
            leading=19,
            textColor=colors.HexColor('#0F172A'),
            spaceBefore=14,
            spaceAfter=6,
            keepWithNext=True
        )

        h2_style = ParagraphStyle(
            'DocH2',
            parent=styles['Heading2'],
            fontName='Helvetica-Bold',
            fontSize=12,
            leading=16,
            textColor=colors.HexColor('#0284C7'),
            spaceBefore=10,
            spaceAfter=4,
            keepWithNext=True
        )

        h3_style = ParagraphStyle(
            'DocH3',
            parent=styles['Heading3'],
            fontName='Helvetica-Bold',
            fontSize=10.5,
            leading=14,
            textColor=colors.HexColor('#334155'),
            spaceBefore=8,
            spaceAfter=4,
            keepWithNext=True
        )

        body_style = ParagraphStyle(
            'DocBody',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=9.5,
            leading=13.5,
            textColor=colors.HexColor('#334155'),
            spaceAfter=6
        )

        bullet_style = ParagraphStyle(
            'DocBullet',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=9.5,
            leading=13.5,
            textColor=colors.HexColor('#334155'),
            leftIndent=14,
            spaceAfter=3
        )

        callout_style = ParagraphStyle(
            'DocCallout',
            parent=styles['Normal'],
            fontName='Helvetica-Oblique',
            fontSize=9,
            leading=13,
            textColor=colors.HexColor('#1E293B'),
        )

        code_style = ParagraphStyle(
            'DocCode',
            parent=styles['Normal'],
            fontName='Courier',
            fontSize=8,
            leading=11,
            textColor=colors.HexColor('#0F172A')
        )

        story = []

        # 1. Header Banner
        story.append(Paragraph(self._safe_xml(title), title_style))
        if subtitle:
            story.append(Paragraph(self._safe_xml(subtitle), sub_style))

        date_str = datetime.now().strftime("%B %d, %Y")
        meta_line = f"Prepared by <b>{self._safe_xml(author)}</b>  •  Date: {date_str}  •  Factual Grounding: Active (2026)"
        story.append(Paragraph(meta_line, meta_style))
        story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor("#0284C7"), spaceBefore=0, spaceAfter=14))

        # 2. Content Parser (Handles Markdown, Lists, Code, Tables)
        raw_lines = content.strip().split("\n")
        i = 0
        in_code_block = False
        code_lines = []
        table_buffer = []

        while i < len(raw_lines):
            line = raw_lines[i]
            trimmed = line.strip()

            # Code block toggle
            if trimmed.startswith("```"):
                if in_code_block:
                    # Flush code block
                    code_text = "\n".join(code_lines)
                    code_p = Paragraph(f"<pre>{self._safe_xml(code_text)}</pre>", code_style)
                    code_box = Table([[code_p]], colWidths=[A4[0] - 80])
                    code_box.setStyle(TableStyle([
                        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#F1F5F9')),
                        ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor('#CBD5E1')),
                        ('TOPPADDING', (0, 0), (-1, -1), 6),
                        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
                        ('LEFTPADDING', (0, 0), (-1, -1), 8),
                        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
                    ]))
                    story.append(code_box)
                    story.append(Spacer(1, 6))
                    code_lines = []
                    in_code_block = False
                else:
                    in_code_block = True
                    code_lines = []
                i += 1
                continue

            if in_code_block:
                code_lines.append(line)
                i += 1
                continue

            # Table line detection
            if "|" in trimmed and (trimmed.startswith("|") or trimmed.endswith("|")):
                table_buffer.append(trimmed)
                i += 1
                continue
            elif table_buffer:
                parsed_table = self._parse_markdown_table(table_buffer, body_style)
                if parsed_table:
                    story.append(parsed_table)
                    story.append(Spacer(1, 8))
                table_buffer = []

            # Blank line
            if not trimmed:
                story.append(Spacer(1, 4))
                i += 1
                continue

            # Headers
            if trimmed.startswith("# "):
                story.append(Paragraph(self._safe_xml(trimmed[2:]), h1_style))
                story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor("#CBD5E1"), spaceBefore=2, spaceAfter=6))
            elif trimmed.startswith("## "):
                story.append(Paragraph(self._safe_xml(trimmed[3:]), h2_style))
            elif trimmed.startswith("### "):
                story.append(Paragraph(self._safe_xml(trimmed[4:]), h3_style))
            elif trimmed.startswith("#### "):
                story.append(Paragraph(self._safe_xml(trimmed[5:]), h3_style))

            # Blockquote
            elif trimmed.startswith("> "):
                callout_p = Paragraph(self._safe_xml(trimmed[2:]), callout_style)
                callout_box = Table([[callout_p]], colWidths=[A4[0] - 80])
                callout_box.setStyle(TableStyle([
                    ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#F8FAFC')),
                    ('LEFTPADDING', (0, 0), (-1, -1), 10),
                    ('RIGHTPADDING', (0, 0), (-1, -1), 8),
                    ('TOPPADDING', (0, 0), (-1, -1), 6),
                    ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
                    ('LINELEFT', (0, 0), (0, -1), 3, colors.HexColor('#0284C7')),
                ]))
                story.append(callout_box)
                story.append(Spacer(1, 4))

            # Bullets & Lists
            elif trimmed.startswith("- ") or trimmed.startswith("* "):
                bullet_text = f"&bull;&nbsp;&nbsp;{self._safe_xml(trimmed[2:])}"
                story.append(Paragraph(bullet_text, bullet_style))
            elif re.match(r"^\d+\.\s+", trimmed):
                match = re.match(r"^(\d+\.)\s+(.+)$", trimmed)
                if match:
                    prefix, item_text = match.groups()
                    list_text = f"<b>{prefix}</b>&nbsp;&nbsp;{self._safe_xml(item_text)}"
                    story.append(Paragraph(list_text, bullet_style))
                else:
                    story.append(Paragraph(self._safe_xml(trimmed), body_style))

            # Regular Paragraph
            else:
                story.append(Paragraph(self._safe_xml(trimmed), body_style))

            i += 1

        # Flush any remaining table buffer
        if table_buffer:
            parsed_table = self._parse_markdown_table(table_buffer, body_style)
            if parsed_table:
                story.append(parsed_table)
                story.append(Spacer(1, 8))

        # Build document with NumberedCanvas
        doc.build(story, canvasmaker=NumberedCanvas)
        logger.info(f"Generated PDF document: {output_path}")

        return {
            "success": True,
            "title": title,
            "filename": output_filename,
            "file_path": output_path,
            "download_url": f"/api/files/download/{output_filename}"
        }


pdf_service = PDFService()
