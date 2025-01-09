import "@mantine/core/styles.css";
import Head from "next/head";
import {MantineProvider, Notification} from "@mantine/core";
import { theme } from "../../theme.js"
import {createContext} from "react";
import {QueryClient, QueryClientProvider} from "@tanstack/react-query";
import {ReactQueryDevtools} from '@tanstack/react-query-devtools'
import {SessionProvider} from "next-auth/react";
import {Notifications} from "@mantine/notifications";
import PermissionProvider from "../components/auth/permissionProvider.jsx";
import Layout from "../components/layout/index.jsx";

export const queryClient = new QueryClient()
export const AccessControlContext = createContext(null);


export default function App({ Component, pageProps }) {
  return (
      <SessionProvider session={ pageProps.session}>
          <QueryClientProvider client={queryClient}>
              <ReactQueryDevtools initialIsOpen={false}/>
              <MantineProvider theme={theme}>
                  <Notifications/>
                  <Head>
                      <title>Mantine Template</title>
                      <meta
                          name="viewport"
                          content="minimum-scale=1, initial-scale=1, width=device-width, user-scalable=no"
                      />
                      <link rel="shortcut icon" href="/favicon.svg" />
                  </Head>
                  <PermissionProvider>
                      <Layout>
                          <Component {...pageProps} />
                      </Layout>
                  </PermissionProvider>
              </MantineProvider>
          </QueryClientProvider>
      </SessionProvider>
  );
}
