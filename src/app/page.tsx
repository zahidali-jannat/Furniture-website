import SmoothScroll from "@/components/SmoothScroll";
import Grain from "@/components/Grain";
import Preloader from "@/components/Preloader";
import Cursor from "@/components/Cursor";
import Nav from "@/components/Nav";
import Hero from "@/components/sections/Hero";
import Statement from "@/components/sections/Statement";
import CollectionsTeaser from "@/components/sections/CollectionsTeaser";
import Signature from "@/components/sections/Signature";
import Seating from "@/components/sections/Seating";
import Transition from "@/components/sections/Transition";
import Lighting from "@/components/sections/Lighting";
import Materials from "@/components/sections/Materials";
import Workspace from "@/components/sections/Workspace";
import Homes from "@/components/sections/Homes";
import Bedroom from "@/components/sections/Bedroom";
import Closing from "@/components/sections/Closing";
import Footer from "@/components/sections/Footer";

export default function Home() {
  return (
    <SmoothScroll>
      <Preloader />
      <Grain />
      <Cursor />
      <Nav />
      <main>
        <Hero />
        <Statement />
        <CollectionsTeaser />
        <Signature />
        <Seating />
        <Transition />
        <Lighting />
        <Materials />
        <Workspace />
        <Homes />
        <Bedroom />
        <Closing />
      </main>
      <Footer />
    </SmoothScroll>
  );
}
