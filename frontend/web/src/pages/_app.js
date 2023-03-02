import Head from "next/head";
import "@/styles/globals.css";
import createCache from "@emotion/cache";
import { CacheProvider } from "@emotion/react";

import { ThemeConfig } from "../theme";
import { CssBaseline } from "@mui/material";
import { initAWSAmplify } from "@/utils";
import { RouteGuard } from "@/utils/RouteGuard";

function createEmotionCache() {
  return createCache({ key: "css", prepend: true });
}

initAWSAmplify();

// Client-side cache, shared for the whole session of the user in the browser.
const clientSideEmotionCache = createEmotionCache();

export default function App({
  Component,
  pageProps,
  emotionCache = clientSideEmotionCache,
}) {
  const getLayout = Component.getLayout || ((page) => page);

  return (
    <CacheProvider value={emotionCache}>
      <Head>
        <meta name="viewport" content="initial-scale=1, width=device-width" />
      </Head>
      <ThemeConfig>
        <CssBaseline />
        <RouteGuard>{getLayout(<Component {...pageProps} />)}</RouteGuard>
      </ThemeConfig>
    </CacheProvider>
  );
}
