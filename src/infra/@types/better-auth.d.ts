declare module 'better-auth' {
  interface BetterAuthInstance {
    handler(request: Request): Promise<Response>;
  }

  interface BetterAuthOptions {
    trustedOrigins?: string[];
    database: {
      provider: string;
      url: string;
    };
  }

  export function betterAuth(options?: BetterAuthOptions): BetterAuthInstance;
}
