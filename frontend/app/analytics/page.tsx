"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from "recharts";
import { fetchInvoices } from "@/lib/api";
import { motion } from "framer-motion";
import { Activity, BarChart3, PieChart as PieChartIcon } from "lucide-react";

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#f97316', '#ef4444'];

// Mock historical data
const historicalData = [
  { name: 'Nov', resolved: 400, escalated: 24 },
  { name: 'Dec', resolved: 300, escalated: 13 },
  { name: 'Jan', resolved: 200, escalated: 98 },
  { name: 'Feb', resolved: 278, escalated: 39 },
  { name: 'Mar', resolved: 189, escalated: 48 },
  { name: 'Apr', resolved: 239, escalated: 38 },
];

export default function Analytics() {
  const [stageData, setStageData] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const invoices = await fetchInvoices();
      
      const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      
      invoices.forEach((inv: any) => {
        const daysOverdue = Math.max(0, Math.floor((new Date().getTime() - new Date(inv.due_date).getTime()) / (1000 * 3600 * 24)));
        const stage = daysOverdue > 30 ? 5 : Math.floor(daysOverdue / 7) + 1;
        if (stage <= 5) counts[stage as keyof typeof counts]++;
      });
      
      const pieData = Object.keys(counts).map(key => ({
        name: `Stage ${key}${key === '5' ? ' (Escalated)' : ''}`,
        value: counts[parseInt(key) as keyof typeof counts]
      })).filter(item => item.value > 0);
      
      setStageData(pieData);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex-1 space-y-6 p-8 pt-6"
    >
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Activity className="h-8 w-8 text-primary" />
            Performance Analytics
          </h2>
          <p className="text-muted-foreground mt-2">
            Deep dive into the efficiency of your AI Collections Agent over time.
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Pipeline Distribution Pie Chart */}
        <Card className="col-span-1 shadow-sm border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <PieChartIcon className="h-5 w-5" />
              Current Pipeline Distribution
            </CardTitle>
            <CardDescription>
              Real-time distribution of active invoices across all AI escalation stages.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[350px] w-full flex items-center justify-center">
              {stageData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stageData}
                      cx="50%"
                      cy="50%"
                      innerRadius={80}
                      outerRadius={120}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {stageData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip formatter={(value) => [`${value} Invoices`, 'Count']} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-muted-foreground">Loading distribution data...</div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Historical Bar Chart */}
        <Card className="col-span-1 shadow-sm border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <BarChart3 className="h-5 w-5" />
              Historical Recovery Trend
            </CardTitle>
            <CardDescription>
              Comparison of successfully resolved vs manually escalated accounts over the last 6 months.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={historicalData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#888888" opacity={0.2} />
                  <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                  <RechartsTooltip 
                    cursor={{fill: 'rgba(255, 255, 255, 0.05)'}}
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}
                  />
                  <Legend />
                  <Bar dataKey="resolved" name="Auto-Resolved (AI)" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={50} />
                  <Bar dataKey="escalated" name="Escalated (Human)" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={50} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}
