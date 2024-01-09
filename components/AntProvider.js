"use client";

import { ConfigProvider, theme } from "antd";
import React from "react";

const AntProvider = ({ children }) => {
  const { defaultAlgorithm, darkAlgorithm } = theme;
  return (
    <ConfigProvider
      theme={{
        algorithm: darkAlgorithm,
      }}
    >
      {children}
    </ConfigProvider>
  );
};

export default AntProvider;
