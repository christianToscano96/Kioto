import { useState, useEffect, useRef, useCallback } from "react";

/**
 * Breakpoints alineados con Tailwind CSS
 * sm: 640px | md: 768px | lg: 1024px
 */
const MOBILE_MAX = 640;  // < sm  → mobile
const TABLET_MAX = 1024; // < lg  → tablet

export type DeviceType = "mobile" | "tablet" | "desktop";

export interface UseDeviceTypeReturn {
  /** Tipo de dispositivo actual */
  deviceType: DeviceType;
  /** true si querés filtrar por mobile/tablet/desktop */
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  /** Ancho de ventana en px (SSR-safe, 0 en servidor) */
  width: number;
}

/**
 * Hook que detecta el tipo de dispositivo en tiempo real,
 * escuchando cambios de tamaño de ventana.
 *
 * Útil para adaptar layouts, mostrar/hide componentes,
 * o disparar lógica específica por breakpoint.
 */
export function useDeviceType(): UseDeviceTypeReturn {
  const [width, setWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 0,
  );
  const rafRef = useRef<number | null>(null);

  const handleResize = useCallback(() => {
    // Debounce con RAF para no disparar re-renders innecesarios
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
    }
    rafRef.current = requestAnimationFrame(() => {
      setWidth(window.innerWidth);
    });
  }, []);

  useEffect(() => {
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [handleResize]);

  const deviceType: DeviceType =
    width < MOBILE_MAX ? "mobile" : width < TABLET_MAX ? "tablet" : "desktop";

  return {
    deviceType,
    isMobile: deviceType === "mobile",
    isTablet: deviceType === "tablet",
    isDesktop: deviceType === "desktop",
    width,
  };
}
