import React from 'react';
import { TouchableOpacity } from 'react-native';
import { useColorScheme } from 'nativewind';
import { Ionicons } from '@expo/vector-icons';

export const ThemeToggle = React.memo(function ThemeToggle() {
  const { colorScheme, toggleColorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={toggleColorScheme}
      accessibilityRole="button"
      accessibilityLabel="다크/라이트 테마 변환 버튼"
      className="p-1.5 items-center justify-center bg-transparent"
    >
      {isDark ? (
        /* ☀️ Dark 모드일 때는 해(Sun) 아이콘이 노출됨 */
        <Ionicons name="sunny" size={17} color="#f59e0b" />
      ) : (
        /* 🌙 Light 모드일 때는 달(Moon) 아이콘이 노출됨 */
        <Ionicons name="moon" size={17} color="#475569" />
      )}
    </TouchableOpacity>
  );
});
