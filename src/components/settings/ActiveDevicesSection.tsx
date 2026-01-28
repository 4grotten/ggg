import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Smartphone, 
  Monitor, 
  Tablet, 
  Loader2, 
  MapPin, 
  Clock, 
  Trash2, 
  LogOut,
  ChevronRight,
  X,
  Globe,
  Laptop
} from "lucide-react";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { toast } from "sonner";
import { getActiveDevices, deleteDevice, type ActiveDevice } from "@/services/api/devicesApi";
import { logout as apiLogout } from "@/services/api/authApi";
import { useAuth } from "@/contexts/AuthContext";

interface ActiveDevicesSectionProps {
  className?: string;
}

const getDeviceIcon = (device: ActiveDevice) => {
  const os = device.operating_system?.toLowerCase() || '';
  const deviceName = device.device?.toLowerCase() || '';
  const userAgent = device.user_agent?.toLowerCase() || '';
  
  if (os === 'ios' || deviceName.includes('iphone')) {
    return Smartphone;
  }
  if (os === 'android' || deviceName.includes('android')) {
    return Smartphone;
  }
  if (deviceName.includes('ipad') || os.includes('tablet')) {
    return Tablet;
  }
  if (os === 'web' || userAgent.includes('chrome') || userAgent.includes('firefox') || userAgent.includes('safari')) {
    if (deviceName.includes('mac') || deviceName.includes('windows') || deviceName.includes('linux')) {
      return Laptop;
    }
    return Globe;
  }
  if (deviceName.includes('windows') || deviceName.includes('mac') || deviceName.includes('linux')) {
    return Monitor;
  }
  
  return Smartphone;
};

const formatLastActive = (dateString: string | null, t: (key: string, options?: Record<string, unknown>) => string) => {
  if (!dateString) return t("settings.devices.unknown");
  
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) return t("settings.devices.justNow");
  if (diffMins < 60) return t("settings.devices.minutesAgo", { count: diffMins });
  if (diffHours < 24) return t("settings.devices.hoursAgo", { count: diffHours });
  if (diffDays < 7) return t("settings.devices.daysAgo", { count: diffDays });
  
  return date.toLocaleDateString();
};

const isCurrentDevice = (device: ActiveDevice): boolean => {
  const currentToken = localStorage.getItem('auth_token');
  return device.key === currentToken;
};

