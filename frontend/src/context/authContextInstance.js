import { createContext } from 'react';

/**
 * The auth context itself lives in its own module so that
 * `AuthContext.jsx` (the provider) and `useAuth.js` (the hook) can each
 * export a single kind of value — React Fast Refresh keeps working that way
 * (`react-refresh/only-export-components`).
 */
const AuthContext = createContext();

export { AuthContext };
