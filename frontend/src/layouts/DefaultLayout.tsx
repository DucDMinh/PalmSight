import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";

interface DefaultLayoutProps {
  children: React.ReactNode;
}

const DefaultLayout = (props: DefaultLayoutProps) => {
  return (
    <div className="component:DefaultLayout flex min-h-[100vh] flex-col">
      <div className="layout-wrapper flex flex-1 flex-col w-full p-3 max-w-5xl mx-auto">
        <Navbar />
        <main className="flex flex-1 w-full">{props.children}</main>
        <Footer />
      </div>
    </div>
  );
};

export default DefaultLayout;
