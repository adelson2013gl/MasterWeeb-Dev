
import { motion } from "framer-motion";
import { LoginSection } from "./LoginSection";
import { MobileOptimizedLogin } from "./MobileOptimizedLogin";
import { useIsMobile } from "@/hooks/use-mobile";

export function FullScreenLayout() {
  const isMobile = useIsMobile();
  
  // Use mobile-optimized version on mobile devices
  if (isMobile) {
    return <MobileOptimizedLogin />;
  }
  
  // Desktop version with modern design
  return <LoginSection />;
}
