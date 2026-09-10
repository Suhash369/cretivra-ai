import os
import re
import uuid
from typing import Dict, Any, List, Optional
import pptx
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN

from app.core.config import settings
from app.core.security import sanitize_filename
from app.core.logging import logger

THEMES = {
    "modern-dark": {
        "bg": RGBColor(15, 23, 42),          # Slate 900
        "card_bg": RGBColor(30, 41, 59),     # Slate 800
        "primary": RGBColor(56, 189, 248),    # Sky 400
        "text": RGBColor(248, 250, 252),     # Slate 50
        "muted": RGBColor(148, 163, 184),    # Slate 400
        "accent": RGBColor(129, 140, 248)    # Indigo 400
    },
    "corporate-navy": {
        "bg": RGBColor(255, 255, 255),       # White
        "card_bg": RGBColor(241, 245, 249),  # Slate 100
        "primary": RGBColor(15, 23, 42),     # Navy Slate
        "text": RGBColor(15, 23, 42),        # Dark text
        "muted": RGBColor(100, 116, 139),    # Slate 500
        "accent": RGBColor(2, 132, 199)      # Blue 600
    }
}

class PresentationService:
    def __init__(self, output_dir: Optional[str] = None):
        self.output_dir = os.path.abspath(output_dir or os.path.join(settings.UPLOAD_DIR, "generated"))
        os.makedirs(self.output_dir, exist_ok=True)

    def generate_presentation(
        self,
        title: str,
        slides: List[Dict[str, Any]],
        subtitle: Optional[str] = None,
        theme_name: str = "modern-dark"
    ) -> Dict[str, Any]:
        """
        Creates a high-aesthetic, professional 16:9 widescreen PowerPoint presentation (.pptx).
        """
        theme = THEMES.get(theme_name, THEMES["modern-dark"])
        prs = pptx.Presentation()

        # Set 16:9 Widescreen aspect ratio (13.333 x 7.5 inches)
        prs.slide_width = Inches(13.333)
        prs.slide_height = Inches(7.5)
        blank_slide_layout = prs.slide_layouts[6]

        # 1. Title Slide
        title_slide = prs.slides.add_slide(blank_slide_layout)
        self._apply_background(title_slide, theme["bg"])

        # Accent decorative bar
        accent_shape = title_slide.shapes.add_shape(
            pptx.enum.shapes.MSO_SHAPE.RECTANGLE,
            Inches(1.5), Inches(1.8), Inches(1.2), Inches(0.1)
        )
        accent_shape.fill.solid()
        accent_shape.fill.fore_color.rgb = theme["primary"]
        accent_shape.line.color.rgb = theme["primary"]

        # Main Title Box
        title_box = title_slide.shapes.add_textbox(Inches(1.5), Inches(2.2), Inches(10.33), Inches(2.2))
        tf = title_box.text_frame
        tf.word_wrap = True
        p = tf.paragraphs[0]
        p.text = title.strip()
        p.font.size = Pt(44)
        p.font.bold = True
        p.font.color.rgb = theme["text"]
        p.font.name = "Calibri"

        # Subtitle
        sub_text = subtitle or "Prepared with Cretivra AI Intelligence Platform"
        sub_box = title_slide.shapes.add_textbox(Inches(1.5), Inches(4.5), Inches(10.33), Inches(1.0))
        sub_tf = sub_box.text_frame
        sub_tf.word_wrap = True
        sub_p = sub_tf.paragraphs[0]
        sub_p.text = sub_text
        sub_p.font.size = Pt(20)
        sub_p.font.color.rgb = theme["muted"]
        sub_p.font.name = "Calibri"

        # 2. Content Slides
        for idx, slide_info in enumerate(slides, 1):
            slide = prs.slides.add_slide(blank_slide_layout)
            self._apply_background(slide, theme["bg"])

            # Top slide category / step indicator
            cat_box = slide.shapes.add_textbox(Inches(1.2), Inches(0.7), Inches(10.9), Inches(0.4))
            cat_p = cat_box.text_frame.paragraphs[0]
            cat_p.text = f"SECTION {idx:02d} / {len(slides):02d}"
            cat_p.font.size = Pt(11)
            cat_p.font.bold = True
            cat_p.font.color.rgb = theme["primary"]

            # Slide Header Title
            h_box = slide.shapes.add_textbox(Inches(1.2), Inches(1.1), Inches(10.9), Inches(0.9))
            h_tf = h_box.text_frame
            h_tf.word_wrap = True
            h_p = h_tf.paragraphs[0]
            h_p.text = slide_info.get("title", f"Slide {idx}")
            h_p.font.size = Pt(28)
            h_p.font.bold = True
            h_p.font.color.rgb = theme["text"]

            # Content Card container
            card = slide.shapes.add_shape(
                pptx.enum.shapes.MSO_SHAPE.ROUNDED_RECTANGLE,
                Inches(1.2), Inches(2.2), Inches(10.9), Inches(4.3)
            )
            card.fill.solid()
            card.fill.fore_color.rgb = theme["card_bg"]
            card.line.color.rgb = theme["card_bg"]

            # Bullets / Content inside Card
            content_box = slide.shapes.add_textbox(Inches(1.6), Inches(2.5), Inches(10.1), Inches(3.7))
            ctf = content_box.text_frame
            ctf.word_wrap = True

            bullets = slide_info.get("bullets", [])
            for b_idx, bullet in enumerate(bullets):
                p = ctf.add_paragraph() if b_idx > 0 else ctf.paragraphs[0]
                p.text = f"•   {bullet.strip()}"
                p.font.size = Pt(17)
                p.font.color.rgb = theme["text"]
                p.space_after = Pt(14)

            # Footer / Slide Number
            footer_box = slide.shapes.add_textbox(Inches(1.2), Inches(6.8), Inches(10.9), Inches(0.4))
            ftp = footer_box.text_frame.paragraphs[0]
            ftp.text = f"Cretivra AI Presentation Engine  |  Slide {idx + 1}"
            ftp.font.size = Pt(10)
            ftp.font.color.rgb = theme["muted"]

        # Save to output file
        clean_name = sanitize_filename(title)
        file_id = str(uuid.uuid4())[:8]
        output_filename = f"{clean_name}_{file_id}.pptx"
        output_path = os.path.join(self.output_dir, output_filename)

        prs.save(output_path)
        logger.info(f"Generated PowerPoint presentation: {output_path}")

        return {
            "success": True,
            "title": title,
            "filename": output_filename,
            "file_path": output_path,
            "slide_count": len(slides) + 1,
            "download_url": f"/api/files/download/{output_filename}"
        }

    def _apply_background(self, slide: Any, color: RGBColor):
        bg = slide.background
        fill = bg.fill
        fill.solid()
        fill.fore_color.rgb = color

    def detect_presentation_request(self, text: str) -> bool:
        """
        Determines if the user prompt is asking to create/generate a PowerPoint or presentation.
        """
        p = text.lower().strip()
        triggers = [
            "presentation", "powerpoint", "ppt", "pptx", "slide deck",
            "slides on", "slides about", "create a deck", "generate a deck",
            "make slides", "pitch deck"
        ]
        return any(t in p for t in triggers)

    def parse_slides_from_text(self, text: str, default_title: str = "AI Presentation") -> Dict[str, Any]:
        """
        Parses slide structures from markdown (e.g., '### Slide 1: Title' with bullet lists).
        """
        slide_blocks = re.split(r"(?:###?\s*(?:Slide\s*\d+|[0-9]+\.)\s*[:\-]?\s*)", text, flags=re.IGNORECASE)
        slides: List[Dict[str, Any]] = []

        for block in slide_blocks:
            lines = [line.strip() for line in block.strip().split("\n") if line.strip()]
            if not lines:
                continue

            slide_title = lines[0].lstrip("#*-: ").strip()
            bullets = []
            for line in lines[1:]:
                cleaned = line.lstrip("*-•123456789.) ").strip()
                if cleaned and len(cleaned) > 3:
                    bullets.append(cleaned)

            if slide_title and bullets:
                slides.append({
                    "title": slide_title,
                    "bullets": bullets[:6]
                })

        # Fallback if no explicit slides found
        if not slides:
            paragraphs = [p.strip() for p in text.split("\n\n") if p.strip() and len(p.strip()) > 20]
            for idx, para in enumerate(paragraphs[:5], 1):
                sentences = [s.strip() for s in para.split(". ") if s.strip()]
                slides.append({
                    "title": f"Key Topic {idx}",
                    "bullets": sentences[:4]
                })

        return {
            "title": default_title,
            "slides": slides or [
                {"title": "Overview", "bullets": ["Key concepts and foundational insights", "Strategic objectives", "Execution plan"]},
                {"title": "Key Findings", "bullets": ["Performance improvements", "Operational efficiency", "Future scope"]}
            ]
        }

presentation_service = PresentationService()
