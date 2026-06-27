import { useAuthStore } from '@store/authStore';

/**
 * Returns Grandparent Mode state and scaling helpers.
 *
 * isGP is true when the user has role='grandparent' OR the toggle is on.
 * Use fs() / dim() / hit() to scale font sizes, dimensions, and touch targets.
 */
export function useGrandparentMode() {
  const { user, grandparentMode } = useAuthStore();
  const isGP = grandparentMode || user?.role === 'grandparent';

  return {
    isGP,
    /** Scale a font size for GP mode (×1.3) */
    fs: (n: number) => (isGP ? Math.round(n * 1.3) : n),
    /** Scale a layout dimension (padding, height, icon size, etc.) for GP mode (×1.35) */
    dim: (n: number) => (isGP ? Math.round(n * 1.35) : n),
    /** Ensure a touch target meets the GP minimum of 64 px */
    hit: (n: number) => (isGP ? Math.max(Math.round(n * 1.4), 64) : n),
  };
}
