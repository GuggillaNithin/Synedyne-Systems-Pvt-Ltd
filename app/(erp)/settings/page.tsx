import * as React from "react";
import { Settings, User, Building2, Bell, Shield, Database, Palette, Save } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Configure system preferences and application settings
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column — Settings Nav */}
        <div className="bg-card border border-border rounded-xl p-4 h-fit">
          <p className="text-xs font-semibold text-muted-foreground uppercase px-2 mb-2">Configuration</p>
          <nav className="space-y-1">
            {[
              { icon: User, label: "Profile", active: true },
              { icon: Building2, label: "Organization" },
              { icon: Bell, label: "Notifications" },
              { icon: Shield, label: "Security & Roles" },
              { icon: Database, label: "Database" },
              { icon: Palette, label: "Appearance" },
            ].map(({ icon: Icon, label, active }) => (
              <button
                key={label}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground hover:bg-muted/50"
                }`}
              >
                <Icon size={16} />
                {label}
              </button>
            ))}
          </nav>
        </div>

        {/* Right Column — Settings Panels */}
        <div className="lg:col-span-2 space-y-6">
          {/* Profile Settings */}
          <div className="bg-card border border-border rounded-xl p-6">
            <h2 className="text-sm font-semibold mb-4 flex items-center gap-2">
              <User size={16} className="text-primary" />
              Profile Settings
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1.5">Full Name</label>
                <input
                  type="text"
                  defaultValue="Synedyne Admin"
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1.5">Email Address</label>
                <input
                  type="email"
                  defaultValue="admin@synedyne.in"
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1.5">Department</label>
                <select className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary">
                  <option>Management</option>
                  <option>Operations</option>
                  <option>Finance</option>
                  <option>Engineering</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1.5">Role</label>
                <select className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary">
                  <option>ADMIN</option>
                  <option>MANAGER</option>
                  <option>OPERATOR</option>
                  <option>VIEWER</option>
                </select>
              </div>
            </div>
          </div>

          {/* Organization Settings */}
          <div className="bg-card border border-border rounded-xl p-6">
            <h2 className="text-sm font-semibold mb-4 flex items-center gap-2">
              <Building2 size={16} className="text-primary" />
              Organization
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1.5">Company Name</label>
                <input
                  type="text"
                  defaultValue="Synedyne Technologies Pvt Ltd"
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1.5">GSTIN</label>
                <input
                  type="text"
                  defaultValue="27AXXXX1234X1ZX"
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs font-medium text-muted-foreground block mb-1.5">Registered Address</label>
                <textarea
                  defaultValue="Plot No. 42, MIDC Industrial Area, Pune, Maharashtra, India - 411019"
                  rows={2}
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1.5">Currency</label>
                <select className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary">
                  <option>INR — Indian Rupee</option>
                  <option>USD — US Dollar</option>
                  <option>EUR — Euro</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1.5">Fiscal Year Start</label>
                <select className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary">
                  <option>April (Indian FY)</option>
                  <option>January (Calendar Year)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Notification Settings */}
          <div className="bg-card border border-border rounded-xl p-6">
            <h2 className="text-sm font-semibold mb-4 flex items-center gap-2">
              <Bell size={16} className="text-primary" />
              Notification Preferences
            </h2>
            <div className="space-y-3">
              {[
                { label: "Low Stock Alerts", desc: "Get notified when components fall below reorder point", enabled: true },
                { label: "New Order Created", desc: "Notifications when a new sales order is placed", enabled: true },
                { label: "Production Updates", desc: "Status changes on production orders", enabled: true },
                { label: "Dispatch Completed", desc: "When customer orders are dispatched", enabled: false },
                { label: "Invoice Generated", desc: "When invoices are auto-created", enabled: false },
                { label: "Payment Received", desc: "Revenue payment confirmations", enabled: true },
              ].map(({ label, desc, enabled }) => (
                <div key={label} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div>
                    <p className="text-sm font-medium">{label}</p>
                    <p className="text-xs text-muted-foreground">{desc}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" defaultChecked={enabled} className="sr-only peer" />
                    <div className="w-9 h-5 bg-muted rounded-full peer peer-checked:bg-primary peer-focus:ring-2 peer-focus:ring-primary/30 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-4"></div>
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* System Info */}
          <div className="bg-card border border-border rounded-xl p-6">
            <h2 className="text-sm font-semibold mb-4 flex items-center gap-2">
              <Database size={16} className="text-primary" />
              System Information
            </h2>
            <div className="grid grid-cols-2 gap-3 text-xs">
              {[
                { label: "ERP Version", value: "v1.0.0-prototype" },
                { label: "Database", value: "PostgreSQL (Neon)" },
                { label: "ORM", value: "Prisma v7" },
                { label: "Framework", value: "Next.js 16" },
                { label: "Auth Provider", value: "Clerk" },
                { label: "Instance", value: "Standard" },
              ].map(({ label, value }) => (
                <div key={label} className="flex flex-col gap-0.5">
                  <span className="text-muted-foreground">{label}</span>
                  <span className="font-semibold font-mono">{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground text-sm font-semibold rounded-lg hover:bg-primary/90 transition-colors shadow-xs">
              <Save size={14} />
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
