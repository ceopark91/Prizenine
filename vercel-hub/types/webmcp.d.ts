export {};

declare global {
  interface ModelContext {
    registerTool(tool: {
      name: string;
      title: string;
      description: string;
      inputSchema: Record<string, unknown>;
      annotations?: Record<string, unknown>;
      execute(input: unknown): Promise<unknown>;
    }, options?: { signal?: AbortSignal }): Promise<void>;
  }

  interface Document {
    modelContext?: ModelContext;
  }
}
