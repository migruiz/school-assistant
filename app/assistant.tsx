"use client";
import Image from "next/image";
import { AssistantRuntimeProvider } from "@assistant-ui/react";
import { useChatRuntime } from "@assistant-ui/react-ai-sdk";
import { Thread } from "@/components/assistant-ui/thread";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { AssistantChatTransport } from "@assistant-ui/react-ai-sdk";

import { useEffect, useRef } from "react";
export const Assistant = () => {
const runtime = useChatRuntime({
  
  transport: new AssistantChatTransport({
   headers:{"TEST": "value" },
   body:{
    bodytst:"BODYTEST"
   }
  }),
});
  const bottomRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom
  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    // Scroll on initial render
    scrollToBottom();

    // Scroll when window resizes (keyboard opens/closes on Android)
    const handleResize = () => {
      scrollToBottom();
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);


  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <SidebarProvider>
        <div className="flex h-dvh w-full pr-0.5">
          <AppSidebar />
          <SidebarInset>
            <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
              <SidebarTrigger />
              <Separator orientation="vertical" className="mr-2 h-4" />
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                                <Image
                                  src="/retns_logo.avif"   // Place your image in the /public folder
                                  alt="User Avatar"
                                  width={48}
                                  height={48}
                                />
                  </BreadcrumbItem>
                  <BreadcrumbItem>
                    <BreadcrumbPage>Rathcoole Educate Together AI Assistant</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </header>
            <div className="flex-1 overflow-hidden">
              <Thread />
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
      <div ref={bottomRef} />
    </AssistantRuntimeProvider>
  );
};