export const ActiveDevicesSection = ({ className }: ActiveDevicesSectionProps) => {
  const { t } = useTranslation();
  const { logout } = useAuth();
  const [devices, setDevices] = useState<ActiveDevice[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<ActiveDevice | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLoggingOutAll, setIsLoggingOutAll] = useState(false);

  const fetchDevices = async () => {
    setIsLoading(true);
    try {
      const response = await getActiveDevices();
      if (response.data) {
        setDevices(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch devices:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isDrawerOpen) {
      fetchDevices();
    }
  }, [isDrawerOpen]);

  const handleDeviceClick = (device: ActiveDevice) => {
    setSelectedDevice(device);
  };

  const handleDeleteDevice = async () => {
    if (!selectedDevice) return;
    
    setIsDeleting(true);
    try {
      const response = await deleteDevice(selectedDevice.id);
      if (!response.error) {
        toast.success(t("settings.devices.deviceRemoved"));
        setDevices(prev => prev.filter(d => d.id !== selectedDevice.id));
        setSelectedDevice(null);
        
        // If deleted current device, logout
        if (isCurrentDevice(selectedDevice)) {
          await logout();
        }
      } else {
        toast.error(t("settings.devices.removeError"));
      }
    } catch (error) {
      toast.error(t("settings.devices.removeError"));
    } finally {
      setIsDeleting(false);
    }
  };

  const handleLogoutAll = async () => {
    setIsLoggingOutAll(true);
    try {
      // Delete all devices except current one first
      const otherDevices = devices.filter(d => !isCurrentDevice(d));
      for (const device of otherDevices) {
        await deleteDevice(device.id);
      }
      
      toast.success(t("settings.devices.loggedOutAll"));
      await logout();
    } catch (error) {
      toast.error(t("settings.devices.logoutAllError"));
    } finally {
      setIsLoggingOutAll(false);
    }
  };

  const activeDevicesCount = devices.filter(d => d.is_active).length;

  return (
    <>
      <div className={className}>
        <button
          onClick={() => setIsDrawerOpen(true)}
          className="w-full flex items-center justify-between py-4 px-4 hover:bg-muted/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <span className="text-foreground">
              <Smartphone className="w-5 h-5" />
            </span>
            <span className="text-foreground font-medium">
              {t("settings.devices.title")}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            ) : (
              <span className="text-muted-foreground text-sm">
                {activeDevicesCount > 0 ? activeDevicesCount : ""}
              </span>
            )}
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </div>
        </button>
      </div>

      {/* Devices Drawer */}
      <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen} shouldScaleBackground={false}>
        <DrawerContent className="bg-background/95 backdrop-blur-xl max-h-[85vh]">
          <DrawerHeader className="relative flex items-center justify-center py-4">
            <DrawerTitle className="text-center text-base font-semibold">
              {t("settings.devices.title")}
            </DrawerTitle>
            <button 
              onClick={() => setIsDrawerOpen(false)}
              className="absolute right-8 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors"
            >
              <X className="w-3.5 h-3.5 text-primary" />
            </button>
          </DrawerHeader>
          
          <div className="px-4 pb-6 space-y-4 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : devices.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                {t("settings.devices.noDevices")}
              </div>
            ) : (
              <>
                {/* Devices List */}
                <div className="bg-muted/50 rounded-xl overflow-hidden">
                  {devices.map((device, index) => {
                    const DeviceIcon = getDeviceIcon(device);
                    const isCurrent = isCurrentDevice(device);
                    
                    return (
                      <motion.button
                        key={device.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        onClick={() => handleDeviceClick(device)}
                        className={`w-full flex items-center gap-3 px-4 py-4 hover:bg-muted/80 transition-colors text-left ${
                          index < devices.length - 1 ? 'border-b border-border/50' : ''
                        } ${isCurrent ? 'bg-primary/5' : ''}`}
                      >
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          isCurrent ? 'bg-primary/20' : 'bg-muted'
                        }`}>
                          <DeviceIcon className={`w-5 h-5 ${isCurrent ? 'text-primary' : 'text-foreground'}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-foreground truncate">
                              {device.device || t("settings.devices.unknownDevice")}
                            </p>
                            {isCurrent && (
                              <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                                {t("settings.devices.thisDevice")}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            {device.location && (
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {device.location}
                              </span>
                            )}
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatLastActive(device.last_active, t)}
                            </span>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      </motion.button>
                    );
                  })}
                </div>

                {/* Logout All Button */}
                {devices.length > 1 && (
                  <button
                    onClick={handleLogoutAll}
                    disabled={isLoggingOutAll}
                    className="w-full flex items-center justify-center gap-3 py-4 px-4 bg-red-500/10 hover:bg-red-500/20 dark:bg-red-500/20 dark:hover:bg-red-500/30 rounded-xl transition-colors disabled:opacity-50"
                  >
                    {isLoggingOutAll ? (
                      <Loader2 className="w-5 h-5 text-red-500 animate-spin" />
                    ) : (
                      <LogOut className="w-5 h-5 text-red-500" />
                    )}
                    <span className="text-red-500 font-medium">
                      {t("settings.devices.logoutAll")}
                    </span>
                  </button>
                )}
              </>
            )}
          </div>
        </DrawerContent>
      </Drawer>

      {/* Device Detail Drawer */}
      <Drawer 
        open={!!selectedDevice} 
        onOpenChange={(open) => !open && setSelectedDevice(null)} 
        shouldScaleBackground={false}
      >
        <DrawerContent className="bg-background/95 backdrop-blur-xl">
          <DrawerHeader className="relative flex items-center justify-center py-4">
            <DrawerTitle className="text-center text-base font-semibold">
              {t("settings.devices.deviceDetails")}
            </DrawerTitle>
            <button 
              onClick={() => setSelectedDevice(null)}
              className="absolute right-8 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors"
            >
              <X className="w-3.5 h-3.5 text-primary" />
            </button>
          </DrawerHeader>
          
          {selectedDevice && (
            <div className="px-4 pb-6 space-y-4">
              {/* Device Info */}
              <div className="bg-muted/50 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-3">
                  {(() => {
                    const DeviceIcon = getDeviceIcon(selectedDevice);
                    return (
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <DeviceIcon className="w-6 h-6 text-primary" />
                      </div>
                    );
                  })()}
                  <div>
                    <p className="font-medium text-foreground">
                      {selectedDevice.device || t("settings.devices.unknownDevice")}
                    </p>
                    {isCurrentDevice(selectedDevice) && (
                      <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                        {t("settings.devices.thisDevice")}
                      </span>
                    )}
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-border/50">
                  {selectedDevice.location && (
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">{t("settings.devices.location")}:</span>
                      <span className="text-foreground">{selectedDevice.location}</span>
                    </div>
                  )}
                  {selectedDevice.ip && (
                    <div className="flex items-center gap-2 text-sm">
                      <Globe className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">IP:</span>
                      <span className="text-foreground">{selectedDevice.ip}</span>
                    </div>
                  )}
                  {selectedDevice.last_active && (
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">{t("settings.devices.lastActive")}:</span>
                      <span className="text-foreground">
                        {formatLastActive(selectedDevice.last_active, t)}
                      </span>
                    </div>
                  )}
                  {selectedDevice.version_app && (
                    <div className="flex items-start gap-2 text-sm">
                      <Monitor className="w-4 h-4 text-muted-foreground mt-0.5" />
                      <span className="text-muted-foreground">{t("settings.devices.app")}:</span>
                      <span className="text-foreground text-xs">{selectedDevice.version_app}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Remove Device Button */}
              <button
                onClick={handleDeleteDevice}
                disabled={isDeleting}
                className="w-full flex items-center justify-center gap-3 py-4 px-4 bg-red-500/10 hover:bg-red-500/20 dark:bg-red-500/20 dark:hover:bg-red-500/30 rounded-xl transition-colors disabled:opacity-50"
              >
                {isDeleting ? (
                  <Loader2 className="w-5 h-5 text-red-500 animate-spin" />
                ) : (
                  <Trash2 className="w-5 h-5 text-red-500" />
                )}
                <span className="text-red-500 font-medium">
                  {isCurrentDevice(selectedDevice) 
                    ? t("settings.devices.logoutThisDevice")
                    : t("settings.devices.removeDevice")
                  }
                </span>
              </button>
            </div>
          )}
        </DrawerContent>
      </Drawer>
    </>
  );
};
