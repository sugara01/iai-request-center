import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/lib/localization';

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const { language } = useLanguage();
  const isDark = resolvedTheme === 'dark';
  const label = isDark
    ? language === 'id' ? 'Kembali ke tema default' : 'Switch to default theme'
    : language === 'id' ? 'Aktifkan tema neon dark' : 'Enable neon dark theme';

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      aria-label={label}
      title={label}
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
    >
      {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </Button>
  );
}
