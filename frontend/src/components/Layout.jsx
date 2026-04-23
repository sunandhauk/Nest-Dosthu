import React, { useEffect } from "react";
import { useLocation } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";
import ScrollProgress from "./ScrollProgress";
import ErrorBoundary from "./ErrorBoundary";
import ScrollToTop from "./ScrollToTop";

const Layout = ({ children }) => {
  const location = useLocation();

  useEffect(() => {
    const savedPosition = sessionStorage.getItem(`scroll_${location.key}`);
    if (savedPosition) {
      window.scrollTo(0, parseInt(savedPosition, 10));
      sessionStorage.removeItem(`scroll_${location.key}`);
    } else {
      window.scrollTo(0, 0);
    }
  }, [location.key, location.pathname]);

  useEffect(() => {
    const handleScroll = () => {
      sessionStorage.setItem(`scroll_${location.key}`, window.pageYOffset.toString());
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [location.key]);

  return (
    <ErrorBoundary>
      <div className="theme-shell flex min-h-screen flex-col transition-colors duration-300">
        <ScrollProgress />
        <Navbar />
        <main className="flex-grow">
          <ErrorBoundary>{children}</ErrorBoundary>
        </main>
        <Footer />
        <ScrollToTop />
      </div>
    </ErrorBoundary>
  );
};

export default Layout;
