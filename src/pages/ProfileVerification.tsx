import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { LanguageSwitcher } from "@/components/dashboard/LanguageSwitcher";
import { ShieldCheck, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

const AnimatedFingerprint = () => {
  const [step, setStep] = useState(0);
  
  useEffect(() => {
    const timers = [
      setTimeout(() => setStep(1), 300),
      setTimeout(() => setStep(2), 600),
      setTimeout(() => setStep(3), 900),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  // All Fingerprint paths from lucide-react, grouped by step
  const arcs = [
    // Step 1: One arc
    { d: "M12 10a2 2 0 0 0-2 2c0 1.02-.1 2.51-.26 4", step: 1 },
    // Step 2: Three more arcs
    { d: "M14 13.12c0 2.38 0 6.38-1 8.88", step: 2 },
    { d: "M17.29 21.02c.12-.6.43-2.3.5-3.02", step: 2 },
    { d: "M2 12a10 10 0 0 1 18-6", step: 2 },
    // Step 3: Remaining arcs
    { d: "M2 16h.01", step: 3 },
    { d: "M21.8 16c.2-2 .131-5.354 0-6", step: 3 },
    { d: "M5 19.5C5.5 18 6 15 6 12a6 6 0 0 1 .34-2", step: 3 },
    { d: "M8.65 22c.21-.66.45-1.32.57-2", step: 3 },
    { d: "M9 6.8a6 6 0 0 1 9 5.2v2", step: 3 },
  ];

  return (
    <motion.div 
      className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-6 relative"
      animate={step === 3 ? { scale: [1, 1.1, 1] } : {}}
      transition={{ duration: 0.3 }}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="48"
        height="48"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-primary"
      >
        {arcs.map((arc, index) => (
          <motion.path
            key={index}
            d={arc.d}
            initial={{ pathLength: 0, opacity: 0 }}
            animate={step >= arc.step ? { pathLength: 1, opacity: 1 } : { pathLength: 0, opacity: 0 }}
            transition={{ 
              duration: 0.35, 
              ease: "easeOut",
              delay: arc.step === step ? index * 0.04 : 0
            }}
          />
        ))}
      </svg>
    </motion.div>
  );
};

const ProfileVerification = () => {
  const navigate = useNavigate();

  return (
    <MobileLayout
      showBackButton
      onBack={() => navigate(-1)}
      rightAction={<LanguageSwitcher />}
    >
      <div className="flex flex-col items-center justify-center px-6 pt-16 pb-8">
        {/* Animated Icon */}
        <AnimatedFingerprint />

        {/* Title */}
        <h1 className="text-2xl font-bold text-foreground mb-3 text-center">
          Verify Your Identity
        </h1>

        {/* Description */}
        <p className="text-muted-foreground text-center mb-8 max-w-sm">
          Complete the verification process to unlock all features and increase your account limits.
        </p>

        {/* Benefits */}
        <div className="w-full bg-card rounded-2xl p-5 mb-8 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-medium text-foreground">Secure & Private</p>
              <p className="text-sm text-muted-foreground">Your data is encrypted and protected</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <ArrowRight className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-medium text-foreground">Quick Process</p>
              <p className="text-sm text-muted-foreground">Takes only 2-3 minutes to complete</p>
            </div>
          </div>
        </div>

        {/* CTA Button */}
        <Button
          onClick={() => navigate("/verify")}
          className="w-full h-14 text-base font-semibold rounded-2xl bg-primary/90 backdrop-blur-2xl border-2 border-white/50 text-primary-foreground gap-2 shadow-lg hover:bg-primary"
        >
          Start Verification
          <ArrowRight className="w-5 h-5" />
        </Button>
      </div>
    </MobileLayout>
  );
};

export default ProfileVerification;
