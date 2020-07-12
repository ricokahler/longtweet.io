import React, { Suspense, lazy } from 'react';
import { Router, useRouter, Redirect } from './router';
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
const Privacy = lazy(() => import('./privacy'));

function App() {
  const { path } = useRouter();

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
          {path === '/' ? (
            <Home key="home" />
          ) : path === '/callback' ? (
            <Callback key="callback" />
          ) : path === '/compose' ? (
            <Compose key="compose" />
          ) : path === '/about' ? (
            <About key="about" />
          ) : path === '/privacy' ? (
            <Privacy key="privacy" />
          ) : path === '/account' ? (
            <Account />
          ) : path === '/terms' ? (
            <Terms />
          ) : path === '/404' ? (
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
    <Router>
      <App />
    </Router>
  </UserProvider>
);
