import Sidebar from "@/components/Sidebar";

export default function SidebarLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      {children}
    </div>
  );
}
