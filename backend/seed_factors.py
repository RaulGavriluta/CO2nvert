from app.database import SessionLocal
from app.models.emission_category import EmissionCategory
from app.models.emission_factor import EmissionFactor

def seed_emission_factors():
    db = SessionLocal()
    try:
        # Ștergem datele vechi pentru a evita conflictele
        db.query(EmissionFactor).delete()
        db.query(EmissionCategory).delete()
        
        print("🌱 Plantăm dicționarul cu factorii de emisie (Varianta Simplificată)...")

        # 1. Categoria Energie
        cat_energy = EmissionCategory(name="Energie Electrică", description="Electricitate retea", scope=2)
        db.add(cat_energy)
        db.flush()

        f1 = EmissionFactor(
            category_id=cat_energy.id,
            activity_type="electricity",
            factor_value=0.23,  # Dacă dă eroare aici, schimbă în 'value' sau 'factor'
            unit="kgCO2e/kWh"
            # AM SCOS 'year' ȘI 'source'
        )
        db.add(f1)

        # 2. Categoria Combustibili
        cat_fuel = EmissionCategory(name="Combustibili", description="Diesel", scope=1)
        db.add(cat_fuel)
        db.flush()

        f2 = EmissionFactor(
            category_id=cat_fuel.id,
            activity_type="diesel",
            factor_value=2.68, 
            unit="kgCO2e/liter"
        )
        db.add(f2)

        db.commit()
        print("✅ Factorii au fost adăugați cu succes!")

    except Exception as e:
        print(f"❌ Eroare: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_emission_factors()