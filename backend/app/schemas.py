from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List

class InvoiceBase(BaseModel):
    invoice_number: str
    client_name: str
    client_email: str
    amount_due: float
    due_date: datetime
    payment_link: str

class InvoiceCreate(InvoiceBase):
    pass

class InvoiceResponse(InvoiceBase):
    id: int
    followup_count: int
    status: str

    class Config:
        from_attributes = True

class AuditLogResponse(BaseModel):
    id: int
    invoice_id: int
    timestamp: datetime
    action: str
    tone_used: Optional[str]
    escalation_stage: Optional[int]
    generated_email: Optional[str]
    ai_reasoning: Optional[str]

    class Config:
        from_attributes = True

class EmailGenerationRequest(BaseModel):
    invoice_id: int
    mode: str = Field(..., description="live or dry_run")
