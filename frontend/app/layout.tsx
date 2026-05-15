import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} bg-background text-foreground antialiased min-h-screen flex flex-col`} suppressHydrationWarning>
        <div className="flex h-screen overflow-hidden">
          {/* Sidebar */}
          <aside className="w-64 bg-card border-r border-border hidden md:flex flex-col">
            <div className="p-6">
              <h1 className="text-xl font-bold tracking-tighter text-primary">AI Finance Agent</h1>
            </div>
            <nav className="flex-1 px-4 space-y-2">
              <a href="/dashboard" className="block px-4 py-2 rounded-md hover:bg-accent hover:text-accent-foreground text-sm font-medium">Dashboard</a>
              <a href="/invoices" className="block px-4 py-2 rounded-md hover:bg-accent hover:text-accent-foreground text-sm font-medium">Invoices</a>
              <a href="/escalations" className="block px-4 py-2 rounded-md hover:bg-accent hover:text-accent-foreground text-sm font-medium">Escalations</a>
              <a href="/analytics" className="block px-4 py-2 rounded-md hover:bg-accent hover:text-accent-foreground text-sm font-medium">Analytics</a>
            </nav>
            <div className="p-4 border-t border-border">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">A</div>
                <div className="flex flex-col text-sm">
                  <span className="font-medium">Admin User</span>
                  <span className="text-xs text-muted-foreground">admin@finance.app</span>
                </div>
              </div>
            </div>
          </aside>
          
          {/* Main content */}
          <main className="flex-1 overflow-y-auto bg-muted/20">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
