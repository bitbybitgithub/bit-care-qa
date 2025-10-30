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

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <ThemeProviderWrapper>
          <LoaderProvider>
            <App />
          </LoaderProvider>
        </ThemeProviderWrapper>
      </BrowserRouter>
    </Provider>
  </React.StrictMode>
);
