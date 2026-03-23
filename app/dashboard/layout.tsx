export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen px-6 py-8 lg:px-10">
      <div className="mx-auto max-w-7xl">{children}</div>
    </main>
  );
}
