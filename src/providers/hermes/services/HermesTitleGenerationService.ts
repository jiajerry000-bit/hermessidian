/**
 * Hermes Title Generation Service
 *
 * Generates conversation titles for Hermes sessions.
 * Uses the first user message as the title (simple approach).
 */
import type { TitleGenerationCallback, TitleGenerationService } from '../../../core/providers/types';

export class HermesTitleGenerationService implements TitleGenerationService {
  async generateTitle(
    _conversationId: string,
    userMessage: string,
    callback: TitleGenerationCallback,
  ): Promise<void> {
    // Simple title: first 50 chars of user message
    const title = userMessage.slice(0, 50) + (userMessage.length > 50 ? '...' : '');

    await callback(_conversationId, { success: true, title });
  }

  cancel(): void {
    // No-op for Hermes
  }
}
