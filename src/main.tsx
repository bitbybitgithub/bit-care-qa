import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { Provider } from "react-redux";
import { store } from "./redux/store";
import { BrowserRouter } from "react-router-dom";
import { ThemeProviderWrapper } from "./theme";
import "./theme/token.css";
import "./index.css";
import { LoaderProvider } from "./context/LoaderContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <ThemeProviderWrapper>
          <QueryClientProvider client={queryClient}>
            <LoaderProvider>
              <App />
            </LoaderProvider>
          </QueryClientProvider>
        </ThemeProviderWrapper>
      </BrowserRouter>
    </Provider>
  </React.StrictMode>
);
