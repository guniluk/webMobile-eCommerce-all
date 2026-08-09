import { useState, useCallback, useEffect } from 'react';
import { useSSO } from '@clerk/clerk-expo';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';

WebBrowser.maybeCompleteAuthSession();

export function useWarmUpBrowser() {
  useEffect(() => {
    void WebBrowser.warmUpAsync();
    return () => {
      void WebBrowser.coolDownAsync();
    };
  }, []);
}

export function useSocialAuth() {
  useWarmUpBrowser();

  const [loadingStrategy, setLoadingStrategy] = useState<
    'google' | 'apple' | null
  >(null);
  const [errorMessage, setErrorMessage] = useState('');

  const { startSSOFlow } = useSSO();

  const onSelectOAuth = useCallback(
    async (strategy: 'oauth_google' | 'oauth_apple') => {
      const currentStrategy = strategy === 'oauth_google' ? 'google' : 'apple';
      setLoadingStrategy(currentStrategy);
      setErrorMessage('');
      try {
        const redirectUrl = AuthSession.makeRedirectUri({
          scheme: 'mobile',
        });
        console.log('SSO Redirect URL:', redirectUrl);

        const { createdSessionId, setActive } = await startSSOFlow({
          strategy,
          redirectUrl,
        });

        if (createdSessionId && setActive) {
          await setActive({ session: createdSessionId });
        }
      } catch (err: unknown) {
        console.error('OAuth Error:', err);
        const errMessage =
          err instanceof Error ? err.message : JSON.stringify(err);

        if (
          errMessage.includes('Missing external verification redirect URL')
        ) {
          setErrorMessage(
            `Clerk 대시보드(dashboard.clerk.com)의 Social Connections에서 ${
              currentStrategy === 'google' ? 'Google' : 'Apple'
            } 소셜 로그인이 활성화(Enable)되어 있는지 확인해 주세요.`,
          );
        } else {
          setErrorMessage(
            currentStrategy === 'google'
              ? 'Google 로그인 처리 중 오류가 발생했습니다.'
              : 'Apple ID 로그인 처리 중 오류가 발생했습니다.',
          );
        }
      } finally {
        setLoadingStrategy(null);
      }
    },
    [startSSOFlow],
  );

  return {
    loadingStrategy,
    errorMessage,
    onSelectOAuth,
  };
}
