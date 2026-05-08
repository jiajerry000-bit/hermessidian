/**
 * HermesChatRuntime - ChatRuntime implementation for Hermes Agent
 *
 * Uses `wsl hermes -z` for oneshot query execution.
 * Hermes Agent runs in WSL2; this plugin runs in Windows Obsidian.
 */
import { execSync } from 'child_process';
import { randomUUID } from 'crypto';

import type { ProviderCapabilities, ProviderId } from '../../../core/providers/types';
import type { ChatRuntime } from '../../../core/runtime/ChatRuntime';
import type {
  ApprovalCallback,
  AskUserQuestionCallback,
  AutoTurnResult,
  ChatRewindResult,
  ChatRuntimeConversationState,
  ChatRuntimeEnsureReadyOptions,
  ChatRuntimeQueryOptions,
  ChatTurnMetadata,
  ChatTurnRequest,
  ExitPlanModeCallback,
  PreparedChatTurn,
  SessionUpdateResult,
  SubagentRuntimeState,
} from '../../../core/runtime/types';
import type { ChatMessage, SlashCommand, StreamChunk } from '../../../core/types';
import type ClaudianPlugin from '../../../main';

const HERMES_PROVIDER_ID = 'hermes' as ProviderId;

export interface HermesRuntimeOptions {
  plugin: ClaudianPlugin;
}

/**
 * Hermes runtime that delegates to WSL2 Hermes CLI.
 *
 * @example
 * const runtime = new HermesChatRuntime(plugin);
 * const prepared = runtime.prepareTurn({ text: "Hello Hermes" });
 * for await (const chunk of runtime.query(prepared)) {
 *   console.log(chunk);
 * }
 */
export class HermesChatRuntime implements ChatRuntime {
  private readonly plugin: ClaudianPlugin;
  private sessionId: string | null = null;
  private _ready = true;
  private approvalCallback: ApprovalCallback | null = null;
  private approvalDismisser: (() => void) | null = null;
  private askUserQuestionCallback: AskUserQuestionCallback | null = null;
  private exitPlanModeCallback: ExitPlanModeCallback | null = null;
  private permissionModeSyncCallback: ((sdkMode: string) => void) | null = null;
  private subagentHookProvider: (() => SubagentRuntimeState) | null = null;
  private autoTurnCallback: ((result: AutoTurnResult) => void) | null = null;
  private turnMetadata: ChatTurnMetadata = {};
  private lastError: string | null = null;

  constructor(plugin: ClaudianPlugin, _options?: HermesRuntimeOptions) {
    this.plugin = plugin;
    this.sessionId = randomUUID();
  }

  // ---------------------------------------------------------------------------
  // ChatRuntime interface implementation
  // ---------------------------------------------------------------------------

  get providerId(): ProviderId {
    return HERMES_PROVIDER_ID;
  }

  getCapabilities(): Readonly<ProviderCapabilities> {
    return HERMES_PROVIDER_CAPABILITIES;
  }

  prepareTurn(request: ChatTurnRequest): PreparedChatTurn {
    // Build the prompt from the request
    const prompt = this.buildPrompt(request);

    return {
      request,
      persistedContent: prompt,
      prompt,
      isCompact: false,
      mcpMentions: new Set(),
    };
  }

  onReadyStateChange(listener: (ready: boolean) => void): () => void {
    listener(this._ready);
    return () => {};
  }

  setResumeCheckpoint(_checkpointId: string | undefined): void {
    // No-op for Hermes - no checkpoint concept
  }

  syncConversationState(
    _conversation: ChatRuntimeConversationState | null,
    _externalContextPaths?: string[],
  ): void {
    // No-op for Hermes - no session concept beyond sessionId
  }

  async reloadMcpServers(): Promise<void> {
    // MCP not yet supported in Hermes
    this.lastError = null;
  }

  async ensureReady(_options?: ChatRuntimeEnsureReadyOptions): Promise<boolean> {
    // Hermes is always ready if WSL and hermes are available
    return true;
  }

  async *query(
    turn: PreparedChatTurn,
    _conversationHistory?: ChatMessage[],
    _queryOptions?: ChatRuntimeQueryOptions,
  ): AsyncGenerator<StreamChunk> {
    const { prompt } = turn;

    // Emit user message marker
    yield { type: 'user_message_start', content: turn.request.text };

    // Emit assistant message start
    yield { type: 'assistant_message_start' };

    try {
      // Call Hermes via WSL
      const result = await this.callHermes(prompt);

      // Stream result with typewriter effect
      for (const char of result) {
        yield { type: 'text', content: char };
      }

      // Mark completion
      yield { type: 'done' };
      yield { type: 'usage', usage: { inputTokens: 0, contextWindow: 0, contextTokens: 0, percentage: 0 } };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.lastError = errorMessage;
      yield { type: 'error', content: errorMessage };
    }
  }

