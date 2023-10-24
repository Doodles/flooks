import {
  AuthorizationFunction,
  FlowEvent,
  FlowTransactionError,
  FlowTransactionStatus,
  FlowType,
  TransactionSubscriber,
  parseFlowArgs,
  parseFlowTransactionError,
  sendFlowTransaction,
} from '@doodlesteam/floo';
import { UseMutationOptions, useMutation } from '@tanstack/react-query';
import isEqual from 'lodash/isEqual';
import { useEffect, useState } from 'react';

export interface FlowTransactionResultPending {
  transactionId: string;
}

export interface FlowTransactionResultSealed {
  transactionId: string;
  blockId: string;
  events: FlowEvent[];
}

export interface FlowTransactionResultError {
  transactionId?: string;
  blockId?: string;
  error: FlowTransactionError;
}

export type UseFlowTransactionStatus =
  | 'idle'
  | 'preparing'
  | 'pending'
  | 'sealed'
  | 'error';

export type OmittedMutationOptions =
  | 'mutationKey'
  | 'mutationFn'
  | 'onMutate'
  | 'onSettled'
  | 'onError'
  | 'onSuccess';

export interface UseFlowTransactionProps
  extends Omit<UseMutationOptions, OmittedMutationOptions> {
  code: string;
  args?: FlowType[];
  limit?: number;
  payer?: AuthorizationFunction;
  proposer?: AuthorizationFunction;
  authorizations?: AuthorizationFunction[];
  scopeKey?: string;
  enabled?: boolean;
  onInvalidTransaction?: (error: unknown) => void; // TODO Change unknown type
  onTransactionPreparing?: () => void;
  onTransactionPending?: (result: FlowTransactionResultPending) => void;
  onTransactionSealed?: (result: FlowTransactionResultSealed) => void;
  onTransactionError?: (result: FlowTransactionResultError) => void;
}

export interface UseFlowTransactionResult {
  data: TransactionSubscriber | undefined;
  status: UseFlowTransactionStatus;
  error: FlowTransactionError | undefined;
  isValid: boolean;
  isLoading: boolean;
  isError: boolean;
  isIdle: boolean;
  isSealed: boolean;
  isPreparing: boolean;
  isPending: boolean;
  execute: () => void;
  executeAsync: () => Promise<void>;
  reset: () => void;
}

export const useFlowTransaction = (
  props: UseFlowTransactionProps,
): UseFlowTransactionResult => {
  const [isValid, setIsValid] = useState<boolean>(false);
  const [status, setStatus] = useState<UseFlowTransactionStatus>('idle');
  const [error, setError] = useState<FlowTransactionError | undefined>(
    undefined,
  );
  const [previousArgs, setPreviousArgs] = useState<FlowType[]>();
  const [previousCode, setPreviousCode] = useState<string>();

  const checkTransactionValidity = () => {
    if (props.enabled === false) {
      console.error('Disabled transaction');
      return;
    }
    if (!isValid) {
      // TODO Add error message
      console.error('Invalid transaction');
      return;
    }
  };

  useEffect(() => {
    if (
      isEqual(previousArgs, props.args) &&
      isEqual(previousCode, props.code)
    ) {
      return;
    }
    setPreviousArgs(props.args);
    setPreviousCode(props.code);
    try {
      parseFlowArgs({
        code: props.code,
        args: props.args,
      });
      setIsValid(true);
    } catch (error) {
      setIsValid(false);
      if (props.enabled === false) {
        return;
      }
      if (props.onInvalidTransaction) {
        props.onInvalidTransaction(error);
      } else {
        console.error(error);
      }
    }
  }, [props.code, props.args, props.enabled, props.onInvalidTransaction]);

  const mutation = useMutation<TransactionSubscriber, string>({
    ...props,
    mutationKey: props.scopeKey
      ? [props.scopeKey]
      : ['flow-transaction', props],
    mutationFn: () =>
      sendFlowTransaction({
        code: props.code,
        args: props.args,
        limit: props.limit,
        auth: {
          payer: props.payer,
          proposer: props.proposer,
          authorizations: props.authorizations,
        },
      }),
    onMutate: () => {
      setStatus('preparing');
      setError(undefined);
      props.onTransactionPreparing?.();
    },
    onError: (errorMessage: string) => {
      setStatus('error');
      const error: FlowTransactionError =
        parseFlowTransactionError(errorMessage);
      setError(error);
      props.onTransactionError?.({
        error,
      });
    },
    onSuccess: (subscriber: TransactionSubscriber) => {
      subscriber.subscribe((transactionStatus: FlowTransactionStatus) => {
        setStatus(transactionStatus.status);
        switch (transactionStatus.status) {
          case 'pending': {
            props.onTransactionPending?.({
              transactionId: transactionStatus.transactionId,
            });
            break;
          }
          case 'sealed': {
            props.onTransactionSealed?.({
              transactionId: transactionStatus.transactionId,
              blockId: transactionStatus.blockId,
              events: transactionStatus.events,
            });
            break;
          }
          case 'error': {
            setError(transactionStatus.error);
            props.onTransactionError?.({
              transactionId: transactionStatus.transactionId,
              blockId: transactionStatus.blockId,
              error: transactionStatus.error,
            });
            break;
          }
        }
      });
    },
  });

  return {
    data: mutation.data,
    status,
    error,
    isValid,
    isLoading: status === 'preparing' || status === 'pending',
    isError: status === 'error',
    isIdle: status === 'idle',
    isSealed: status === 'sealed',
    isPreparing: status === 'preparing',
    isPending: status === 'pending',
    execute: () => {
      checkTransactionValidity();
      mutation.mutate();
    },
    executeAsync: async () => {
      checkTransactionValidity();
      await mutation.mutateAsync();
    },
    reset: () => {
      setStatus('idle');
      setError(undefined);
      mutation.reset();
    },
  };
};
