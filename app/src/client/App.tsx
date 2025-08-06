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
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";

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
    () => ["/login", "/signup", "/template_signer"],
    []
  );

  const shouldDisplayAppNavBar = useMemo(() => {
    return !noNavRoutes.some((route) => location.pathname.startsWith(route));
  }, [location.pathname]);

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
    <DndProvider backend={HTML5Backend}>
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
    </DndProvider>
  );
}