  cancel(): void {
    // Hermes -z is oneshot, cannot cancel mid-flight
    // But we track the state
  }

  resetSession(): void {
    // Generate new session ID for new conversation context
    this.sessionId = randomUUID();
    this.turnMetadata = {};
  }

  getSessionId(): string | null {
    return this.sessionId;
  }

  consumeSessionInvalidation(): boolean {
    // Hermes doesn't have session invalidation
    return false;
  }

  isReady(): boolean {
    return this._ready;
  }

  async getSupportedCommands(): Promise<SlashCommand[]> {
    // Hermes doesn't have commands
    return [];
  }

  getAuxiliaryModel(): string | null {
    return null;
  }

  cleanup(): void {
    // No persistent resources to clean up
  }

  async rewind(_userMessageId: string, _assistantMessageId: string): Promise<ChatRewindResult> {
    return {
      canRewind: false,
      error: 'Hermes does not support rewind',
    };
  }

  setApprovalCallback(callback: ApprovalCallback | null): void {
    this.approvalCallback = callback;
  }

  setApprovalDismisser(dismisser: (() => void) | null): void {
    this.approvalDismisser = dismisser;
  }

  setAskUserQuestionCallback(callback: AskUserQuestionCallback | null): void {
    this.askUserQuestionCallback = callback;
  }

  setExitPlanModeCallback(callback: ExitPlanModeCallback | null): void {
    this.exitPlanModeCallback = callback;
  }

  setPermissionModeSyncCallback(callback: ((sdkMode: string) => void) | null): void {
    this.permissionModeSyncCallback = callback;
  }

  setSubagentHookProvider(getState: () => SubagentRuntimeState): void {
    this.subagentHookProvider = getState;
  }

  setAutoTurnCallback(callback: ((result: AutoTurnResult) => void) | null): void {
    this.autoTurnCallback = callback;
  }

  consumeTurnMetadata(): ChatTurnMetadata {
    const metadata = { ...this.turnMetadata };
    this.turnMetadata = {};
    return metadata;
  }

  buildSessionUpdates(_params: {
    conversation: { sessionId: string | null } | null;
    sessionInvalidated: boolean;
  }): SessionUpdateResult {
    return { updates: {} };
  }

  resolveSessionIdForFork(_conversation: { sessionId: string | null } | null): string | null {
    return this.sessionId;
  }

  // ---------------------------------------------------------------------------
  // Hermes-specific methods
  // ---------------------------------------------------------------------------

  /**
   * Build the prompt from the chat request.
   * Includes context like current note path and attachments.
   */
  private buildPrompt(request: ChatTurnRequest): string {
    let prompt = request.text;

    if (request.currentNotePath) {
      prompt = `[Current note: ${request.currentNotePath}]\n\n${prompt}`;
    }

    // Add attachment info if any
    if (request.images && request.images.length > 0) {
      const imageNames = request.images.map(img => img.name).join(', ');
      prompt = `[Attached images: ${imageNames}]\n\n${prompt}`;
    }

    return prompt;
  }

  /**
   * Call Hermes via WSL CLI.
   *
   * Uses `wsl hermes -z "message"` for oneshot execution.
   * Falls back to direct `hermes` if not in WSL context.
   */
  private async callHermes(prompt: string): Promise<string> {
    const escapedPrompt = this.escapeForShell(prompt);

    try {
      // Try WSL first (Windows -> WSL2 Hermes)
      const result = execSync(`wsl hermes -z "${escapedPrompt}"`, {
        encoding: 'utf-8',
        windowsHide: true,
        timeout: 300000, // 5 minute timeout
      });

      return result.trim();
    } catch (wslError) {
      // If WSL fails, try direct hermes (WSL context running this code)
      try {
        const result = execSync(`hermes -z "${escapedPrompt}"`, {
          encoding: 'utf-8',
          timeout: 300000,
        });
        return result.trim();
      } catch {
        // Both failed, report WSL error
        const errorMessage = wslError instanceof Error ? wslError.message : 'WSL hermes call failed';
        throw new Error(`Hermes call failed: ${errorMessage}`);
      }
    }
  }

  /**
   * Escape prompt for shell execution.
   * Handles quotes, backslashes, and newlines.
   */
  private escapeForShell(prompt: string): string {
    return prompt
      .replace(/\\/g, '\\\\')
      .replace(/"/g, '\\"')
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '\\r')
      .replace(/\t/g, '\\t');
  }
}

/**
 * Hermes provider capabilities.
 * Hermes is more limited than Claude - no plan mode, rewind, fork, or MCP.
 */
const HERMES_PROVIDER_CAPABILITIES: Readonly<ProviderCapabilities> = Object.freeze({
  providerId: HERMES_PROVIDER_ID,
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
