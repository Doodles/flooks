import { FlowAccount, FlowUser } from '@doodlesteam/floo';
import * as fcl from '@onflow/fcl';
import { useEffect, useState } from 'react';

import { usePrevious } from './internal/usePrevious';

interface UseFlowAccountProps {
  onConnect?({ address }: { address: string }): void;
  onDisconnect?(): void;
}

export const useFlowAccount = ({
  onConnect,
  onDisconnect,
}: UseFlowAccountProps = {}): FlowAccount => {
  const [user, setUser] = useState<FlowUser>({});
  const previousUser = usePrevious(user);

  useEffect(() => {
    return fcl.currentUser().subscribe(setUser);
  }, []);

  useEffect(() => {
    if (onConnect && !previousUser.addr && user.addr) {
      onConnect({ address: user.addr });
    }
    if (onDisconnect && previousUser.addr && !user.addr) {
      onDisconnect();
    }
  }, [user]);

  return {
    address: user?.addr,
  };
};
