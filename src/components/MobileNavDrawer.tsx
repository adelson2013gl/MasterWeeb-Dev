
import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { 
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Menu, Calendar, CalendarCheck, LayoutDashboard } from "lucide-react";

interface MobileNavDrawerProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function MobileNavDrawer({ activeTab, onTabChange }: MobileNavDrawerProps) {
  const [open, setOpen] = useState(false);

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "agendar", label: "Agendar", icon: Calendar },
    { id: "meus-agendamentos", label: "Meus Agendamentos", icon: CalendarCheck }
  ];

  const handleTabChange = (tabId: string) => {
    onTabChange(tabId);
    setOpen(false);
  };

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="touch-target glass-card hover:glass-card-hover md:hidden"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </DrawerTrigger>
      <DrawerContent className="glass-card border-glass">
        <DrawerHeader>
          <DrawerTitle>Navegação</DrawerTitle>
        </DrawerHeader>
        <div className="px-4 pb-6">
          <div className="space-y-2">
            {navItems.map((item) => (
              <motion.div
                key={item.id}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.1 }}
              >
                <Button
                  variant={activeTab === item.id ? "default" : "ghost"}
                  onClick={() => handleTabChange(item.id)}
                  className={`w-full justify-start text-left touch-target ${
                    activeTab === item.id 
                      ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white' 
                      : 'hover:glass-card-hover'
                  }`}
                >
                  <item.icon className="h-5 w-5 mr-3" />
                  {item.label}
                </Button>
              </motion.div>
            ))}
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
