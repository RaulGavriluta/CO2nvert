import os
import asyncio
from pathlib import Path
from uuid import uuid4

from jinja2 import Environment, FileSystemLoader
from playwright.async_api import async_playwright

BASE_DIR = Path(__file__).resolve().parent.parent
TEMPLATE_DIR = BASE_DIR / "templates"
REPORTS_DIR = Path("storage/reports")


async def html_to_pdf(html_content: str, output_path: str):
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()

        await page.set_content(html_content, wait_until="networkidle")

        await page.pdf(
            path=output_path,
            format="A4",
            print_background=True,
            margin={
                "top": "20mm",
                "right": "18mm",
                "bottom": "20mm",
                "left": "18mm",
            },
        )

        await browser.close()


def generate_report_pdf(context: dict) -> str:
    os.makedirs(REPORTS_DIR, exist_ok=True)

    env = Environment(loader=FileSystemLoader(str(TEMPLATE_DIR)))
    template = env.get_template("report.html")

    html_content = template.render(**context)

    filename = f"co2nvert_report_{uuid4()}.pdf"
    output_path = REPORTS_DIR / filename

    asyncio.run(html_to_pdf(html_content, str(output_path)))

    return str(output_path)