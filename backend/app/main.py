from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from app import models, schemas
from app.database import engine, get_db

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="AI Finance Collections Agent API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://192.168.1.10:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"status": "ok", "message": "AI Finance Collections Agent API is running"}

@app.post("/invoices/", response_model=schemas.InvoiceResponse)
def create_invoice(invoice: schemas.InvoiceCreate, db: Session = Depends(get_db)):
    db_invoice = models.Invoice(**invoice.model_dump())
    db.add(db_invoice)
    db.commit()
    db.refresh(db_invoice)
    return db_invoice

@app.get("/invoices/", response_model=List[schemas.InvoiceResponse])
def get_invoices(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return db.query(models.Invoice).offset(skip).limit(limit).all()

@app.get("/stats/")
def get_stats(db: Session = Depends(get_db)):
    from datetime import datetime, timezone
    
    total_pending = db.query(func.sum(models.Invoice.amount_due)).filter(models.Invoice.status == "pending").scalar() or 0.0
    
    now = datetime.now(timezone.utc)
    # Using python filtering for overdue calculation since SQLite doesn't have simple datetime diff
    invoices = db.query(models.Invoice).filter(models.Invoice.status == "pending").all()
    overdue_count = sum(1 for inv in invoices if (now - inv.due_date.replace(tzinfo=timezone.utc)).days > 0)
    
    # Emails sent today
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    emails_sent_today = db.query(models.AuditLog).filter(
        models.AuditLog.action == "generated",
        models.AuditLog.timestamp >= today_start
    ).count()
    
    escalated_count = db.query(models.Invoice).filter(models.Invoice.status == "escalated").count()
    
    return {
        "total_pending_amount": total_pending,
        "overdue_count": overdue_count,
        "emails_sent_today": emails_sent_today,
        "escalated_count": escalated_count
    }

@app.post("/invoices/{invoice_id}/trigger_agent")
def trigger_agent(invoice_id: int, request: schemas.EmailGenerationRequest, db: Session = Depends(get_db)):
    from app.agent import process_invoice_workflow
    from app.models import AuditLog, EscalationQueue
    import json

    invoice = db.query(models.Invoice).filter(models.Invoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    # Convert to dict, making datetime string for state graph
    invoice_dict = invoice.__dict__.copy()
    invoice_dict.pop('_sa_instance_state', None)
    invoice_dict['due_date'] = invoice.due_date.isoformat()
    
    # Run the workflow
    result = process_invoice_workflow(invoice_dict)
    
    # Process results
    action = result.get("action_taken", "skipped")
    stage = result.get("escalation_stage", 0)
    error = result.get("error", None)

    if stage > 4:
        # Move to escalation queue
        invoice.status = "escalated"
        db.add(models.EscalationQueue(invoice_id=invoice.id))
        action = "escalated"
    
    log = models.AuditLog(
        invoice_id=invoice.id,
        action=action,
        tone_used=result.get("tone"),
        escalation_stage=stage,
        generated_email=f"{result.get('email_subject', '')}\n\n{result.get('email_body', '')}" if action == "generated" else None,
        ai_reasoning=f"Overdue by {result.get('overdue_days', 0)} days. Stage {stage}." + (f" Error: {error}" if error else "")
    )
    db.add(log)
    db.commit()

    return {"status": "success", "message": f"Agent completed in {request.mode} mode. Action taken: {action}"}

@app.get("/escalations/")
def get_escalations(db: Session = Depends(get_db)):
    escalations = db.query(models.EscalationQueue).filter(models.EscalationQueue.status == "open").all()
    
    result = []
    from datetime import datetime, timezone
    now = datetime.now(timezone.utc)
    for esc in escalations:
        inv = esc.invoice
        if not inv: continue
        
        days_overdue = (now - inv.due_date.replace(tzinfo=timezone.utc)).days
        
        result.append({
            "id": esc.id,
            "invoice_id": inv.id,
            "invoice_number": inv.invoice_number,
            "client_name": inv.client_name,
            "amount_due": inv.amount_due,
            "days_overdue": max(0, days_overdue),
            "escalation_date": esc.escalation_date.isoformat(),
            "status": esc.status
        })
    return result

@app.post("/escalations/{escalation_id}/resolve")
def resolve_escalation(escalation_id: int, db: Session = Depends(get_db)):
    esc = db.query(models.EscalationQueue).filter(models.EscalationQueue.id == escalation_id).first()
    if not esc:
        raise HTTPException(status_code=404, detail="Escalation not found")
        
    esc.status = "resolved"
    
    inv = esc.invoice
    if inv:
        inv.status = "paid" # Treat as paid/resolved manually
        
    db.commit()
    return {"status": "success"}

@app.get("/logs/")
def get_logs(db: Session = Depends(get_db)):
    logs = db.query(models.AuditLog).order_by(models.AuditLog.id.desc()).limit(15).all()
    result = []
    for log in logs:
        inv = log.invoice
        result.append({
            "id": log.id,
            "invoice_number": inv.invoice_number if inv else "Unknown",
            "timestamp": log.timestamp.isoformat(),
            "action": log.action,
            "tone_used": log.tone_used,
            "escalation_stage": log.escalation_stage,
            "generated_email": log.generated_email,
            "ai_reasoning": log.ai_reasoning
        })
    return result
