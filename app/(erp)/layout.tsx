import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/shared/layout/sidebar";
import { Header } from "@/components/shared/layout/header";
import { CommandMenu } from "@/components/shared/layout/command-menu";

export default async function ERPLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await currentUser();
  if (!user) {
    redirect("/sign-in");
  }

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Collapsible Sidebar */}
      <Sidebar />

      {/* Main Body */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Sticky Header */}
        <Header />

        {/* Content area */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto bg-muted/20">
          <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-200">
            {children}
          </div>
        </main>
      </div>

      {/* Ctrl+K Search Dialog */}
      <CommandMenu />
    </div>
  );
}
