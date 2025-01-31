"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConfigProvider, theme } from "antd";
import React from "react";
import { Toaster } from "./ui/toaster";

//This is the configuration for the antd library
const AntProvider = ({ children }) => {
  // Create a client
  const queryClient = new QueryClient();

  const { defaultAlgorithm, darkAlgorithm } = theme;
  return (
    <ConfigProvider
      theme={{
        algorithm: darkAlgorithm,
      }}
    >
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      <Toaster />
    </ConfigProvider>
  );
};

export default AntProvider;
