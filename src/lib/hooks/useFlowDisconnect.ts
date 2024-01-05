import * as fcl from '@onflow/fcl';
import { useMutation } from '@tanstack/react-query';

export const useFlowDisconnect = () => {
  const data = useMutation(async () => {
    return fcl.unauthenticate();
  });

  return {
    ...data,
    disconnect: data.mutate,
    disconnectAsync: data.mutateAsync,
  };
};
