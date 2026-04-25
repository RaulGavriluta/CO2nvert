import matplotlib
matplotlib.use('Agg')  # <--- TREBUIE să fie înainte de orice import de pyplot
import matplotlib.pyplot as plt
from pathlib import Path
import base64



def _ensure_dir(path: Path):
    path.mkdir(parents=True, exist_ok=True)


def _safe_float(value):
    try:
        return float(value or 0)
    except (TypeError, ValueError):
        return 0.0


def _to_data_uri(path: Path) -> str:
    data = path.read_bytes()
    encoded = base64.b64encode(data).decode("utf-8")
    return f"data:image/png;base64,{encoded}"


def generate_scope_bar_chart(by_scope: dict, output_path: Path):
    _ensure_dir(output_path.parent)

    labels = ["Scope 1", "Scope 2", "Scope 3"]
    values = [
        _safe_float(by_scope.get("scope_1_tonnes")),
        _safe_float(by_scope.get("scope_2_tonnes")),
        _safe_float(by_scope.get("scope_3_tonnes")),
    ]

    fig, ax = plt.subplots(figsize=(7.5, 4.2))
    bars = ax.bar(labels, values)

    ax.set_ylabel("tCO₂e")
    ax.set_title("Total emisii pe Scope")
    ax.bar_label(bars, fmt="%.2f", padding=4)

    ax.spines["top"].set_visible(False)
    ax.spines["right"].set_visible(False)
    ax.grid(axis="y", alpha=0.25)

    fig.tight_layout()
    fig.savefig(output_path, dpi=180, bbox_inches="tight")
    plt.close(fig)


def generate_activity_bar_chart(activity_items: list[dict], output_path: Path):
    _ensure_dir(output_path.parent)

    labels = [item.get("name", "N/A") for item in activity_items]
    values = [_safe_float(item.get("value")) for item in activity_items]

    if not labels:
        labels = ["Fără activități"]
        values = [0]

    fig_height = max(4, len(labels) * 0.65)
    fig, ax = plt.subplots(figsize=(7.5, fig_height))

    bars = ax.barh(labels, values)

    ax.set_xlabel("tCO₂e")
    ax.set_title("Emisii pe tip activitate")
    ax.bar_label(bars, fmt="%.2f", padding=4)

    ax.invert_yaxis()
    ax.spines["top"].set_visible(False)
    ax.spines["right"].set_visible(False)
    ax.grid(axis="x", alpha=0.25)

    fig.tight_layout()
    fig.savefig(output_path, dpi=180, bbox_inches="tight")
    plt.close(fig)


def generate_scope_pie_chart(by_scope: dict, output_path: Path):
    _ensure_dir(output_path.parent)

    scope_values = {
        "Scope 1": _safe_float(by_scope.get("scope_1_tonnes")),
        "Scope 2": _safe_float(by_scope.get("scope_2_tonnes")),
        "Scope 3": _safe_float(by_scope.get("scope_3_tonnes")),
    }

    labels = [label for label, value in scope_values.items() if value > 0]
    values = [value for value in scope_values.values() if value > 0]

    fig, ax = plt.subplots(figsize=(5.2, 5.2))

    if values:
        ax.pie(
            values,
            labels=labels,
            autopct="%1.1f%%",
            startangle=90,
            wedgeprops={"linewidth": 1, "edgecolor": "white"},
        )
        ax.set_title("Distribuția emisiilor pe Scope")
    else:
        ax.text(0.5, 0.5, "Nu există emisii calculate", ha="center", va="center")
        ax.axis("off")

    fig.tight_layout()
    fig.savefig(output_path, dpi=180, bbox_inches="tight")
    plt.close(fig)


def generate_report_charts(batch_id: int | str, by_scope: dict, activity_items: list[dict]) -> dict:
    chart_dir = Path("storage/reports/charts") / str(batch_id)
    _ensure_dir(chart_dir)

    scope_bar_path = chart_dir / "scope_bar.png"
    scope_pie_path = chart_dir / "scope_pie.png"
    activity_bar_path = chart_dir / "activity_bar.png"

    generate_scope_bar_chart(by_scope, scope_bar_path)
    generate_scope_pie_chart(by_scope, scope_pie_path)
    generate_activity_bar_chart(activity_items, activity_bar_path)

    return {
        "scope_bar": _to_data_uri(scope_bar_path),
        "scope_pie": _to_data_uri(scope_pie_path),
        "activity_bar": _to_data_uri(activity_bar_path),
    }