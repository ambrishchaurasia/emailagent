"use client";

import { useEffect, useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { fetchEscalations, resolveEscalation } from "@/lib/api";
import { AlertCircle, CheckCircle2 } from "lucide-react";

export default function Escalations() {
  const [escalations, setEscalations] = useState<any[]>([]);
  const [loadingIds, setLoadingIds] = useState<Record<number, boolean>>({});

  useEffect(() => {
    loadEscalations();
  }, []);

  const loadEscalations = async () => {
    try {
      const data = await fetchEscalations();
      setEscalations(data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleResolve = async (id: number) => {
    setLoadingIds(prev => ({ ...prev, [id]: true }));
    try {
      await resolveEscalation(id);
      await loadEscalations();
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingIds(prev => ({ ...prev, [id]: false }));
    }
  };

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-destructive flex items-center gap-2">
            <AlertCircle className="h-8 w-8" />
            Human Escalation Queue
          </h2>
          <p className="text-muted-foreground mt-2">
            These invoices have reached Stage 5 (30+ days overdue). The AI has paused automated outreach and requires manual intervention.
          </p>
        </div>
      </div>
      
      {escalations.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 border rounded-md border-dashed">
          <CheckCircle2 className="h-12 w-12 text-green-500 mb-4" />
          <h3 className="text-xl font-medium">Queue is empty</h3>
          <p className="text-muted-foreground">All escalations have been resolved.</p>
        </div>
      ) : (
        <div className="border rounded-md bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Escalation ID</TableHead>
                <TableHead>Invoice</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Amount Due</TableHead>
                <TableHead>Days Overdue</TableHead>
                <TableHead>Escalated On</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {escalations.map((esc) => (
                <TableRow key={esc.id} className="bg-destructive/5 hover:bg-destructive/10 transition-colors">
                  <TableCell className="font-medium text-destructive">ESC-{esc.id}</TableCell>
                  <TableCell className="font-mono">{esc.invoice_number}</TableCell>
                  <TableCell className="font-bold">{esc.client_name}</TableCell>
                  <TableCell>${esc.amount_due.toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge variant="destructive" className="animate-pulse">
                      {esc.days_overdue} Days
                    </Badge>
                  </TableCell>
                  <TableCell>{new Date(esc.escalation_date).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <Button 
                      variant="default" 
                      onClick={() => handleResolve(esc.id)}
                      disabled={loadingIds[esc.id]}
                    >
                      {loadingIds[esc.id] ? "Resolving..." : "Mark Resolved"}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
