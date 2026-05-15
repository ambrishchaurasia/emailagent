"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ArrowUpRight, DollarSign, Users, AlertCircle } from "lucide-react";
import { fetchStats, fetchLogs } from "@/lib/api";

const data = [
  { name: "Jan", amount: 4000 },
  { name: "Feb", amount: 3000 },
  { name: "Mar", amount: 2000 },
  { name: "Apr", amount: 2780 },
  { name: "May", amount: 1890 },
  { name: "Jun", amount: 2390 },
];

export default function Dashboard() {
  const [stats, setStats] = useState({
    total_pending_amount: 0,
    overdue_count: 0,
    emails_sent_today: 0,
    escalated_count: 0
  });
  const [logs, setLogs] = useState<any[]>([]);
  const [expandedLog, setExpandedLog] = useState<number | null>(null);

  useEffect(() => {
    fetchStats().then(data => setStats(data)).catch(console.error);
    fetchLogs().then(data => setLogs(data)).catch(console.error);
  }, []);
  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pending</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.total_pending_amount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
            <p className="text-xs text-muted-foreground">Real-time DB data</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue Invoices</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.overdue_count}</div>
            <p className="text-xs text-muted-foreground">Real-time DB data</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Emails Sent Today</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.emails_sent_today}</div>
            <p className="text-xs text-muted-foreground">Real-time DB data</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Escalated Accounts</CardTitle>
            <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.escalated_count}</div>
            <p className="text-xs text-muted-foreground">Real-time DB data</p>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Recovery Analytics</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <ResponsiveContainer width="100%" height={350}>
              <AreaChart data={data}>
                <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                <Tooltip />
                <Area type="monotone" dataKey="amount" stroke="#8884d8" fill="#8884d8" fillOpacity={0.3} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <p className="text-sm text-muted-foreground">Live feed of AI actions & generated emails.</p>
          </CardHeader>
          <CardContent className="overflow-hidden">
            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
              {logs.map((log) => (
                <div key={log.id} className="flex flex-col border-b border-border/50 pb-4 last:border-0 last:pb-0">
                  <div className="flex items-start justify-between cursor-pointer hover:bg-muted/50 p-2 rounded-md transition-colors" onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}>
                    <div className="space-y-1">
                      <p className="text-sm font-bold leading-none text-foreground">Invoice {log.invoice_number}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(log.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - {log.action === "generated" ? "Email Generated" : log.action === "skipped" ? "Skipped (Not Overdue)" : "Action Failed"}
                      </p>
                      {log.tone_used && <p className="text-xs text-primary font-medium">Tone: {log.tone_used}</p>}
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {log.escalation_stage ? <div className="text-xs font-medium px-2 py-0.5 bg-secondary text-secondary-foreground rounded-full border shadow-sm">Stage {log.escalation_stage}</div> : null}
                      {log.generated_email && (
                        <span className="text-xs text-primary hover:underline font-medium">
                          {expandedLog === log.id ? "Hide Email" : "View Email"}
                        </span>
                      )}
                    </div>
                  </div>
                  {expandedLog === log.id && log.generated_email && (
                    <div className="mt-3 p-4 bg-muted/30 rounded-md text-sm whitespace-pre-wrap text-foreground overflow-x-auto max-h-64 overflow-y-auto border border-border/50 shadow-inner font-sans">
                      {log.generated_email}
                    </div>
                  )}
                  {expandedLog === log.id && !log.generated_email && log.ai_reasoning && (
                    <div className="mt-3 p-3 bg-red-50 text-red-800 rounded-md text-sm border border-red-200">
                      <strong>AI Reasoning/Error:</strong> {log.ai_reasoning}
                    </div>
                  )}
                </div>
              ))}
              {logs.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">No recent activity found in database.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
