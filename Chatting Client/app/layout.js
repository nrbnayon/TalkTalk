import "./globals.css";
import { Geist, Geist_Mono } from "next/font/google";
import { ReduxProvider } from "@/redux/provider";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "@/components/AuthProvider/AuthProvider";
import { ClientDndProvider } from "@/components/DndProvider/DndProvider";
import { SocketProvider } from "@/context/SocketContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({ children }) {
  return (
    <html lang='en'>
      <body
        className={`${geistSans.variable} ${geistMono.variable} fallback-font antialiased`}
      >
        <ReduxProvider>
          <AuthProvider>
            <SocketProvider>
              <ClientDndProvider>{children}</ClientDndProvider>
            </SocketProvider>
          </AuthProvider>
        </ReduxProvider>
        <Toaster position='top-center' />
      </body>
    </html>
  );
}
