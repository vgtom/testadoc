import "./Main.css";
import NavBar from "./components/NavBar/NavBar";
import CookieConsentBanner from "./components/cookie-consent/Banner";
import { appNavigationItems } from "./components/NavBar/contentSections";
import { landingPageNavigationItems } from "../landing-page/contentSections";
import { useMemo, useEffect } from "react";
import { routes } from "wasp/client/router";
import { Outlet, useLocation } from "react-router-dom";
import { useAuth } from "wasp/client/auth";
import { useIsLandingPage } from "./hooks/useIsLandingPage";

/**
 * use this component to wrap all child components
 * this is useful for templates, themes, and context
 */
export default function App() {
  const location = useLocation();
  const { data: user } = useAuth();
  const isLandingPage = useIsLandingPage();
  const navigationItems = isLandingPage
    ? landingPageNavigationItems
    : appNavigationItems;

  const noNavRoutes = useMemo(
    () => [routes.LoginRoute.build(), routes.SignupRoute.build()],
    []
  );

  const shouldDisplayAppNavBar = useMemo(() => {
    return !noNavRoutes.includes(location.pathname);
  }, [location]);

  const isAdminDashboard = useMemo(() => {
    return location.pathname.startsWith("/admin");
  }, [location]);


  useEffect(() => {
    if (location.hash) {
      const id = location.hash.replace("#", "");
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView();
      }
    }
  }, [location]);

  return (
    <>
      <div className="min-h-screen dark:text-white dark:bg-boxdark-2">
        {isAdminDashboard ? (
          <Outlet />
        ) : (
          <>
            {shouldDisplayAppNavBar && (
              <NavBar navigationItems={navigationItems} />
            )}
            <div>
              <Outlet />
            </div>
          </>
        )}
      </div>
      <CookieConsentBanner />
    </>
  );
}
