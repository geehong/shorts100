// Next.js가 빌드 타임에 process.env를 주입하지만,
// @types/node 설치 전 타입 인식을 위해 최소한만 선언합니다.
declare namespace NodeJS {
  interface ProcessEnv {
    BACKEND_API_URL?: string;
    NEXT_PUBLIC_API_URL?: string;
    NODE_ENV: "development" | "production" | "test";
  }
}

declare let process: {
  env: NodeJS.ProcessEnv;
};
