import React, { Suspense, lazy } from 'react';
import Callback from './callback';
import Home from './home';
import Compose from './compose';
import About from './about';
import Account from './account';
import NoRoute from './no-route';
import Terms from './terms';
import { UserProvider } from './user';
import Header from './header';
import Footer from './footer';
import CircleNotch from './circle-notch';
import Redirect from './redirect';
const Privacy = lazy(() => import('./privacy'));

function App() {
  const pathname =
    typeof window !== 'undefined' ? window.location.pathname : '/';

  return (
    <>
      <Header />
      <Suspense
        fallback={
          <div>
            <CircleNotch className="callback-spinner" />
            <h1 className="title center-text">Loading…</h1>
          </div>
        }
      >
        <main className="main container">
          {pathname === '/' ? (
            <Home key="home" />
          ) : pathname === '/callback' ? (
            <Callback key="callback" />
          ) : pathname === '/compose' ? (
            <Compose key="compose" />
          ) : pathname === '/about' ? (
            <About key="about" />
          ) : pathname === '/privacy' ? (
            <Privacy key="privacy" />
          ) : pathname === '/account' ? (
            <Account />
          ) : pathname === '/terms' ? (
            <Terms />
          ) : pathname === '/404' ? (
            <NoRoute />
          ) : (
            <Redirect to="/404" />
          )}
        </main>
      </Suspense>
      <Footer />
    </>
  );
}

export default () => (
  <UserProvider>
    <App />
  </UserProvider>
);
