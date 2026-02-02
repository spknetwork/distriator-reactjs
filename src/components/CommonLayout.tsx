import type { FC, ReactNode } from "react";
import NavBar from "./NavBar";
import Sidebar from "./SidebarDrawer";
interface CommonLayoutProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
}

const CommonLayout: FC<CommonLayoutProps> = ({ children, title, subtitle }) => {
  return (
    <div className="flex flex-col min-h-screen">
      {/* pass title down to NavBar */}
      <NavBar title={title} subtitle={subtitle} />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 bg-background text-foreground p-4 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
};

export default CommonLayout;
