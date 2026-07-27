"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";

const subscribeToHydration = () => () => undefined;

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const isHydrated = useSyncExternalStore(
    subscribeToHydration,
    () => true,
    () => false,
  );
  const isDark = isHydrated && resolvedTheme === "dark";

  return (
    <button
      type="button"
      className="inline-flex size-11 items-center justify-center rounded-lg border bg-[var(--surface)]"
      aria-label={isDark ? "Use light mode" : "Use dark mode"}
      onClick={() => setTheme(isDark ? "light" : "dark")}
    >
      {isDark ? (
        <Sun aria-hidden="true" size={19} />
      ) : (
        <Moon aria-hidden="true" size={19} />
      )}
    </button>
  );
}
