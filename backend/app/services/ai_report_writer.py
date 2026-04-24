def generate_ai_summary(total_tonnes: float, by_scope: dict, activity_breakdown: dict) -> str:
    dominant_scope = max(by_scope, key=by_scope.get)

    return (
        f"În perioada analizată, compania a generat un total estimat de "
        f"{total_tonnes:.2f} tCO₂e. Cea mai mare contribuție provine din "
        f"{dominant_scope.replace('_', ' ').title()}, ceea ce indică faptul că "
        f"principalele oportunități de reducere trebuie analizate în zona activităților "
        f"asociate acestui domeniu de emisii."
    )


def generate_ai_limitations(activities: list) -> list[str]:
    limitations = []

    if not any(activity["scope"] == 3 for activity in activities):
        limitations.append(
            "Raportul nu include încă emisii Scope 3, precum deșeuri, naveta angajaților "
            "sau călătoriile de afaceri."
        )

    if any(activity["confidence"] < 0.8 for activity in activities):
        limitations.append(
            "Unele valori au fost extrase cu un scor de încredere sub 80% și pot necesita verificare manuală."
        )

    if not limitations:
        limitations.append(
            "Datele disponibile au fost procesate automat, însă raportul trebuie revizuit înainte de utilizare oficială."
        )

    return limitations


def generate_ai_recommendations(by_scope: dict, activity_breakdown: dict) -> list[str]:
    recommendations = []

    if by_scope.get("scope_1", 0) > 0:
        recommendations.append(
            "Pentru Scope 1, compania poate analiza trecerea flotei către vehicule hibride sau electrice."
        )

    if by_scope.get("scope_2", 0) > 0:
        recommendations.append(
            "Pentru Scope 2, compania poate negocia contracte de energie verde sau investi în eficiență energetică."
        )

    if by_scope.get("scope_3", 0) == 0:
        recommendations.append(
            "Pentru o imagine completă, compania ar trebui să colecteze date pentru Scope 3: deșeuri, navetă și business travel."
        )

    if "purchased_heating" in activity_breakdown:
        recommendations.append(
            "Pentru energia termică, se recomandă optimizarea consumului prin izolație, reglaj HVAC și monitorizare lunară."
        )

    if "petrol" in activity_breakdown or "diesel" in activity_breakdown:
        recommendations.append(
            "Pentru combustibil, se recomandă monitorizarea consumului pe vehicul și planificarea rutelor eficiente."
        )

    return recommendations