def normalize_unit(unit: str) -> str:
    return unit.lower().strip()


def calculate_emission(activity_type: str, quantity: float, unit: str, is_green_energy: bool = False):
    unit = normalize_unit(unit)

    if activity_type == "natural_gas":
        if unit == "kwh":
            factor = 0.183
            co2e = quantity * factor
            return co2e, factor, "kgCO2e/kWh", f"{quantity} kWh * {factor}"

        if unit == "gj":
            quantity_kwh = quantity * 277.778
            factor = 0.183
            co2e = quantity_kwh * factor
            return co2e, factor, "kgCO2e/kWh", f"{quantity} GJ * 277.778 * {factor}"

    if activity_type == "diesel":
        factor = 2.68
        co2e = quantity * factor
        return co2e, factor, "kgCO2e/liter", f"{quantity} liters * {factor}"

    if activity_type == "petrol":
        factor = 2.31
        co2e = quantity * factor
        return co2e, factor, "kgCO2e/liter", f"{quantity} liters * {factor}"

    if activity_type == "electricity":
        location_factor = 0.21
        market_factor = 0 if is_green_energy else 0.21

        location_based = quantity * location_factor
        market_based = quantity * market_factor

        return market_based, market_factor, "kgCO2e/kWh", (
            f"Market-based: {quantity} kWh * {market_factor}; "
            f"Location-based: {quantity} kWh * {location_factor} = {location_based} kgCO2e"
        )

    if activity_type == "purchased_heating":
        quantity_kwh = quantity * 1000 if unit == "mwh" else quantity
        factor = 0.202
        co2e = quantity_kwh * factor
        return co2e, factor, "kgCO2e/kWh", f"{quantity_kwh} kWh * {factor}"

    return 0.0, 0.0, "unknown", "No calculation rule found"