import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  useRef,
} from 'react';

interface RouterContextValue {
  path: string;
  push: (url: string) => void;
}
const RouterContext = createContext<RouterContextValue | null>(null);

interface Props {
  children: React.ReactNode;
}

function Router({ children }: Props) {
  const [path, setPath] = useState(
    typeof window !== 'undefined' ? window.location.pathname : '/',
  );
  const lockedRef = useRef(false);

  const push = (url: string) => {
    if (lockedRef.current) {
      return;
    }

    history.pushState(null, '', url);
    setPath(url);
  };

  useEffect(() => {
    window.addEventListener('popstate', () => {
      // hard-reload so locks work correctly
      window.location.href = location.pathname;
    });
  }, []);

  return (
    <RouterContext.Provider value={{ path, push }}>
      {children}
    </RouterContext.Provider>
  );
}

function useRouter() {
  return useContext(RouterContext)!;
}

function Redirect({ to }: { to: string }) {
  const { push } = useRouter();

  useEffect(() => {
    push(to);
  }, []);

  return null;
}

export { Router, Redirect, useRouter };
