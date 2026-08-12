import React from 'react';

export const useStripe = () => ({
  initPaymentSheet: async (params?: any) => ({ error: null as any }),
  presentPaymentSheet: async (params?: any) => ({
    error: null as any,
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
