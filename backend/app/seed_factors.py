from app.database import SessionLocal
from app.models.emission_category import EmissionCategory
from app.models.emission_factor import EmissionFactor

def seed_emission_factors():
    db = SessionLocal()
    try:
        # Ne asigurăm că e gol ca să nu avem dubluri dacă rulezi de mai multe ori
        db.query(EmissionFactor).delete()
        db.query(EmissionCategory).delete()
        
        print("🌱 Plantăm dicționarul cu factorii de emisie...")

        # --- CATEGORIA: ENERGIE (Scope 2) ---
        cat_energy = EmissionCategory(name="Energie Electrică", description="Electricitate din rețea", scope=2)
        db.add(cat_energy)
        db.flush()

        factor_electricity = EmissionFactor(
            category_id=cat_energy.id,
            activity_type="electricity",
            value=0.23, # exemplu: 0.23 kg CO2 per kWh
            unit="kgCO2e/kWh",
            source="DEFRA 2024",
            year=2024
        )
        db.add(factor_electricity)

        # --- CATEGORIA: COMBUSTIBILI (Scope 1) ---
        cat_fuel = EmissionCategory(name="Combustibili", description="Motorină, Benzină", scope=1)
        db.add(cat_fuel)
        db.flush()

        factor_diesel = EmissionFactor(
            category_id=cat_fuel.id,
            activity_type="diesel",
            value=2.68, # exemplu: 2.68 kg CO2 per litru
            unit="kgCO2e/liter",
            source="DEFRA 2024",
            year=2024
        )
        db.add(factor_diesel)

        db.commit()
        print("✅ Factorii de emisie au fost adăugați cu succes!")

    except Exception as e:
        print(f"❌ Eroare: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_emission_factors()