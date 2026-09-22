export type ThemeMode = 'dark' | 'light' | 'system';

export function getStoredTheme(): ThemeMode {
  if (typeof window === 'undefined') return 'light';
  const saved = localStorage.getItem('cretivra_theme') as ThemeMode | null;
  if (saved === 'dark' || saved === 'light' || saved === 'system') {
    return saved;
  }
  return 'light';
}

export function getResolvedTheme(theme: ThemeMode): 'dark' | 'light' {
  if (theme === 'system' && typeof window !== 'undefined') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return theme === 'dark' ? 'dark' : 'light';
}

export function applyTheme(theme: ThemeMode): 'dark' | 'light' {
  const resolved = getResolvedTheme(theme);
  if (typeof document !== 'undefined') {
    const root = document.documentElement;
    root.setAttribute('data-theme', resolved);
    root.classList.remove('dark', 'light');
    root.classList.add(resolved);

    if (document.body) {
      document.body.classList.remove('dark', 'light');
      document.body.classList.add(resolved);
    }
  }
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('cretivra_theme', theme);
  }
  return resolved;
}

export function initTheme(): () => void {
  if (typeof window === 'undefined') return () => {};
  const current = getStoredTheme();
  applyTheme(current);

  const media = window.matchMedia('(prefers-color-scheme: dark)');
  const listener = () => {
    if (getStoredTheme() === 'system') {
      applyTheme('system');
    }
  };

  media.addEventListener('change', listener);
  return () => media.removeEventListener('change', listener);
}
