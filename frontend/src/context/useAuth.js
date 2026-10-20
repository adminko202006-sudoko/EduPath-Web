import { useContext } from 'react';

import { AuthContext } from './authContextInstance';

/**
 * Kept in its own module (next to the provider in `AuthContext.jsx`) so each
 * file exports a single kind of value and React Fast Refresh keeps working.
 */
export const useAuth = () => {
  return useContext(AuthContext);
};
