"use client";

import * as React from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

// 1. Orlando style Staff Application Card data (Circular Donut Chart)
const donutData = [
  { name: "Pending", value: 100, color: "#6366f1" },  // Indigo
  { name: "Approved", value: 60, color: "#f97316" }, // Orange
  { name: "Rejected", value: 40, color: "#eab308" }, // Yellow
];

// 2. Annual payroll summary data (Weekly/Monthly Bar Chart)
const barData = [
  { name: "30 Sep", "Net salary": 380, Tax: 50, Loan: 120 },
  { name: "10 Oct", "Net salary": 410, Tax: 30, Loan: 80 },
  { name: "20 Oct", "Net salary": 320, Tax: 40, Loan: 70 },
  { name: "30 Oct", "Net salary": 430, Tax: 60, Loan: 110 },
  { name: "10 Nov", "Net salary": 420, Tax: 20, Loan: 50 },
];

// 3. Total income area chart data (Purple gradient area chart)
const areaData = [
  { name: "30 Sep", income: 2.1 },
  { name: "10 Oct", income: 4.8 },
  { name: "20 Oct", income: 3.4 }, // marker position
  { name: "30 Oct", income: 6.9 },
  { name: "10 Nov", income: 11.8 },
];

export function DashboardCharts() {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[400px] bg-muted/10 border border-dashed rounded-xl items-center justify-center text-xs text-muted-foreground">
        Loading interactive charts...
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* 1. Donut Card (Orlando style Staff Application) */}
      <div className="bg-card border border-border rounded-xl p-5 shadow-xs flex flex-col justify-between h-[360px]">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Order Status Summary</h3>
            <p className="text-[10px] text-muted-foreground mt-0.5">Distribution of pending and approved orders</p>
          </div>
          <button className="text-muted-foreground hover:text-foreground text-xs font-bold px-1.5 py-0.5 rounded-sm hover:bg-muted">•••</button>
        </div>

        <div className="relative flex items-center justify-center h-48">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={donutData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={76}
                paddingAngle={4}
                dataKey="value"
              >
                {donutData.map((entry: any, index: any) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [`${value} Orders`, "Status"]} />
            </PieChart>
          </ResponsiveContainer>
          {/* Circular Center Label */}
          <div className="absolute flex flex-col items-center">
            <span className="text-2xl font-bold">200</span>
            <span className="text-[10px] text-muted-foreground uppercase font-semibold">Total Orders</span>
          </div>
        </div>

        <div className="flex justify-around items-center pt-2 text-[10px] font-semibold border-t border-border">
          {donutData.map((item: any) => (
            <div key={item.name} className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
              <span className="text-muted-foreground">{item.name}:</span>
              <span className="text-foreground">{item.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Stacked Bar Card (Orlando style payroll summary) */}
      <div className="bg-card border border-border rounded-xl p-5 shadow-xs flex flex-col justify-between h-[360px]">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Production Output Plan</h3>
            <p className="text-[10px] text-muted-foreground mt-0.5">Weekly comparison of builds, QA, and reject rates</p>
          </div>
          <button className="text-muted-foreground hover:text-foreground text-xs font-bold px-1.5 py-0.5 rounded-sm hover:bg-muted">•••</button>
        </div>

        <div className="h-56 mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
              <XAxis dataKey="name" stroke="#888888" fontSize={9} tickLine={false} axisLine={false} />
              <YAxis stroke="#888888" fontSize={9} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}k`} />
              <Tooltip formatter={(value) => [`${value} Units`, ""]} />
              <Bar dataKey="Net salary" stackId="a" fill="#6366f1" radius={[0, 0, 0, 0]} name="Completed" />
              <Bar dataKey="Tax" stackId="a" fill="#f59e0b" name="QA Hold" />
              <Bar dataKey="Loan" stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} name="Rejected" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="flex items-center gap-4 text-[9px] font-semibold text-muted-foreground border-t border-border pt-3">
          <div className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-xs bg-[#6366f1]" />
            <span>Completed</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-xs bg-[#f59e0b]" />
            <span>QA Hold</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-xs bg-[#ef4444]" />
            <span>Rejected</span>
          </div>
        </div>
      </div>

      {/* 3. Income Gradient Line/Area Card (Orlando style total income) */}
      <div className="bg-card border border-border rounded-xl p-5 shadow-xs flex flex-col justify-between h-[360px]">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Total Revenue Growth</h3>
            <p className="text-[10px] text-muted-foreground mt-0.5">Aggregate invoices vs payments processed</p>
          </div>
          <button className="text-muted-foreground hover:text-foreground text-xs font-bold px-1.5 py-0.5 rounded-sm hover:bg-muted">•••</button>
        </div>

        <div className="mt-2">
          <span className="text-xl font-bold">₹11.8M</span>
          <span className="text-[10px] text-emerald-500 font-medium ml-1.5">↑ 21% vs last month</span>
        </div>

        <div className="h-44 mt-4 relative">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={areaData} margin={{ top: 10, right: 5, left: -25, bottom: 0 }}>
              <defs>
                <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="name" stroke="#888888" fontSize={9} tickLine={false} axisLine={false} />
              <YAxis stroke="#888888" fontSize={9} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${v}M`} />
              <Tooltip formatter={(value) => [`₹${value}M`, "Cumulative Revenue"]} />
              <Area type="monotone" dataKey="income" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorIncome)" />
            </AreaChart>
          </ResponsiveContainer>

          {/* Orlando style Red Pin Marker for exact target value */}
          <div className="absolute top-20 left-[55%] -translate-x-1/2 flex flex-col items-center">
            <span className="bg-[#ef4444] text-[8px] font-bold text-white px-1.5 py-0.5 rounded-md shadow-xs block">
              ₹3,400,849
            </span>
            <span className="h-8 w-[1px] border-l border-dashed border-[#ef4444] block" />
            <span className="h-1.5 w-1.5 bg-[#ef4444] rounded-full ring-2 ring-white dark:ring-card block -mt-1" />
          </div>
        </div>

        <div className="flex justify-between items-center text-[10px] border-t border-border pt-3">
          <span className="text-muted-foreground font-semibold">Forecast Horizon</span>
          <span className="text-primary font-bold">10 Nov Target Met</span>
        </div>
      </div>
    </div>
  );
}
export default DashboardCharts;
