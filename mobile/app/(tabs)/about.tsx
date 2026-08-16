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
            This app is a simple e-commerce app built with Next.js, TypeScript,
            and NativeWind.
          </Text>
        </View>

        <View className="dark:bg-slate-800/80 bg-white/90 p-6 rounded-2xl border dark:border-slate-700 border-slate-200 shadow-sm">
          <Text className="text-lg font-bold dark:text-cyan-400 text-sky-600 mb-3">
            Future Feature List
          </Text>
          <View className="space-y-2">
            <Text className="text-sm dark:text-slate-300 text-slate-700">
              • <Text className="font-bold text-amber-500">기능 추가</Text>:
              구매하기, 결제하기 기능에 실제 stripe 연동
            </Text>
            <Text className="text-sm dark:text-slate-300 text-slate-700">
              • <Text className="font-bold text-sky-500">UI 디자인 개선</Text>:
              안드로이드 단말에서의 UI 보완
            </Text>
            <Text className="text-sm dark:text-cyan-300 text-sky-700 font-bold">
              • <Text className="font-bold text-sky-500">배포</Text>: app store,
              google play에 동시 배포
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
