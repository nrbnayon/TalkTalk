// app\[user]\layout.js
import AppSidebar from "@/components/Sidebar/AppSidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { SocketProvider } from "@/context/SocketContext";

export default function Layout({ children }) {
  return (
    <SocketProvider>
      <SidebarProvider>
        <AppSidebar />
        <main className='flex h-screen overflow-hidden w-full'>
          <SidebarTrigger />
          {children}
        </main>
      </SidebarProvider>
    </SocketProvider>
  );
}
