/**
 * Hermes Provider Capabilities
 *
 * Hermes is a simpler provider compared to Claude:
 * - No persistent runtime (oneshot queries only)
 * - No native history (conversation context managed externally)
 * - No plan mode, rewind, fork
 * - No MCP tools
 */
import type { ProviderCapabilities } from '../../core/providers/types';

export const HERMES_PROVIDER_CAPABILITIES: Readonly<ProviderCapabilities> = Object.freeze({
  providerId: 'hermes',
  supportsPersistentRuntime: false,
  supportsNativeHistory: false,
  supportsPlanMode: false,
  supportsRewind: false,
  supportsFork: false,
  supportsProviderCommands: false,
  supportsImageAttachments: false,
  supportsInstructionMode: false,
  supportsMcpTools: false,
  supportsTurnSteer: false,
  reasoningControl: 'none',
});
