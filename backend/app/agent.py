import os
from datetime import datetime, timezone
from pydantic import BaseModel
from typing import Dict, Any, TypedDict, Literal
from langchain_core.prompts import ChatPromptTemplate
from langchain_google_genai import ChatGoogleGenerativeAI
from langgraph.graph import StateGraph, END
from app.models import Invoice

class AgentState(TypedDict):
    invoice: Dict[str, Any]
    overdue_days: int
    escalation_stage: int
    tone: str
    email_subject: str
    email_body: str
    action_taken: str
    error: str

# Use ChatGoogleGenerativeAI to interact with Gemini
def get_llm():
    gemini_api_key = os.environ.get("GEMINI_API_KEY", "dummy_key")
    return ChatGoogleGenerativeAI(
        google_api_key=gemini_api_key,
        model="gemini-2.5-flash",
        temperature=0.7
    )

def calculate_overdue(state: AgentState):
    invoice = state["invoice"]
    due_date = datetime.fromisoformat(invoice["due_date"])
    
    # ensure tz-awareness
    if due_date.tzinfo is None:
        due_date = due_date.replace(tzinfo=timezone.utc)
    now = datetime.now(timezone.utc)
    
    overdue_days = (now - due_date).days
    return {"overdue_days": max(0, overdue_days)}

def determine_stage(state: AgentState):
    days = state["overdue_days"]
    stage = 0
    tone = "neutral"
    
    if 1 <= days <= 7:
        stage = 1
        tone = "Warm and friendly tone, helpful reminder."
    elif 8 <= days <= 14:
        stage = 2
        tone = "Polite but firm, clear request for payment."
    elif 15 <= days <= 21:
        stage = 3
        tone = "Formal and serious, emphasizing the delay."
    elif 22 <= days <= 30:
        stage = 4
        tone = "Stern and urgent, final warning before escalation."
    elif days > 30:
        stage = 5
        tone = "Escalated to human review."
        
    return {"escalation_stage": stage, "tone": tone}

def generate_email(state: AgentState):
    if state["escalation_stage"] == 0 or state["escalation_stage"] > 4:
        # No email needed (either not overdue, or escalated to human)
        return {"action_taken": "skipped"}
        
    llm = get_llm()
    prompt = ChatPromptTemplate.from_messages([
        ("system", "You are an expert finance collections agent. Generate a highly personalized payment reminder email. "
                   "Tone required: {tone}. "
                   "Do NOT hallucinate information. ONLY use the provided invoice data."),
        ("human", "Client: {client_name}\n"
                  "Invoice Number: {invoice_number}\n"
                  "Amount Due: ${amount_due}\n"
                  "Days Overdue: {overdue_days}\n"
                  "Payment Link: {payment_link}\n\n"
                  "Generate the email with a Subject Line and Body.")
    ])
    
    chain = prompt | llm
    
    try:
        response = chain.invoke({
            "tone": state["tone"],
            "client_name": state["invoice"]["client_name"],
            "invoice_number": state["invoice"]["invoice_number"],
            "amount_due": state["invoice"]["amount_due"],
            "overdue_days": state["overdue_days"],
            "payment_link": state["invoice"]["payment_link"]
        })
        
        # Simple parser to split subject and body (assuming standard output)
        content = response.content
        lines = content.split("\n", 1)
        subject = lines[0].replace("Subject:", "").strip()
        body = lines[1].strip() if len(lines) > 1 else ""
        
        return {
            "email_subject": subject,
            "email_body": body,
            "action_taken": "generated"
        }
    except Exception as e:
        return {"error": str(e), "action_taken": "failed"}

def route_next_step(state: AgentState):
    if state.get("error"):
        return END
    if state["escalation_stage"] == 0 or state["escalation_stage"] > 4:
        return END
    return "generate_email"

# Build Graph
workflow = StateGraph(AgentState)
workflow.add_node("calculate_overdue", calculate_overdue)
workflow.add_node("determine_stage", determine_stage)
workflow.add_node("generate_email", generate_email)

workflow.set_entry_point("calculate_overdue")
workflow.add_edge("calculate_overdue", "determine_stage")
workflow.add_conditional_edges("determine_stage", route_next_step, {
    END: END,
    "generate_email": "generate_email"
})
workflow.add_edge("generate_email", END)

app_graph = workflow.compile()

def process_invoice_workflow(invoice_dict: dict):
    initial_state = {"invoice": invoice_dict}
    return app_graph.invoke(initial_state)
