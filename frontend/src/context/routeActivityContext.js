import { createContext } from 'react';

// Shell subscribers (e.g. unread counts) remain active outside cached pages.
export const RouteActivityContext = createContext(true);
