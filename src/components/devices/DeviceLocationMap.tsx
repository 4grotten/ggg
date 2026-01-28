import { motion } from "framer-motion";
import { MapPin, ExternalLink, Navigation } from "lucide-react";
import { countries } from "@/data/countries";
import { useTranslation } from "react-i18next";

interface DeviceLocationMapProps {
  location: string | null;
  ip?: string;
}

// Map of city/country names to country codes
const locationToCountryCode: Record<string, string> = {
  // Common cities and their country codes
  "dubai": "AE",
  "abu dhabi": "AE",
  "sharjah": "AE",
  "ajman": "AE",
  "moscow": "RU",
  "saint petersburg": "RU",
  "st. petersburg": "RU",
  "london": "GB",
  "manchester": "GB",
  "new york": "US",
  "los angeles": "US",
  "san francisco": "US",
  "chicago": "US",
  "berlin": "DE",
  "munich": "DE",
  "frankfurt": "DE",
  "paris": "FR",
  "lyon": "FR",
  "marseille": "FR",
  "tokyo": "JP",
  "osaka": "JP",
  "beijing": "CN",
  "shanghai": "CN",
  "shenzhen": "CN",
  "istanbul": "TR",
  "ankara": "TR",
  "cairo": "EG",
  "riyadh": "SA",
  "jeddah": "SA",
  "doha": "QA",
  "kuwait city": "KW",
  "manama": "BH",
  "muscat": "OM",
  "singapore": "SG",
  "hong kong": "HK",
  "taipei": "TW",
  "seoul": "KR",
  "sydney": "AU",
  "melbourne": "AU",
  "toronto": "CA",
  "vancouver": "CA",
  "amsterdam": "NL",
  "brussels": "BE",
  "zurich": "CH",
  "geneva": "CH",
  "vienna": "AT",
  "warsaw": "PL",
  "prague": "CZ",
  "budapest": "HU",
  "rome": "IT",
  "milan": "IT",
  "madrid": "ES",
  "barcelona": "ES",
  "lisbon": "PT",
  "athens": "GR",
  "dublin": "IE",
  "oslo": "NO",
  "stockholm": "SE",
  "helsinki": "FI",
  "copenhagen": "DK",
  "mumbai": "IN",
  "delhi": "IN",
  "bangalore": "IN",
  "jakarta": "ID",
  "bangkok": "TH",
  "kuala lumpur": "MY",
  "manila": "PH",
  "ho chi minh": "VN",
  "hanoi": "VN",
  // Countries
  "united arab emirates": "AE",
  "uae": "AE",
  "russia": "RU",
  "united kingdom": "GB",
  "uk": "GB",
  "united states": "US",
  "usa": "US",
  "germany": "DE",
  "france": "FR",
  "japan": "JP",
  "china": "CN",
  "turkey": "TR",
  "egypt": "EG",
  "saudi arabia": "SA",
  "qatar": "QA",
  "kuwait": "KW",
  "bahrain": "BH",
  "oman": "OM",
  "india": "IN",
  "indonesia": "ID",
  "thailand": "TH",
  "malaysia": "MY",
  "philippines": "PH",
  "vietnam": "VN",
  "australia": "AU",
  "canada": "CA",
  "netherlands": "NL",
  "belgium": "BE",
  "switzerland": "CH",
  "austria": "AT",
  "poland": "PL",
  "czech republic": "CZ",
  "hungary": "HU",
  "italy": "IT",
  "spain": "ES",
  "portugal": "PT",
  "greece": "GR",
  "ireland": "IE",
  "norway": "NO",
  "sweden": "SE",
  "finland": "FI",
  "denmark": "DK",
};

function getCountryFromLocation(location: string): { code: string; name: string; flag: string } | null {
  const locationLower = location.toLowerCase();
  
  // First try to find by city or country name in our mapping
  for (const [key, code] of Object.entries(locationToCountryCode)) {
    if (locationLower.includes(key)) {
      const country = countries.find(c => c.code === code);
      if (country) return country;
    }
  }
  
  // Try to match country name directly from countries list
  for (const country of countries) {
    if (locationLower.includes(country.name.toLowerCase())) {
      return country;
    }
  }
  
  return null;
}

