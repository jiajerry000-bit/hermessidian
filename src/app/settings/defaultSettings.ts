import { getDefaultHiddenProviderCommands } from '../../core/providers/commands/hiddenCommands';
import { type ClaudianSettings } from '../../core/types/settings';
import { getBuiltInProviderDefaultConfigs } from '../../providers/defaultProviderConfigs';

export const DEFAULT_CLAUDIAN_SETTINGS: ClaudianSettings = {
  userName: '阿杰',

  permissionMode: 'yolo',

  model: 'default',
  thinkingBudget: 'off',
  effortLevel: 'high',
  serviceTier: 'default',
  enableAutoTitleGeneration: true,
  titleGenerationModel: '',

  excludedTags: [],
  mediaFolder: '',
  systemPrompt: '',
  persistentExternalContextPaths: [],

  sharedEnvironmentVariables: '',
  envSnippets: [],
  customContextLimits: {},

  keyboardNavigation: {
    scrollUpKey: 'w',
    scrollDownKey: 's',
    focusInputKey: 'i',
  },

  locale: 'en',

  providerConfigs: getBuiltInProviderDefaultConfigs(),

  settingsProvider: 'claude',
  savedProviderModel: {},
  savedProviderEffort: {},
  savedProviderServiceTier: {},
  savedProviderThinkingBudget: {},
  savedProviderPermissionMode: {},

  lastCustomModel: '',

  maxTabs: 3,
  tabBarPosition: 'input',
  enableAutoScroll: true,
  openInMainTab: false,

  hiddenProviderCommands: getDefaultHiddenProviderCommands(),
};
