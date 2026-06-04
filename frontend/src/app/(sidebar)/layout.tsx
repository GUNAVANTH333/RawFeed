import Sidebar from "@/components/Sidebar";

export default function SidebarLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-screen overflow-hidden flex justify-center" style={{ background: "var(--background)" }}>
      {/* Sidebar + content centered as one framed group (X-style), with the
          page breathing on both sides on wide screens. */}
      <div
        className="flex w-full max-w-[940px] h-full"
        style={{ borderLeft: "1px solid var(--border)", borderRight: "1px solid var(--border)" }}
      >
        <Sidebar />
        {/* pb-20 on mobile gives space for the fixed bottom nav bar; removed on md+ */}
        <div className="flex-1 min-w-0 flex flex-col overflow-hidden pb-20 md:pb-0">
          {children}
        </div>
      </div>
    </div>
  );
}
