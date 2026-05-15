from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.database import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    role = Column(String, default="viewer") # admin, finance, viewer

class Invoice(Base):
    __tablename__ = "invoices"
    id = Column(Integer, primary_key=True, index=True)
    invoice_number = Column(String, unique=True, index=True)
    client_name = Column(String)
    client_email = Column(String)
    amount_due = Column(Float)
    due_date = Column(DateTime)
    followup_count = Column(Integer, default=0)
    status = Column(String, default="pending") # pending, paid, escalated
    payment_link = Column(String)

class AuditLog(Base):
    __tablename__ = "audit_logs"
    id = Column(Integer, primary_key=True, index=True)
    invoice_id = Column(Integer, ForeignKey("invoices.id"))
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    action = Column(String) # e.g. "email_sent", "dry_run", "escalated"
    tone_used = Column(String, nullable=True)
    escalation_stage = Column(Integer, nullable=True)
    generated_email = Column(String, nullable=True)
    ai_reasoning = Column(String, nullable=True)
    
    invoice = relationship("Invoice")

class EscalationQueue(Base):
    __tablename__ = "escalation_queue"
    id = Column(Integer, primary_key=True, index=True)
    invoice_id = Column(Integer, ForeignKey("invoices.id"))
    escalation_date = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    status = Column(String, default="open") # open, reviewing, resolved
    assigned_to = Column(String, nullable=True)
    internal_notes = Column(String, nullable=True)
    
    invoice = relationship("Invoice")
