import React, { useContext, createContext, useState, useEffect } from 'react';
import { listen, getLoggedIn, getUserInfo } from './auth';

interface UserContextValue {
  handle: string | null;
  loggedIn: boolean;
}

const UserContext = createContext<UserContextValue | null>(null);

interface Props {
  children: React.ReactNode;
}

function UserProvider({ children }: Props) {
  const [loggedIn, setLoggedIn] = useState(getLoggedIn());
  const [handle, setHandle] = useState(getUserInfo()?.handle);

  useEffect(() => {
    return listen((loggedIn) => {
      setLoggedIn(loggedIn);
      setHandle(getUserInfo()?.handle);
    });
  }, []);

  return (
    <UserContext.Provider value={{ handle: handle || null, loggedIn }}>
      {children}
    </UserContext.Provider>
  );
}

function useUser() {
  const userContext = useContext(UserContext);
  if (!userContext) {
    throw new Error('No user context found');
  }

  return userContext;
}

export { UserProvider, useUser };
