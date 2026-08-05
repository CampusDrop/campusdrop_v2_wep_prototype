"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { getApiStatus } from "../lib/api/status";
import styles from "./page.module.css";

type ConnectionState = "loading" | "connected" | "unavailable";

export default function ApiStatusPage() {
  const [connectionState, setConnectionState] = useState<ConnectionState>("loading");
  const activeRequest = useRef<AbortController | null>(null);

  const checkConnection = useCallback(async () => {
    activeRequest.current?.abort();
    const controller = new AbortController();
    activeRequest.current = controller;

    try {
      await getApiStatus(controller.signal);
      if (!controller.signal.aborted) {
        setConnectionState("connected");
      }
    } catch {
      if (!controller.signal.aborted) {
        setConnectionState("unavailable");
      }
    }
  }, []);

  useEffect(() => {
    const initialCheck = window.setTimeout(() => {
      void checkConnection();
    }, 0);

    return () => {
      window.clearTimeout(initialCheck);
      activeRequest.current?.abort();
    };
  }, [checkConnection]);

  const retryConnection = () => {
    setConnectionState("loading");
    void checkConnection();
  };

  const statusText =
    connectionState === "connected"
      ? "백엔드 연결됨"
      : connectionState === "unavailable"
        ? "백엔드에 연결할 수 없음"
        : "백엔드 연결 상태를 확인하는 중";

  return (
    <main className={styles.page}>
      <section className={styles.card} aria-labelledby="api-status-title">
        <p className={styles.eyebrow}>CampusDrop development</p>
        <h1 className={styles.title} id="api-status-title">백엔드 상태</h1>
        <p className={styles.status} aria-live="polite" role="status">
          {statusText}
        </p>
        <button
          className={styles.retry}
          disabled={connectionState === "loading"}
          onClick={retryConnection}
          type="button"
        >
          다시 확인
        </button>
      </section>
    </main>
  );
}
