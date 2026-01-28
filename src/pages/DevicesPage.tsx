import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { 
  Smartphone, 
  Monitor, 
  Tablet, 
  Loader2, 
  MapPin, 
  Clock, 
  Trash2, 
  LogOut,
  Globe,
  Laptop,
  Check,
  AlertTriangle,
  History
} from "lucide-react";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { LanguageSwitcher } from "@/components/dashboard/LanguageSwitcher";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { toast } from "sonner";
import { getActiveDevices, getAuthorizationHistory, deleteDevice, type ActiveDevice } from "@/services/api/devicesApi";
import { useAuth } from "@/contexts/AuthContext";

type TabType = 'active' | 'history';

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

const formatLoginDate = (dateString: string | null) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const isCurrentDevice = (device: ActiveDevice): boolean => {
  const currentToken = localStorage.getItem('auth_token');
  return device.key === currentToken;
};

const DevicesPage = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { logout } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('active');
  const [devices, setDevices] = useState<ActiveDevice[]>([]);
  const [history, setHistory] = useState<ActiveDevice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<ActiveDevice | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLoggingOutAll, setIsLoggingOutAll] = useState(false);
  const [showConfirmLogoutAll, setShowConfirmLogoutAll] = useState(false);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyTotalPages, setHistoryTotalPages] = useState(1);

  const fetchDevices = async () => {
    setIsLoading(true);
    try {
      const response = await getActiveDevices();
      if (response.data) {
        setDevices(response.data.list);
      }
    } catch (error) {
      console.error('Failed to fetch devices:', error);
      toast.error(t("settings.devices.loadError") || "Failed to load devices");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchHistory = async (page = 1) => {
    setIsLoadingHistory(true);
    try {
      const response = await getAuthorizationHistory(page, 20);
      if (response.data) {
        if (page === 1) {
          setHistory(response.data.list);
        } else {
          setHistory(prev => [...prev, ...response.data!.list]);
        }
        setHistoryTotalPages(response.data.total_pages);
        setHistoryPage(page);
      }
    } catch (error) {
      console.error('Failed to fetch history:', error);
      toast.error(t("settings.devices.loadError") || "Failed to load history");
    } finally {
      setIsLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchDevices();
  }, []);

  useEffect(() => {
    if (activeTab === 'history' && history.length === 0) {
      fetchHistory(1);
    }
  }, [activeTab]);

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
      const otherDevices = devices.filter(d => !isCurrentDevice(d));
      for (const device of otherDevices) {
        await deleteDevice(device.id);
      }
      
      toast.success(t("settings.devices.loggedOutAll"));
      setShowConfirmLogoutAll(false);
      await logout();
    } catch (error) {
      toast.error(t("settings.devices.logoutAllError"));
    } finally {
      setIsLoggingOutAll(false);
    }
  };

  const loadMoreHistory = () => {
    if (historyPage < historyTotalPages && !isLoadingHistory) {
      fetchHistory(historyPage + 1);
    }
  };

  const activeDevicesCount = devices.filter(d => d.is_active).length;
  const currentDevice = devices.find(d => isCurrentDevice(d));
  const otherDevices = devices.filter(d => !isCurrentDevice(d));

  return (
    <MobileLayout
      showBackButton
      onBack={() => navigate(-1)}
      title={t("settings.devices.title")}
      rightAction={<LanguageSwitcher />}
    >
      <div className="px-4 pb-28 space-y-4">
        {/* Tabs */}
        <div className="flex gap-2 p-1 bg-muted/70 dark:bg-card/70 rounded-xl">
          <button
            onClick={() => setActiveTab('active')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-medium text-sm transition-all ${
              activeTab === 'active'
                ? 'bg-background shadow-sm text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            {t("settings.devices.activeTab") || "Active"}
            {activeDevicesCount > 0 && (
              <span className="text-xs bg-primary/20 text-primary px-1.5 py-0.5 rounded-full">
                {activeDevicesCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-medium text-sm transition-all ${
              activeTab === 'history'
                ? 'bg-background shadow-sm text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <History className="w-4 h-4" />
            {t("settings.devices.historyTab") || "History"}
          </button>
        </div>

        {/* Active Devices Tab */}
        {activeTab === 'active' && (
          <>
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : devices.length === 0 ? (
              <div className="text-center py-20 text-muted-foreground">
                {t("settings.devices.noDevices")}
              </div>
            ) : (
              <>
                {currentDevice && (
                  <div className="space-y-2">
                    <h2 className="text-sm font-medium text-muted-foreground px-1">
                      {t("settings.devices.currentDevice")}
                    </h2>
                    <div className="bg-primary/5 border border-primary/20 rounded-2xl overflow-hidden">
                      <DeviceCard 
                        device={currentDevice} 
                        onClick={() => handleDeviceClick(currentDevice)}
                        isCurrent
                        t={t}
                      />
                    </div>
                  </div>
                )}

                {otherDevices.length > 0 && (
                  <div className="space-y-2">
                    <h2 className="text-sm font-medium text-muted-foreground px-1">
                      {t("settings.devices.otherDevices")} ({otherDevices.length})
                    </h2>
                    <div className="bg-muted/70 dark:bg-card/70 backdrop-blur-xl rounded-2xl overflow-hidden border border-border/50">
                      {otherDevices.map((device, index) => (
                        <DeviceCard 
                          key={device.id}
                          device={device} 
                          onClick={() => handleDeviceClick(device)}
                          showDivider={index < otherDevices.length - 1}
                          t={t}
                        />
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-center gap-2 py-2">
                  <span className="text-sm text-muted-foreground">
                    {t("settings.devices.activeCount", { count: activeDevicesCount })}
                  </span>
                </div>

                {devices.length > 1 && (
                  <button
                    onClick={() => setShowConfirmLogoutAll(true)}
                    disabled={isLoggingOutAll}
                    className="w-full flex items-center justify-center gap-3 py-4 px-4 bg-red-500/10 hover:bg-red-500/20 dark:bg-red-500/20 dark:hover:bg-red-500/30 rounded-2xl transition-colors disabled:opacity-50"
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
          </>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <>
            {isLoadingHistory && history.length === 0 ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : history.length === 0 ? (
              <div className="text-center py-20 text-muted-foreground">
                {t("settings.devices.noHistory") || "No authorization history"}
              </div>
            ) : (
              <div className="space-y-2">
                <div className="bg-muted/70 dark:bg-card/70 backdrop-blur-xl rounded-2xl overflow-hidden border border-border/50">
                  {history.map((entry, index) => (
                    <HistoryCard 
                      key={entry.id}
                      entry={entry}
                      onClick={() => handleDeviceClick(entry)}
                      showDivider={index < history.length - 1}
                      t={t}
                    />
                  ))}
                </div>

                {historyPage < historyTotalPages && (
                  <button
                    onClick={loadMoreHistory}
                    disabled={isLoadingHistory}
                    className="w-full flex items-center justify-center gap-2 py-3 text-primary font-medium"
                  >
                    {isLoadingHistory ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        {t("settings.devices.loadMore") || "Load more"}
                      </>
                    )}
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </div>

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
          </DrawerHeader>
          
          {selectedDevice && (
            <div className="px-4 pb-6 space-y-4">
              <div className="bg-muted/50 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-3">
                  {(() => {
                    const DeviceIcon = getDeviceIcon(selectedDevice);
                    const isCurrent = isCurrentDevice(selectedDevice);
                    return (
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        isCurrent ? 'bg-primary/20' : selectedDevice.is_active ? 'bg-green-500/20' : 'bg-muted'
                      }`}>
                        <DeviceIcon className={`w-6 h-6 ${isCurrent ? 'text-primary' : selectedDevice.is_active ? 'text-green-500' : 'text-foreground'}`} />
                      </div>
                    );
                  })()}
                  <div>
                    <p className="font-medium text-foreground">
                      {selectedDevice.device || t("settings.devices.unknownDevice")}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      {isCurrentDevice(selectedDevice) && (
                        <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                          {t("settings.devices.thisDevice")}
                        </span>
                      )}
                      {!isCurrentDevice(selectedDevice) && selectedDevice.is_active && (
                        <span className="text-xs bg-green-500/10 text-green-500 px-2 py-0.5 rounded-full">
                          {t("settings.devices.active")}
                        </span>
                      )}
                      {!selectedDevice.is_active && (
                        <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                          {t("settings.devices.inactive") || "Inactive"}
                        </span>
                      )}
                    </div>
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
                  {selectedDevice.log_time && (
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">{t("settings.devices.loginTime") || "Login"}:</span>
                      <span className="text-foreground">{formatLoginDate(selectedDevice.log_time)}</span>
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

              {/* Only show remove button for active devices */}
              {selectedDevice.is_active && (
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
              )}
            </div>
          )}
        </DrawerContent>
      </Drawer>

      {/* Confirm Logout All Drawer */}
      <Drawer 
        open={showConfirmLogoutAll} 
        onOpenChange={setShowConfirmLogoutAll} 
        shouldScaleBackground={false}
      >
        <DrawerContent className="bg-background/95 backdrop-blur-xl">
          <div className="px-6 py-8 space-y-6">
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center">
                <AlertTriangle className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">
                {t("settings.devices.confirmLogoutAllTitle")}
              </h3>
              <p className="text-sm text-muted-foreground">
                {t("settings.devices.confirmLogoutAllDesc")}
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmLogoutAll(false)}
                className="flex-1 py-3.5 px-4 bg-muted hover:bg-muted/80 rounded-xl font-medium text-foreground transition-colors"
              >
                {t("common.cancel") || "Cancel"}
              </button>
              <button
                onClick={handleLogoutAll}
                disabled={isLoggingOutAll}
                className="flex-1 py-3.5 px-4 bg-red-500 hover:bg-red-600 rounded-xl font-medium text-white transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoggingOutAll ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <LogOut className="w-4 h-4" />
                    {t("settings.devices.logoutAll")}
                  </>
                )}
              </button>
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    </MobileLayout>
  );
};

// Device Card Component
interface DeviceCardProps {
  device: ActiveDevice;
  onClick: () => void;
  isCurrent?: boolean;
  showDivider?: boolean;
  t: (key: string, options?: Record<string, unknown>) => string;
}

const DeviceCard = ({ device, onClick, isCurrent, showDivider, t }: DeviceCardProps) => {
  const DeviceIcon = getDeviceIcon(device);
  
  return (
    <motion.button
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-4 hover:bg-muted/50 transition-colors text-left ${
        showDivider ? 'border-b border-border/50' : ''
      }`}
    >
      <div className="relative">
        <div className={`w-11 h-11 rounded-full flex items-center justify-center ${
          isCurrent ? 'bg-primary/20' : 'bg-muted'
        }`}>
          <DeviceIcon className={`w-5 h-5 ${isCurrent ? 'text-primary' : 'text-foreground'}`} />
        </div>
        {device.is_active && (
          <motion.div
            className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-background"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-foreground truncate">
            {device.device || t("settings.devices.unknownDevice")}
          </p>
          {isCurrent && (
            <span className="flex items-center gap-1 text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">
              <Check className="w-3 h-3" />
              {t("settings.devices.thisDevice")}
            </span>
          )}
          {!isCurrent && device.is_active && (
            <span className="text-xs bg-green-500/10 text-green-500 px-2 py-0.5 rounded-full">
              {t("settings.devices.active")}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 mt-1">
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
    </motion.button>
  );
};

// History Card Component
interface HistoryCardProps {
  entry: ActiveDevice;
  onClick: () => void;
  showDivider?: boolean;
  t: (key: string, options?: Record<string, unknown>) => string;
}

const HistoryCard = ({ entry, onClick, showDivider, t }: HistoryCardProps) => {
  const DeviceIcon = getDeviceIcon(entry);
  
  return (
    <motion.button
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-4 hover:bg-muted/50 transition-colors text-left ${
        showDivider ? 'border-b border-border/50' : ''
      }`}
    >
      <div className="relative">
        <div className={`w-11 h-11 rounded-full flex items-center justify-center ${
          entry.is_active ? 'bg-green-500/20' : 'bg-muted'
        }`}>
          <DeviceIcon className={`w-5 h-5 ${entry.is_active ? 'text-green-500' : 'text-muted-foreground'}`} />
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-foreground truncate">
            {entry.device || t("settings.devices.unknownDevice")}
          </p>
          {entry.is_active && (
            <span className="text-xs bg-green-500/10 text-green-500 px-2 py-0.5 rounded-full">
              {t("settings.devices.active")}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 mt-1">
          {entry.location && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {entry.location}
            </span>
          )}
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {formatLoginDate(entry.log_time)}
          </span>
        </div>
      </div>
    </motion.button>
  );
};

export default DevicesPage;