function getGoogleMapsUrl(location: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`;
}

export const DeviceLocationMap = ({ location, ip }: DeviceLocationMapProps) => {
  const { t } = useTranslation();
  
  if (!location) return null;
  
  const country = getCountryFromLocation(location);
  const mapsUrl = getGoogleMapsUrl(location);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 border border-primary/20"
    >
      {/* Animated background pattern */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Animated grid lines */}
        <motion.div
          className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(rgba(0, 122, 255, 0.05) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0, 122, 255, 0.05) 1px, transparent 1px)
            `,
            backgroundSize: '20px 20px',
          }}
          animate={{
            backgroundPosition: ['0px 0px', '20px 20px'],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
        
        {/* Pulsing radar effect */}
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 rounded-full border border-primary/20"
          animate={{
            scale: [1, 2, 2],
            opacity: [0.5, 0.2, 0],
          }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            ease: 'easeOut',
          }}
        />
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 rounded-full border border-primary/20"
          animate={{
            scale: [1, 2, 2],
            opacity: [0.5, 0.2, 0],
          }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            ease: 'easeOut',
            delay: 1.25,
          }}
        />
        
        {/* Floating dots */}
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1.5 h-1.5 rounded-full bg-primary/30"
            style={{
              left: `${15 + (i * 15)}%`,
              top: `${20 + ((i % 3) * 25)}%`,
            }}
            animate={{
              y: [0, -10, 0],
              opacity: [0.3, 0.7, 0.3],
            }}
            transition={{
              duration: 2 + (i * 0.3),
              repeat: Infinity,
              ease: 'easeInOut',
              delay: i * 0.2,
            }}
          />
        ))}
      </div>
      
      {/* Content */}
      <div className="relative z-10 p-4">
        <div className="flex items-center justify-between">
          {/* Location info with flag */}
          <div className="flex items-center gap-3">
            {/* Animated pin with flag */}
            <motion.div
              className="relative"
              animate={{
                y: [0, -3, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            >
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center shadow-lg shadow-primary/10">
                {country ? (
                  <motion.span
                    className="text-3xl"
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ 
                      type: 'spring', 
                      stiffness: 200, 
                      damping: 15,
                      delay: 0.2 
                    }}
                  >
                    {country.flag}
                  </motion.span>
                ) : (
                  <MapPin className="w-6 h-6 text-primary" />
                )}
              </div>
              
              {/* Pulse ring around icon */}
              <motion.div
                className="absolute inset-0 rounded-2xl border-2 border-primary/30"
                animate={{
                  scale: [1, 1.2, 1.2],
                  opacity: [0.5, 0, 0],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeOut',
                }}
              />
            </motion.div>
            
            <div className="space-y-1">
              <motion.p
                className="text-sm font-medium text-foreground"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
              >
                {location}
              </motion.p>
              {country && (
                <motion.p
                  className="text-xs text-muted-foreground"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  {country.name}
                </motion.p>
              )}
              {ip && (
                <motion.p
                  className="text-xs text-muted-foreground/70 font-mono"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  IP: {ip}
                </motion.p>
              )}
            </div>
          </div>
          
          {/* Google Maps link button */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, type: 'spring' }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => {
                e.stopPropagation();
                window.open(mapsUrl, '_blank', 'noopener,noreferrer');
              }}
              className="flex items-center gap-2 px-4 py-2.5 bg-primary/10 hover:bg-primary/20 rounded-xl transition-all group cursor-pointer"
            >
              <Navigation className="w-4 h-4 text-primary group-hover:rotate-12 transition-transform" />
              <span className="text-xs font-medium text-primary hidden sm:inline">
                {t("settings.devices.openMaps")}
              </span>
              <ExternalLink className="w-3.5 h-3.5 text-primary/70" />
            </a>
          </motion.div>
        </div>
        
        {/* Animated connection line */}
        <motion.div
          className="absolute bottom-2 left-4 right-4 h-0.5 rounded-full overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <motion.div
            className="h-full bg-gradient-to-r from-transparent via-primary/50 to-transparent"
            animate={{
              x: ['-100%', '200%'],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'linear',
            }}
          />
        </motion.div>
      </div>
    </motion.div>
  );
};

export default DeviceLocationMap;
