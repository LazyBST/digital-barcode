import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import { FullScreenLoader } from "@/components/FullScreenLoader";

import { useAuth } from "./hooks";

export function RouteGuard({ children }) {
  const user = useAuth();
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  //   const [loading, setLoading] = useState(false);

  useEffect(() => {
    setAuthorized(user);
    authCheck(router.pathname);
  }, [user, router.pathname]);

  //   useEffect(() => {
  //     const setLoadingTrue = () => setLoading(true);
  //     const setLoadingFalse = () => setLoading(false);

  //     router.events.on("routeChangeStart", setLoadingTrue);
  //     router.events.on("routeChangeComplete", setLoadingFalse);
  //     return () => {
  //       router.events.off("routeChangeStart", setLoadingTrue);
  //       router.events.off("routeChangeComplete", setLoadingFalse);
  //     };
  //   }, []);

  function authCheck(url) {
    const publicPaths = ["/login"];
    const path = url.split("?")[0];

    if (user === undefined) {
      setAuthorized(undefined);
    } else if (!Boolean(user) && !publicPaths.includes(path)) {
      setAuthorized(true);
      router.push({
        pathname: "/login",
        query: { returnUrl: router.asPath },
      });
    } else if (user && publicPaths.includes(path)) {
      setAuthorized(true);
      router.push({
        pathname: "/",
      });
    } else {
      setAuthorized(true);
    }
  }

  if (authorized === undefined) return <FullScreenLoader />;

  return authorized && children;
}
