import {
  ConfigureChainsProps,
  configureChains as flooConfigureChains,
} from '@doodlesteam/floo';

export const configureChains = (
  configureChainsProps: ConfigureChainsProps,
  extraConfigs: Record<string, unknown> = {},
) => {
  flooConfigureChains(configureChainsProps, extraConfigs);
};
