import { Outlet } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

interface DefaultLayoutProps {
  children?: React.ReactNode;
}

const DefaultLayout = ({ children }: DefaultLayoutProps) => {
  return (
    <div className="component:DefaultLayout min-h-screen bg-canvas text-ink font-mono flex flex-col selection:bg-surface-card">
      <Navbar />
      <main className="flex-1 w-full flex flex-col">
        {children ?? <Outlet />}
      </main>
      <Footer />
    </div>
  );
};

export default DefaultLayout;
