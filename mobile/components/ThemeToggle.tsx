import React from 'react';
import { TouchableOpacity } from 'react-native';
import { useColorScheme } from 'nativewind';
import { Ionicons } from '@expo/vector-icons';

export const ThemeToggle = React.memo(function ThemeToggle() {
  const { colorScheme, toggleColorScheme, setColorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  const handleToggle = () => {
    if (typeof toggleColorScheme === 'function') {
      toggleColorScheme();
    } else if (typeof setColorScheme === 'function') {
      setColorScheme(isDark ? 'light' : 'dark');
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={handleToggle}
      accessibilityRole="button"
      accessibilityLabel="다크/라이트 테마 변환 버튼"
      className="p-2 rounded-xl items-center justify-center bg-slate-200/80 dark:bg-slate-800 border dark:border-slate-700 border-slate-300/80"
    >
      {isDark ? (
        /* ☀️ Dark 모드일 때는 해(Sun) 아이콘이 노출됨 */
        <Ionicons name="sunny" size={18} color="#f59e0b" />
      ) : (
        /* 🌙 Light 모드일 때는 달(Moon) 아이콘이 노출됨 */
        <Ionicons name="moon" size={18} color="#0284c7" />
      )}
    </TouchableOpacity>
  );
});
