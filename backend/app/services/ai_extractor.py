import re


def normalize_text(text: str) -> str:
    return (
        text.lower()
        .replace("m³", "m3")
        .replace("mc", "m3")
        .replace("\r", " ")
        .replace("\n", " ")
    )

def parse_energy_number(value: str) -> float:
    value = value.strip().replace(" ", "")

    # 125.600 kWh -> 125600
    # 1.250 kWh -> 1250
    if "." in value and "," not in value:
        return float(value.replace(".", ""))

    return parse_number(value)

def parse_number(value: str) -> float:
    """
    Parsează numere fără să ghicească agresiv separatorii de mii.

    Exemple:
    34.73       -> 34.73
    125.600     -> 125.6
    450,000000  -> 450.0
    125.403,18  -> 125403.18
    125,403.18  -> 125403.18
    """
    value = value.strip().replace(" ", "")

    has_dot = "." in value
    has_comma = "," in value

    if has_dot and has_comma:
        last_dot = value.rfind(".")
        last_comma = value.rfind(",")

        if last_comma > last_dot:
            # format european: 125.403,18
            value = value.replace(".", "").replace(",", ".")
        else:
            # format US: 125,403.18
            value = value.replace(",", "")

        return float(value)

    if has_comma:
        return float(value.replace(",", "."))

    return float(value)


def detect_document_type(text: str) -> str:
    t = normalize_text(text)

    if any(k in t for k in [
        "natural gas",
        "gaze naturale",
        "gas charges",
        "amount of natural gas",
        "units of natural gas",
        "gj multiplier",
        "new charges based on",
    ]):
        return "gas_invoice"

    if any(k in t for k in [
        "energie termica",
        "energie termică",
        "incalzire",
        "încălzire",
        "apa calda",
        "apă caldă",
        "termoenergetica",
        "termoficare",
    ]):
        return "thermal_invoice"

    if any(k in t for k in [
        "kwh",
        "mwh",
        "electricity",
        "energie electrica",
        "energie electrică",
        "energie activa",
        "energie activă",
    ]):
        return "electricity_invoice"

    if any(k in t for k in [
        "diesel",
        "motorina",
        "motorină",
        "benzina",
        "benzină",
        "gasoline",
        "petrol",
        "fuel type",
        "fuel",
        "litri",
        "liter",
        "liters",
        " l ",
    ]):
        return "fuel_receipt"

    return "unknown"


def find_value_after_keywords(text: str, keywords: list[str], units: list[str]):
    t = normalize_text(text)
    unit_pattern = "|".join(re.escape(u.lower()) for u in units)

    candidates = []

    for keyword in keywords:
        for match in re.finditer(re.escape(keyword.lower()), t):
            start = max(0, match.start() - 40)
            end = min(len(t), match.end() + 180)
            window = t[start:end]

            pattern = rf"(\d+(?:[.,]\d+)*)\s*({unit_pattern})\b"
            found = re.findall(pattern, window)

            for number, unit in found:
                candidates.append({
                    "quantity": parse_number(number),
                    "unit": unit,
                    "score": 0.95,
                    "source": window,
                })

    if candidates:
        return candidates[0]

    return None


def find_any_value_with_unit(text: str, units: list[str]):
    t = normalize_text(text)
    unit_pattern = "|".join(re.escape(u.lower()) for u in units)

    pattern = rf"(\d+(?:[.,]\d+)*)\s*({unit_pattern})\b"
    matches = re.findall(pattern, t)

    if not matches:
        return None

    number, unit = matches[0]

    return {
        "quantity": parse_number(number),
        "unit": unit,
        "score": 0.65,
        "source": "fallback_unit_match",
    }


def extract_gas_quantity(text: str):
    result = find_value_after_keywords(
        text,
        keywords=[
            "amount of natural gas you used",
            "units of natural gas you used",
            "new charges based on",
            "natural gas charges",
            "consumption",
        ],
        units=["gj", "m3"],
    )

    if result:
        return result["quantity"], result["unit"].upper(), result["score"]

    fallback = find_any_value_with_unit(text, ["gj", "m3"])

    if fallback:
        return fallback["quantity"], fallback["unit"].upper(), fallback["score"]

    return 0.0, "unknown", 0.2


def extract_electricity_quantity(text: str):
    t = normalize_text(text)

    patterns = [
        r"consum energie activ[ăa]\s*:\s*(\d+(?:[.,]\d+)*)\s*kwh",
        r"energie activ[ăa]\s*:\s*(\d+(?:[.,]\d+)*)\s*kwh",
        r"consumption\s*:\s*(\d+(?:[.,]\d+)*)\s*kwh",
        r"(\d+(?:[.,]\d+)*)\s*kwh",
    ]

    for pattern in patterns:
        match = re.search(pattern, t)

        if match:
            return parse_energy_number(match.group(1)), "kWh", 0.95

    fallback = find_any_value_with_unit(text, ["kwh", "mwh"])

    if fallback:
        return fallback["quantity"], fallback["unit"], fallback["score"]

    return 0.0, "unknown", 0.2

