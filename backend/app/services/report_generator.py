import os
import asyncio
from pathlib import Path
from uuid import uuid4

from jinja2 import Environment, FileSystemLoader, select_autoescape
from playwright.async_api import async_playwright

from app.services.report_charts import generate_report_charts

BASE_DIR = Path(__file__).resolve().parent.parent
TEMPLATE_DIR = BASE_DIR / "templates"
REPORTS_DIR = Path("storage/reports")


async def html_to_pdf(html_content: str, output_path: str):
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page(viewport={"width": 1240, "height": 1754})

        await page.set_content(html_content, wait_until="networkidle")

        await page.pdf(
            path=output_path,
            format="A4",
            print_background=True,
            prefer_css_page_size=True,
            margin={
                "top": "0mm",
                "right": "0mm",
                "bottom": "0mm",
                "left": "0mm",
            },
        )

        await browser.close()


def prepare_report_context(context: dict) -> dict:
    """
    Completeaza contextul pentru Jinja cu grafice PNG generate server-side.
    Asteapta ca in context sa existe:
    - batch_id
    - by_scope
    - chart_activity_items
    """

    batch_id = context.get("batch_id")
    if batch_id is None:
        batch_id = uuid4().hex

    charts = generate_report_charts(
    batch_id=batch_id,
    by_scope=context.get("by_scope", {}),
    activity_items=context.get("chart_activity_items", []),
)

    context["charts"] = charts

    context["charts"] = charts

    context.setdefault("company_name", "Companie")
    context.setdefault("reporting_period", "N/A")
    context.setdefault("total_co2e_tonnes", 0)
    context.setdefault("documents_count", 0)
    context.setdefault("activities_count", 0)
    context.setdefault("activities", [])
    context.setdefault("emission_factors", [])
    context.setdefault("limitations", [])
    context.setdefault("recommendations", [])
    context.setdefault("ai_summary", "Raport generat automat pe baza documentelor procesate.")
    context.setdefault("by_scope", {})
    context.setdefault("chart_scope_items", [])
    context.setdefault("chart_activity_items", [])

    return context


def generate_report_pdf(context: dict) -> str:
    os.makedirs(REPORTS_DIR, exist_ok=True)

    context = prepare_report_context(context)

    env = Environment(
        loader=FileSystemLoader(str(TEMPLATE_DIR)),
        autoescape=select_autoescape(["html", "xml"]),
    )

    template = env.get_template("report.html")
    html_content = template.render(**context)

    filename = f"co2nvert_report_{uuid4()}.pdf"
    output_path = REPORTS_DIR / filename

    asyncio.run(html_to_pdf(html_content, str(output_path)))

    return str(output_path)