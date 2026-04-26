import os
import json
from typing import Any

from google import genai
from google.genai import types


USE_AI = os.getenv("USE_AI_REPORT_WRITER", "false").lower() == "true"
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")


def build_default_report_text(context: dict[str, Any]) -> dict:
    total = context.get("total_co2e_tonnes", 0)
    by_scope = context.get("by_scope", {})

    scope_1 = float(by_scope.get("scope_1_tonnes", 0) or 0)
    scope_2 = float(by_scope.get("scope_2_tonnes", 0) or 0)
    scope_3 = float(by_scope.get("scope_3_tonnes", 0) or 0)

    dominant_scope = "Scope 1"
    dominant_value = scope_1

    if scope_2 >= dominant_value:
        dominant_scope = "Scope 2"
        dominant_value = scope_2

    if scope_3 >= dominant_value:
        dominant_scope = "Scope 3"
        dominant_value = scope_3

    return {
        "executive_summary": (
            f"În perioada analizată, compania a generat un total estimat de "
            f"{total} tCO₂e. Cea mai mare contribuție provine din {dominant_scope}, "
            f"ceea ce indică faptul că principalele oportunități de reducere trebuie "
            f"analizate în zona activităților asociate acestui domeniu de emisii."
        ),
        "professional_intro": (
            "Prezentul raport oferă o imagine structurată asupra emisiilor de gaze cu efect "
            "de seră estimate pe baza documentelor procesate automat. Analiza urmărește "
            "identificarea principalelor surse de emisii și sprijinirea deciziilor privind "
            "reducerea amprentei de carbon."
        ),
        "results_interpretation": (
            f"Distribuția emisiilor arată că {dominant_scope} reprezintă categoria dominantă. "
            "Această informație este importantă pentru prioritizarea măsurilor de reducere, "
            "deoarece resursele pot fi direcționate către zonele cu cel mai mare impact."
        ),
        "chart_explanation": (
            "Diagramele evidențiază distribuția emisiilor pe Scope și pe tipuri de activități. "
            "Aceste vizualizări ajută la identificarea rapidă a surselor principale de emisii "
            "și a activităților care necesită monitorizare prioritară."
        ),
        "data_quality_note": (
            "Rezultatele depind de calitatea documentelor încărcate și de acuratețea extracției "
            "OCR. Valorile cu scor de încredere redus trebuie verificate manual înainte de "
            "utilizarea raportului în scopuri oficiale."
        ),
        "strategic_recommendations": [
            "Prioritizarea reducerii emisiilor în categoria dominantă identificată în raport.",
            "Monitorizarea lunară a consumurilor pentru identificarea rapidă a variațiilor neobișnuite.",
            "Îmbunătățirea calității datelor prin colectarea structurată a facturilor și documentelor justificative.",
            "Extinderea colectării datelor pentru Scope 3, în special pentru transport, deșeuri și achiziții.",
        ],
        "activity_narrative": (
            "Activitățile identificate au fost agregate pe tipuri de consum și pe categorii de emisii. "
            "Această abordare permite compararea contribuției fiecărei activități la amprenta totală."
        ),
    }


def _compact_context(context: dict[str, Any]) -> dict:
    return {
        "company_name": context.get("company_name"),
        "reporting_period": context.get("reporting_period"),
        "total_co2e_tonnes": context.get("total_co2e_tonnes"),
        "documents_count": context.get("documents_count"),
        "activities_count": context.get("activities_count"),
        "by_scope": context.get("by_scope"),
        "chart_activity_items": context.get("chart_activity_items"),
        "activities": context.get("activities"),
        "emission_factors": context.get("emission_factors"),
        "limitations": context.get("limitations"),
        "recommendations": context.get("recommendations"),
    }


def _build_prompt(context: dict[str, Any]) -> str:
    data = _compact_context(context)

    return f"""
Ești consultant ESG specializat în rapoarte de amprentă de carbon conform GHG Protocol.
Scrie texte profesionale în limba română pentru un raport PDF.

Reguli stricte:
- Nu inventa date.
- Folosește doar datele din JSON.
- Nu modifica valorile numerice.
- Nu include markdown.
- Nu include citări de tip [1] sau :contentReference.
- Ton: profesional, clar, consultanță ESG.
- Scrie concis, potrivit pentru raport PDF.
- Dacă lipsesc date Scope 3, menționează asta ca limitare.
- Recomandările trebuie să fie concrete și legate de sursele dominante de emisii.
- Fiecare câmp text trebuie să aibă maximum 90 de cuvinte.
- Nu folosi bullets, asteriscuri sau liste în câmpurile text.
- Câmpul activity_narrative trebuie să fie un paragraf cursiv, nu listă.
- Evită repetarea acelorași informații între executive_summary și results_interpretation.
- Nu menționa "conform standardelor GHG Protocol" de mai mult de o dată.
Returnează exclusiv JSON valid cu schema:
{{
  "executive_summary": "text",
  "professional_intro": "text",
  "results_interpretation": "text",
  "chart_explanation": "text",
  "data_quality_note": "text",
  "activity_narrative": "text",
  "strategic_recommendations": ["text", "text", "text", "text"]
}}

Date raport:
{json.dumps(data, ensure_ascii=False)}
"""


def _extract_json(text: str) -> dict:
    if not text:
        raise ValueError("Empty AI response")

    cleaned = text.strip()

    if cleaned.startswith("```json"):
        cleaned = cleaned.removeprefix("```json").strip()

    if cleaned.startswith("```"):
        cleaned = cleaned.removeprefix("```").strip()

    if cleaned.endswith("```"):
        cleaned = cleaned.removesuffix("```").strip()

    start = cleaned.find("{")
    end = cleaned.rfind("}")

    if start == -1 or end == -1:
        raise ValueError("AI response does not contain JSON")

    return json.loads(cleaned[start:end + 1])


def _normalize_ai_output(data: dict, fallback: dict) -> dict:
    output = fallback.copy()

    for key in [
        "executive_summary",
        "professional_intro",
        "results_interpretation",
        "chart_explanation",
        "data_quality_note",
        "activity_narrative",
    ]:
        value = data.get(key)
        if isinstance(value, str) and value.strip():
            output[key] = value.strip()

    recommendations = data.get("strategic_recommendations")
    if isinstance(recommendations, list):
        clean_recommendations = [
            str(item).strip()
            for item in recommendations
            if str(item).strip()
        ]

        if clean_recommendations:
            output["strategic_recommendations"] = clean_recommendations[:6]

    return output


def generate_report_text(context: dict[str, Any]) -> dict:
    fallback = build_default_report_text(context)

    if not USE_AI or not GEMINI_API_KEY:
        return fallback

    try:
        client = genai.Client(api_key=GEMINI_API_KEY)

        response = client.models.generate_content(
            model=GEMINI_MODEL,
            contents=_build_prompt(context),
            config=types.GenerateContentConfig(
                temperature=0.25,
                response_mime_type="application/json",
            ),
        )

        ai_json = _extract_json(response.text)
        return _normalize_ai_output(ai_json, fallback)

    except Exception as e:
        print("AI report writer failed:", str(e))
        return fallback