def extract_thermal_quantity(text: str):
    values = []

    for line in text.splitlines():
        line_normalized = normalize_text(line)

        is_thermal_row = any(k in line_normalized for k in [
            "incalzire",
            "încălzire",
            "apa calda",
            "apă caldă",
        ])

        if not is_thermal_row or "mwh" not in line_normalized:
            continue

        mwh_index = line_normalized.find("mwh")
        after_mwh = line[mwh_index + 3:]

        numbers_after_mwh = re.findall(r"\d+(?:[.,]\d+)*", after_mwh)

        if numbers_after_mwh:
            values.append(parse_number(numbers_after_mwh[0]))

    if values:
        return sum(values), "MWh", 0.95

    consumption_like_values = re.findall(r"\b\d+[,.]000000\b", text)

    parsed_values = [
        parse_number(value)
        for value in consumption_like_values
    ]

    parsed_values = [
        value for value in parsed_values
        if 0 < value < 5000
    ]

    if parsed_values:
        return sum(parsed_values[:2]), "MWh", 0.75

    return 0.0, "unknown", 0.2


def extract_fuel_quantity(text: str):
    """
    Extrage cantitatea de carburant, nu prețul.

    Cazuri suportate:
    - 34.73 L BENZINA EXTRA @ $9.07
    - 34.73 BENZINA EXTRA @ $9.07
    - DIESEL 48.20 L
    - MOTORINA 48,20 L
    - 48.20 liters diesel
    """
    t = normalize_text(text)

    fuel_words = r"(?:benzina|benzină|diesel|motorina|motorină|gasoline|petrol|regular)"
    number = r"(\d+(?:[.,]\d+)*)"

    for line in text.splitlines():
        original_line = line.strip()
        line_normalized = normalize_text(original_line)

        if not any(k in line_normalized for k in [
            "benzina",
            "benzină",
            "diesel",
            "motorina",
            "motorină",
            "gasoline",
            "petrol",
            "regular",
        ]):
            continue

        # Ignoră linii care sunt clar doar prețuri / totaluri
        if any(k in line_normalized for k in [
            "subtotal",
            "total",
            "tax",
            "card",
            "approved",
            "price/gal",
        ]):
            continue

        patterns = [
            # 34.73 L BENZINA
            rf"{number}\s*(?:l|litri|liter|liters)\b.*?{fuel_words}",

            # BENZINA 34.73 L
            rf"{fuel_words}.*?{number}\s*(?:l|litri|liter|liters)\b",

            # 34.73 BENZINA EXTRA @ $9.07
            rf"{number}\s+{fuel_words}\b",

            # DIESEL 48.20
            rf"{fuel_words}\s+{number}",
        ]

        for pattern in patterns:
            match = re.search(pattern, line_normalized)

            if match:
                groups = match.groups()

                # unele patternuri au numărul în primul grup, altele în ultimul
                raw_number = groups[0] if re.match(r"\d", groups[0]) else groups[-1]

                return parse_number(raw_number), "liters", 0.90

    # fallback: caută explicit cantitate + unitate în tot textul
    result = find_value_after_keywords(
        text,
        keywords=[
            "diesel",
            "motorina",
            "motorină",
            "benzina",
            "benzină",
            "gasoline",
            "fuel",
            "litri",
            "liter",
            "liters",
        ],
        units=["litri", "liter", "liters", "l"],
    )

    if result:
        return result["quantity"], "liters", result["score"]

    fallback = find_any_value_with_unit(text, ["litri", "liter", "liters", "l"])

    if fallback:
        return fallback["quantity"], "liters", fallback["score"]

    return 0.0, "unknown", 0.2


def extract_activity_from_text(text: str, document_type: str) -> dict:
    t = normalize_text(text)

    if document_type == "gas_invoice":
        quantity, unit, confidence = extract_gas_quantity(text)

        return {
            "activity_type": "natural_gas",
            "scope": 1,
            "quantity": quantity,
            "unit": unit,
            "confidence": confidence,
        }

    if document_type == "thermal_invoice":
        quantity, unit, confidence = extract_thermal_quantity(text)

        return {
            "activity_type": "purchased_heating",
            "scope": 2,
            "quantity": quantity,
            "unit": unit,
            "confidence": confidence,
        }

    if document_type == "electricity_invoice":
        quantity, unit, confidence = extract_electricity_quantity(text)

        return {
            "activity_type": "electricity",
            "scope": 2,
            "quantity": quantity,
            "unit": unit,
            "confidence": confidence,
        }

    if document_type == "fuel_receipt":
        quantity, unit, confidence = extract_fuel_quantity(text)

        fuel_type = "diesel"

        if any(k in t for k in [
            "benzina",
            "benzină",
            "petrol",
            "gasoline",
            "regular",
        ]):
            fuel_type = "petrol"

        return {
            "activity_type": fuel_type,
            "scope": 1,
            "quantity": quantity,
            "unit": unit,
            "confidence": confidence,
        }

    return {
        "activity_type": "unknown",
        "scope": 0,
        "quantity": 0.0,
        "unit": "unknown",
        "confidence": 0.0,
    }