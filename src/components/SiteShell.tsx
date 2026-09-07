import SmoothScroll from "@/components/SmoothScroll";
import Grain from "@/components/Grain";
import Cursor from "@/components/Cursor";
import Nav from "@/components/Nav";
import Footer from "@/components/sections/Footer";

/** Chrome shared by every page. The preloader is deliberately homepage-only. */
export default function SiteShell({ children }: { children: React.ReactNode }) {
  return (
    <SmoothScroll>
      <Grain />
      <Cursor />
      <Nav />
      <main>{children}</main>
      <Footer />
    </SmoothScroll>
  );
}
