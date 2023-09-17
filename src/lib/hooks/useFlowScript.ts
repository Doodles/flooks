import { FlowType, sendFlowScript } from '@doodlesteam/floo';
import {
  UseQueryOptions,
  UseQueryResult,
  useQuery,
} from '@tanstack/react-query';

export type OmittedQueryOptions = 'queryKey' | 'queryFn';

export interface UseFlowScriptProps<
  TQueryFnData = unknown,
  TError = unknown,
  TData = TQueryFnData,
> extends Omit<
    UseQueryOptions<TQueryFnData, TError, TData>,
    OmittedQueryOptions
  > {
  code: string;
  args?: FlowType[];
  scopeKey?: string;
  select?: (data: TQueryFnData) => TData;
  autoCast?: boolean;
}

export const useFlowScript = <
  TQueryFnData = unknown,
  TError = unknown,
  TData = TQueryFnData,
>(
  props: UseFlowScriptProps<TQueryFnData, TError, TData>,
): UseQueryResult<TData, TError> => {
  return useQuery<TQueryFnData, TError, TData>({
    ...props,
    queryKey: props.scopeKey
      ? [props.scopeKey]
      : ['flow-script', props.code, props.args],
    queryFn: () =>
      sendFlowScript<TQueryFnData>({
        code: props.code,
        args: props.args,
        autoCast: props.autoCast,
      }),
    select: props.select,
    refetchOnWindowFocus: props.refetchOnWindowFocus ?? false,
  });
};
