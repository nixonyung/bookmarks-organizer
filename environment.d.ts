declare global {
  namespace NodeJS {
    interface ProcessEnv {
      //   MY_API_KEY: string;
      //   NODE_ENV: 'development' | 'production' | 'test';
      //   PORT?: string; // Optional variables can use '?' or be typed as string | undefined
      LINE_FILTERS?: string;
      ACTIONS?: string;
    }
  }
}

export {};
