import { createContext, useContext } from 'react';

/** Shared so the hook can live outside the provider file (fast refresh). */
export const AuthContext = createContext(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth precisa estar dentro de <AuthProvider>');
  return context;
}
