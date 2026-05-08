/**
 * Hermes Conversation History Service
 *
 * Hermes doesn't maintain its own history - conversation context
 * is passed via the prompt. This is a stub implementation.
 */
import type { Conversation } from '../../../core/types';
import type { ProviderConversationHistoryService } from '../../../core/providers/types';

export class HermesConversationHistoryService implements ProviderConversationHistoryService {
  async hydrateConversationHistory(
    _conversation: Conversation,
    _vaultPath: string | null,
  ): Promise<void> {
    // No-op - Hermes receives full context in prompt
  }

  async deleteConversationSession(
    _conversation: Conversation,
    _vaultPath: string | null,
  ): Promise<void> {
    // No-op - Hermes doesn't store sessions
  }

  resolveSessionIdForConversation(_conversation: Conversation | null): string | null {
    // Hermes doesn't track session IDs
    return null;
  }

  isPendingForkConversation(_conversation: Conversation): boolean {
    return false;
  }

  buildForkProviderState(
    _sourceSessionId: string,
    _resumeAt: string,
    _sourceProviderState?: Record<string, unknown>,
  ): Record<string, unknown> {
    return {};
  }
}
