import { FlowType, sendFlowScripts } from '@doodlesteam/floo';
import {
  UseQueryOptions,
  UseQueryResult,
  useQuery,
} from '@tanstack/react-query';

export type OmittedQueriesOptions = 'queryKey' | 'queryFn' | 'enabled';

export interface useFlowScriptsInnerProps {
  code: string;
  args?: FlowType[];
  enabled?: boolean;
}

export interface useFlowScriptsProps<
  TQueryFnData = unknown,
  TError = unknown,
  TData = TQueryFnData,
> extends Omit<
    UseQueryOptions<TQueryFnData, TError, TData>,
    OmittedQueriesOptions
  > {
  scripts: useFlowScriptsInnerProps[];
  scopeKey?: string;
  select?: (data: TQueryFnData) => TData;
  autoCast?: boolean;
}

export const useFlowScripts = <
  TQueryFnData extends unknown[] = unknown[],
  TError = unknown,
  TData = TQueryFnData,
>(
  props: useFlowScriptsProps<TQueryFnData, TError, TData>,
): UseQueryResult<TData, TError> => {
  const enabledScripts = props.scripts.filter(
    (script) => script.enabled !== false,
  );
  return useQuery<TQueryFnData, TError, TData>({
    ...props,
    queryKey: props.scopeKey ? [props.scopeKey] : ['flow-scripts', props],
    queryFn: () =>
      sendFlowScripts<TQueryFnData>({
        scripts: enabledScripts,
        autoCast: props.autoCast,
      }),
    select: props.select,
    refetchOnWindowFocus: props.refetchOnWindowFocus ?? false,
  });
};
