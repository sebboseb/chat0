import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarFooter,
  SidebarTrigger,
} from "@/frontend/components/ui/sidebar";
import { Button, buttonVariants } from "./ui/button";
import {
  deleteThread,
  getThreads,
  togglePinThread,
} from "@/frontend/dexie/queries";
import { useLiveQuery } from "dexie-react-hooks";
import { Link, useNavigate, useParams } from "react-router";
import { X, Pin, PinOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { memo } from "react";

export default function ChatSidebar() {
  const { id } = useParams();
  const navigate = useNavigate();
  const threads = useLiveQuery(() => getThreads(), []);

  return (
    <Sidebar className="p-4">
      <div className="flex flex-col h-full p-2 bg-sky-200 dark:bg-sky-900 rounded-lg">
        <Header />
        <SidebarContent className="no-scrollbar">
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {threads?.map((thread) => {
                  return (
                    <SidebarMenuItem key={thread.id}>
                      <div
                        className={cn(
                          "cursor-pointer group/thread h-9 flex items-center px-2 py-1 rounded-[8px] overflow-hidden w-full hover:bg-secondary transition-colors",
                          id === thread.id && "bg-secondary",
                          thread.pinned &&
                            "dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800"
                        )}
                        onClick={() => {
                          if (id === thread.id) {
                            return;
                          }
                          navigate(`/chat/${thread.id}`);
                        }}
                      >
                        <span className="truncate block flex-1 flex items-center gap-2">
                          {thread.pinned && (
                            <Pin
                              size={12}
                              className="text-amber-600 dark:text-amber-400 flex-shrink-0"
                            />
                          )}
                          {thread.title}
                        </span>
                        <div className="flex items-center gap-1 opacity-0 group-hover/thread:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={async (event) => {
                              event.preventDefault();
                              event.stopPropagation();
                              await togglePinThread(thread.id);
                            }}
                          >
                            {thread.pinned ? (
                              <Pin size={14} className="fill-current" />
                            ) : (
                              <PinOff size={14} />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={async (event) => {
                              event.preventDefault();
                              event.stopPropagation();
                              await deleteThread(thread.id);
                              navigate(`/chat`);
                            }}
                          >
                            <X size={16} />
                          </Button>
                        </div>
                      </div>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <Footer />
      </div>
    </Sidebar>
  );
}

function PureHeader() {
  return (
    <SidebarHeader className="flex justify-between items-center gap-4 relative">
      <SidebarTrigger className="absolute right-1 top-2.5" />
      <h1 className="text-xl font-bold">
        Bärta<span className=""> HR-Assistent</span>
      </h1>
      <Link
        to="/chat"
        className={buttonVariants({
          variant: "default",
          className: "w-full",
        })}
      >
        Ny chatt
      </Link>
    </SidebarHeader>
  );
}

const Header = memo(PureHeader);

const PureFooter = () => {
  const { id: chatId } = useParams();

  return (
    <SidebarFooter>
      <Link
        to={{
          pathname: "/settings",
          search: chatId ? `?from=${encodeURIComponent(chatId)}` : "",
        }}
        className={buttonVariants({ variant: "outline" })}
      >
        Inställningar
      </Link>
    </SidebarFooter>
  );
};

const Footer = memo(PureFooter);
