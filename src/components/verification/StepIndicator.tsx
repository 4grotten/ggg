interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
}

export const StepIndicator = ({ currentStep, totalSteps }: StepIndicatorProps) => {
  return (
    <div className="flex gap-3">
      {Array.from({ length: totalSteps }).map((_, index) => (
        <div
          key={index}
          className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
            index <= currentStep
              ? "bg-foreground"
              : "bg-muted"
          }`}
        />
      ))}
    </div>
  );
};
