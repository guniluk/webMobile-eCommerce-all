import React from 'react';

export const useStripe = () => ({
  initPaymentSheet: async (params?: any) => ({ error: null as any }),
  presentPaymentSheet: async (params?: any) => ({
    error: {
      code: 'Canceled',
      message: 'Web 환경에서는 Stripe 모바일 결제 모달을 지원하지 않습니다.',
    } as any,
  }),
});

export const StripeProvider = ({
  children,
}: {
  children: React.ReactNode;
  publishableKey?: string;
}) => {
  return <>{children}</>;
};
