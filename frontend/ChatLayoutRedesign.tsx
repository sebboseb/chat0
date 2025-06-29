import { SidebarProvider } from "@/frontend/components/ui/sidebar";
import ChatSidebar from "@/frontend/components/ChatSidebar";
import { Outlet } from "react-router";

export default function ChatLayoutRedesign() {
  return (
    <div className="bg-gradient-to-r from-[#0098D7] to-[#95C11F] dark:bg-gradient-to-r dark:from-[#006B9A] dark:to-[#6B8F16]">
      <SidebarProvider>
        {/* <div className="p-4 "> */}
        <ChatSidebar />
        {/* </div> */}
        <div className="flex-1 relative p-4">
          <div className="bg-sky-200 min-h-full rounded-lg dark:bg-sky-900">
            <Outlet />
          </div>
        </div>
      </SidebarProvider>
    </div>
  );
}
