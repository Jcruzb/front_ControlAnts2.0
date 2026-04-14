import { useCallback, useEffect, useMemo, useState } from "react";
import * as authApi from "../services/authApi";
import { AuthContext } from "./auth-context";

function isAuthenticatedResponse(data) {
  return Boolean(data?.authenticated && data?.user);
}

export function AuthProvider({ children }) {
  const [authState, setAuthState] = useState({
    initialized: false,
    authenticated: false,
    user: null,
    profile: null,
    family: null,
  });

  const applyAuthPayload = useCallback((payload) => {
    if (isAuthenticatedResponse(payload)) {
      setAuthState({
        initialized: true,
        authenticated: true,
        user: payload.user,
        profile: payload.profile ?? null,
        family: payload.family ?? null,
      });
      return payload;
    }

    setAuthState({
      initialized: true,
      authenticated: false,
      user: null,
      profile: null,
      family: null,
    });
    return payload;
  }, []);

  const refreshSession = useCallback(async () => {
    try {
      await authApi.getCsrf();
      const data = await authApi.me();
      return applyAuthPayload(data);
    } catch (error) {
      if (error?.response?.status === 401 || error?.response?.status === 403) {
        applyAuthPayload(null);
        return null;
      }

      applyAuthPayload(null);
      throw error;
    }
  }, [applyAuthPayload]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      refreshSession().catch((error) => {
        console.error("Auth bootstrap failed", error);
      });
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [refreshSession]);

  const register = useCallback(
    async (payload) => {
      const data = await authApi.register(payload);
      return applyAuthPayload(data);
    },
    [applyAuthPayload]
  );

  const login = useCallback(
    async (payload) => {
      const data = await authApi.login(payload);
      return applyAuthPayload(data);
    },
    [applyAuthPayload]
  );

  const logout = useCallback(async () => {
    try {
      const data = await authApi.logout();
      applyAuthPayload(data);
      return data;
    } catch (error) {
      if (error?.response?.status === 401 || error?.response?.status === 403) {
        applyAuthPayload(null);
        return { authenticated: false };
      }
      throw error;
    }
  }, [applyAuthPayload]);

  const value = useMemo(
    () => ({
      ...authState,
      register,
      login,
      logout,
      refreshSession,
    }),
    [authState, login, logout, refreshSession, register]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
