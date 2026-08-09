import { Text, View, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Header } from '../../components/Header';

export default function AboutScreen() {
  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      className="flex-1 dark:bg-slate-900 bg-slate-100"
    >
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 60 }}
      >
        {/* 상단 우측 해/달 다크모드 변환 버튼이 있는 Header */}
        <Header title="About" />

        <View className="dark:bg-slate-800 bg-white p-6 rounded-2xl border dark:border-slate-700 border-slate-200 shadow-md mb-5">
          <Text className="text-2xl font-extrabold dark:text-indigo-400 text-indigo-600 mb-2">
            About
          </Text>
          <Text className="text-sm dark:text-slate-300 text-slate-700 leading-6">
            NativeWind v4 and Expo Router bottom tabs and dark/light mode theme
            switcher integrated app description page.
          </Text>
        </View>

        <View className="dark:bg-slate-800/80 bg-white/90 p-6 rounded-2xl border dark:border-slate-700 border-slate-200 shadow-sm">
          <Text className="text-lg font-bold dark:text-cyan-400 text-sky-600 mb-3">
            Theme & Layout Setting Status
          </Text>
          <View className="space-y-2">
            <Text className="text-sm dark:text-slate-300 text-slate-700">
              •{' '}
              <Text className="font-bold text-amber-500">Right top toggle</Text>
              : Sun(☀️ Light) / Moon(🌙 Dark) mode real-time conversion
            </Text>
            <Text className="text-sm dark:text-slate-300 text-slate-700">
              •{' '}
              <Text className="font-bold text-sky-500">Top / Left / Right</Text>
              : Safe area preservation
            </Text>
            <Text className="text-sm dark:text-cyan-300 text-sky-700 font-bold">
              • <Text className="font-bold text-sky-500">Bottom</Text>: Tab bar
              and device bottom area extended to the end
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
