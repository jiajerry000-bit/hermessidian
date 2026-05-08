/**
 * Hermes Provider Registration
 *
 * Registers Hermes as a chat provider for Obsidian.
 * Uses WSL2 Hermes CLI for query execution.
 */
import type { ProviderRegistration } from '../../core/providers/types';
import type ClaudianPlugin from '../../main';
import { HERMES_PROVIDER_CAPABILITIES } from './capabilities';
import { HermesConversationHistoryService } from './history/HermesConversationHistoryService';
import { HermesChatRuntime } from './runtime/HermesChatRuntime';
import { HermesTaskResultInterpreter } from './runtime/HermesTaskResultInterpreter';
import { HermesTitleGenerationService } from './services/HermesTitleGenerationService';

/**
 * Hermes provider registration.
 *
 * This enables "Hermes" as a selectable provider in the Claudian UI.
 * When selected, chat queries are sent to `wsl hermes -z`.
 */
export const hermesProviderRegistration: ProviderRegistration = {
  displayName: 'Hermes',
  blankTabOrder: 30, // Appears after Claude (20) and Codex (25)
  isEnabled: () => true,
  capabilities: HERMES_PROVIDER_CAPABILITIES,
  chatUIConfig: {
    getModelOptions: () => [
      // Hermes uses the default model configured in hermes-agent
      { value: 'default', label: 'Hermes Default' },
    ],
    ownsModel: () => true, // Hermes owns all models
    isAdaptiveReasoningModel: () => false,
    getReasoningOptions: () => [],
    getDefaultReasoningValue: () => 'none',
    getContextWindowSize: () => 200000, // Default context window
    isDefaultModel: () => true,
    applyModelDefaults: () => {},
    normalizeModelVariant: (model) => model,
    getCustomModelIds: () => new Set(),
    getProviderIcon: () => ({
      kind: 'markup',
      viewBox: '0 0 24 24',
      markup: `<path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" stroke-width="2" fill="none"/>`,
    }),
  },
  settingsReconciler: {
    reconcileModelWithEnvironment: () => ({ changed: false, invalidatedConversations: [] }),
    normalizeModelVariantSettings: () => false,
  },
  createRuntime: ({ plugin }: { plugin: ClaudianPlugin }) => {
    return new HermesChatRuntime(plugin);
  },
  createTitleGenerationService: () => new HermesTitleGenerationService(),
  createInstructionRefineService: () => ({
    setModelOverride: () => {},
    resetConversation: () => {},
    refineInstruction: async () => ({ success: false, error: 'Not supported' }),
    continueConversation: async () => ({ success: false, error: 'Not supported' }),
    cancel: () => {},
  }),
  createInlineEditService: () => ({
    setModelOverride: () => {},
    resetConversation: () => {},
    editText: async () => ({ success: false, error: 'Not supported' }),
    continueConversation: async () => ({ success: false, error: 'Not supported' }),
    cancel: () => {},
  }),
  historyService: new HermesConversationHistoryService(),
  taskResultInterpreter: new HermesTaskResultInterpreter(),
};
