import * as fcl from '@onflow/fcl';
import { useMutation } from '@tanstack/react-query';

export const useFlowConnect = () => {
  const data = useMutation(async () => {
    return fcl.authenticate();
  });

  return { ...data, connect: data.mutate, connectAsync: data.mutateAsync };
};
