import Sidebar from "@/components/Sidebar";

export default function SidebarLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      {/* pb-20 on mobile gives space for the fixed bottom nav bar; removed on md+ */}
      <div className="flex-1 flex flex-col overflow-hidden pb-20 md:pb-0">
        {children}
      </div>
    </div>
  );
}
