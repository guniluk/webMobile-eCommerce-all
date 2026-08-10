import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/clerk-expo';
import { api } from '../lib/api';
import { Address } from '../types';

export const useAddressesQuery = () => {
  const { getToken, isLoaded } = useAuth();

  return useQuery<Address[]>({
    queryKey: ['addresses'],
    queryFn: async () => {
      const token = await getToken();
      return api.getAddresses(token);
    },
    enabled: isLoaded,
  });
};

export const useAddAddressMutation = () => {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (addressData: Omit<Address, '_id'>) => {
      const token = await getToken();
      return api.addAddress(addressData, token);
    },
    onSuccess: (updatedAddresses) => {
      queryClient.setQueryData(['addresses'], updatedAddresses);
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
    },
  });
};

export const useUpdateAddressMutation = () => {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      addressId,
      addressData,
    }: {
      addressId: string;
      addressData: Partial<Address>;
    }) => {
      const token = await getToken();
      return api.updateAddress(addressId, addressData, token);
    },
    onSuccess: (updatedAddresses) => {
      queryClient.setQueryData(['addresses'], updatedAddresses);
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
    },
  });
};

export const useDeleteAddressMutation = () => {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (addressId: string) => {
      const token = await getToken();
      return api.deleteAddress(addressId, token);
    },
    onSuccess: (updatedAddresses) => {
      queryClient.setQueryData(['addresses'], updatedAddresses);
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
    },
  });
};
