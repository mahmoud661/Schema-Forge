import { Navigation } from "@/components/navigation";
import { BrowseUI } from "./ui";
import { BackgroundParticles } from "@/components/ui/background-particles";
import { MobileWarning } from "@/components/mobile-warning";

export default function Browse() {
  return (
    <>
     <BackgroundParticles 
        particleColor="#3576df" 
        particleCount={30}
      />
      <Navigation />
      {/* Positioned below navigation but above content */}
      <MobileWarning />
      <BrowseUI />
     
    </>
  );
}