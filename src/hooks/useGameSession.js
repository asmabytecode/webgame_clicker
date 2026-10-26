import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "../lib/api.js";
import { getActionFeedback } from "../lib/actionFeedback.js";

export function useGameSession() {
  const [account, setAccount] = useState(null);
  const [state, setState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [toast, setToast] = useState("");
  const requestNumber = useRef(0);
  const appliedNumber = useRef(0);
  const pendingActions = useRef(0);
  const toastTimer = useRef(null);

  const acceptAuth = useCallback((result) => {
    setAccount(result.user);
    setState(result.state);
    setPageError("");
  }, []);

  useEffect(() => {
    let mounted = true;

    api("/api/auth/me")
      .then((result) => {
        if (mounted) acceptAuth(result);
      })
      .catch((error) => {
        if (mounted && error.status !== 401) setPageError(error.message);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [acceptAuth]);

  const refreshState = useCallback(async () => {
    if (pendingActions.current > 0) return;
    const number = ++requestNumber.current;

    try {
      const result = await api("/api/auth/me");
      if (number >= appliedNumber.current) {
        appliedNumber.current = number;
        setAccount(result.user);
        setState(result.state);
        setPageError("");
      }
    } catch (error) {
      if (error.status === 401) {
        setAccount(null);
        setState(null);
      } else {
        setPageError(error.message);
      }
    }
  }, []);

  useEffect(() => {
    if (!account) return undefined;
    const timer = window.setInterval(refreshState, 3000);
    return () => window.clearInterval(timer);
  }, [account, refreshState]);

  const notify = useCallback((message) => {
    if (!message) return;
    setToast(message);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(""), 2200);
  }, []);

  useEffect(
    () => () => {
      window.clearTimeout(toastTimer.current);
    },
    [],
  );

  const performAction = useCallback(
    async (type, id) => {
      const number = ++requestNumber.current;
      pendingActions.current++;

      try {
        const result = await api("/api/game/action", {
          method: "POST",
          body: JSON.stringify({ type, id }),
        });
        if (number >= appliedNumber.current) {
          appliedNumber.current = number;
          setState(result.state);
          setPageError("");
        }
        notify(getActionFeedback(type, result));
      } catch (error) {
        if (error.status === 401) {
          setAccount(null);
          setState(null);
        } else {
          notify(error.message);
        }
      } finally {
        pendingActions.current--;
      }
    },
    [notify],
  );

  const logout = useCallback(async () => {
    try {
      await api("/api/auth/logout", { method: "POST" });
      setAccount(null);
      setState(null);
      setPageError("");
    } catch (error) {
      notify(error.message);
    }
  }, [notify]);

  return {
    account,
    state,
    loading,
    pageError,
    toast,
    acceptAuth,
    performAction,
    logout,
  };
}
