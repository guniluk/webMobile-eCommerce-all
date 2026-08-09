import React from 'react';
import { View, Text } from 'react-native';
import { ThemeToggle } from './ThemeToggle';

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export const Header = React.memo(function Header({ title, subtitle }: HeaderProps) {
  return (
    <View className="flex-row justify-between items-center py-3 mb-3 border-b dark:border-slate-800/80 border-slate-200/60 pb-3">
      <View>
        <Text className="text-2xl font-black dark:text-white text-slate-900 tracking-tight">
          {title}
        </Text>
        {subtitle ? (
          <Text className="text-xs font-medium dark:text-slate-400 text-slate-500 mt-0.5">
            {subtitle}
          </Text>
        ) : null}
      </View>
      <ThemeToggle />
    </View>
  );
});
