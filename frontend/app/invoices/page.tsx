"use client";

import { useEffect, useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { fetchInvoices, triggerAgent } from "@/lib/api";

export default function Invoices() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loadingIds, setLoadingIds] = useState<Record<number, boolean>>({});

  useEffect(() => {
    loadInvoices();
  }, []);

  const loadInvoices = async () => {
    try {
      const data = await fetchInvoices();
      setInvoices(data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleTriggerAgent = async (id: number) => {
    setLoadingIds(prev => ({ ...prev, [id]: true }));
    try {
      await triggerAgent(id);
      // Reload to reflect any status changes
      await loadInvoices();
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingIds(prev => ({ ...prev, [id]: false }));
    }
  };

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Invoices</h2>
        <div className="flex items-center space-x-2">
          <Button>Upload CSV</Button>
          <Button variant="outline">Add Manual</Button>
        </div>
      </div>
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Invoice ID</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Days Overdue</TableHead>
              <TableHead>Stage</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices.map((inv) => {
              const daysOverdue = Math.max(0, Math.floor((new Date().getTime() - new Date(inv.due_date).getTime()) / (1000 * 3600 * 24)));
              // Mock stage calc for display if not on backend
              const stage = daysOverdue > 30 ? 5 : Math.floor(daysOverdue / 7) + 1;
              return (
              <TableRow key={inv.id}>
                <TableCell className="font-medium">{inv.invoice_number}</TableCell>
                <TableCell>{inv.client_name}</TableCell>
                <TableCell>${inv.amount_due.toLocaleString()}</TableCell>
                <TableCell>
                  <span className={daysOverdue > 20 ? "text-red-500 font-bold" : ""}>
                    {daysOverdue} days
                  </span>
                </TableCell>
                <TableCell>
                  <Badge variant={stage > 3 ? "destructive" : "secondary"}>Stage {stage}</Badge>
                </TableCell>
                <TableCell>{inv.status}</TableCell>
                <TableCell className="text-right">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleTriggerAgent(inv.id)}
                    disabled={loadingIds[inv.id] || inv.status === 'escalated'}
                  >
                    {loadingIds[inv.id] ? "Processing..." : "Trigger Agent"}
                  </Button>
                </TableCell>
              </TableRow>
            )})}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
