from app.database import SessionLocal
from app.models.activity import Activity
from app.models.emission import Emission

db = SessionLocal()
activities = db.query(Activity).all()
emissions = db.query(Emission).all()

print(f"--- DATABASE CHECK ---")
print(f"Activități găsite: {len(activities)}")
for a in activities:
    print(f"ID: {a.id} | Tip: {a.activity_type} | Perioadă: {a.period} | Scope: {a.scope}")

print(f"\nEmisii calculate: {len(emissions)}")
for e in emissions:
    print(f"ID: {e.id} | Activity_ID: {e.activity_id} | Valoare: {e.co2e_value}")
db.close()