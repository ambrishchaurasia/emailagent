const API_BASE_URL = "http://127.0.0.1:8000";

export async function fetchInvoices() {
  const response = await fetch(`${API_BASE_URL}/invoices/`);
  if (!response.ok) {
    throw new Error("Failed to fetch invoices");
  }
  return response.json();
}

export async function fetchStats() {
  const response = await fetch(`${API_BASE_URL}/stats/`);
  if (!response.ok) {
    throw new Error("Failed to fetch stats");
  }
  return response.json();
}

export async function triggerAgent(invoiceId: number) {
  const response = await fetch(`${API_BASE_URL}/invoices/${invoiceId}/trigger_agent`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ invoice_id: invoiceId, mode: "dry_run" }),
  });
  
  if (!response.ok) {
    const errText = await response.text();
    console.error("API Error Response:", errText);
    throw new Error(`Failed to trigger agent: ${response.status} ${errText}`);
  }
  return response.json();
}

export async function fetchEscalations() {
  const response = await fetch(`${API_BASE_URL}/escalations/`);
  if (!response.ok) {
    throw new Error("Failed to fetch escalations");
  }
  return response.json();
}

export async function resolveEscalation(id: number) {
  const response = await fetch(`${API_BASE_URL}/escalations/${id}/resolve`, {
    method: "POST"
  });
  if (!response.ok) {
    throw new Error("Failed to resolve escalation");
  }
  return response.json();
}

export async function fetchLogs() {
  const response = await fetch(`${API_BASE_URL}/logs/`);
  if (!response.ok) {
    throw new Error("Failed to fetch logs");
  }
  return response.json();
}
