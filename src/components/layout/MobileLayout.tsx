import { ReactNode } from "react";
import { useTranslation } from "react-i18next";

interface MobileLayoutProps {
  children: ReactNode;
  header?: ReactNode;
  title?: string;
  showBackButton?: boolean;
  onBack?: () => void;
  rightAction?: ReactNode;
  className?: string;
}

export const MobileLayout = ({
  children,
  header,
  title,
  showBackButton = false,
  onBack,
  rightAction,
  className = "",
}: MobileLayoutProps) => {
  const { t } = useTranslation();
  
  const hasHeader = header || title || showBackButton || rightAction;
  
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="w-full max-w-[800px] mx-auto flex flex-col min-h-screen">
        {/* Fixed Header */}
        {hasHeader && (
          <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
            <div className="max-w-[800px] mx-auto flex items-center justify-between h-14 px-4">
              <div className="flex-1 flex items-center">
                {showBackButton && (
                  <button
                    onClick={onBack}
                    className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 19l-7-7 7-7"
                      />
                    </svg>
                    <span className="text-sm">{t('common.back')}</span>
                  </button>
                )}
                {header && !showBackButton && <div>{header}</div>}
              </div>
              {title && (
                <h1 className="flex-1 text-center text-base font-semibold text-foreground truncate px-4">
                  {title}
                </h1>
              )}
              <div className="flex-1 flex justify-end pl-4">{rightAction}</div>
            </div>
          </header>
        )}

        {/* Main content with top padding for fixed header */}
        <main className={`flex-1 ${hasHeader ? 'pt-14' : ''} ${className}`}>{children}</main>
      </div>
    </div>
  );
};
