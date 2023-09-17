import { FlowEventName, subscribeFlowEvent } from '@doodlesteam/floo';
import { useEffect } from 'react';

export interface UseFlowEventProps<T> {
  eventName: string | FlowEventName;
  listener: (event: T) => void;
  once?: boolean;
}

export const useFlowEvent = <T>(props: UseFlowEventProps<T>) => {
  useEffect(() => {
    return subscribeFlowEvent<T>({
      eventName: props.eventName,
      listener: props.listener,
      once: props.once,
    });
  }, []);
};
