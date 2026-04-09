import { Toaster as Sonner, toast } from "sonner"

const Toaster = ({
  ...props
}) => {
  // Detect dark mode from document class
  const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');

  return (
    <Sonner
      theme={isDark ? 'dark' : 'light'}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-white/90 group-[.toaster]:backdrop-blur-xl group-[.toaster]:text-foreground group-[.toaster]:border-white/30 group-[.toaster]:shadow-xl group-[.toaster]:rounded-xl dark:group-[.toaster]:bg-[#1A2332]/90 dark:group-[.toaster]:border-white/10",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-[#1A2F3A] group-[.toast]:text-white group-[.toast]:rounded-lg",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground group-[.toast]:rounded-lg",
        },
      }}
      {...props} />
  );
}

export { Toaster, toast }
