from app.database import engine, Base, SessionLocal
from app import models
from datetime import datetime, timedelta, timezone
import random

# Create tables
Base.metadata.create_all(bind=engine)

def seed_db():
    db = SessionLocal()
    
    # Check if we already have data
    if db.query(models.Invoice).count() > 0:
        print("Database already seeded!")
        return

    now = datetime.now(timezone.utc)
    
    clients = ["Acme Corp", "Globex", "Soylent Corp", "Initech", "Massive Dynamic"]
    
    invoices = []
    for i in range(1, 11):
        client = random.choice(clients)
        # Create some overdue, some not overdue
        days_offset = random.randint(-40, 10) # negative means overdue
        due_date = now + timedelta(days=days_offset)
        
        status = "pending"
        if days_offset < -30:
            status = random.choice(["pending", "escalated"])
            
        inv = models.Invoice(
            invoice_number=f"INV-10{i:02d}",
            client_name=client,
            client_email=f"billing@{client.lower().replace(' ', '')}.com",
            amount_due=round(random.uniform(500.0, 15000.0), 2),
            due_date=due_date,
            status=status,
            payment_link=f"https://pay.example.com/inv10{i:02d}"
        )
        db.add(inv)
        
    db.commit()
    
    # Add a fake audit log just to show emails sent today
    inv = db.query(models.Invoice).first()
    log = models.AuditLog(
        invoice_id=inv.id,
        action="generated",
        tone_used="Friendly",
        escalation_stage=1,
        timestamp=now - timedelta(hours=2)
    )
    db.add(log)
    db.commit()
    
    print("Database seeded successfully with 10 invoices!")
    db.close()

if __name__ == "__main__":
    seed_db()
