// theme/light-theme.ts
// Tema claro IMVOLT (AntD) — UI Concept 01 del prototipo interactivo sobre
// el Manual de Marca v1: fondo niebla/pálido, tarjetas blancas de radio 17,
// verde IMVOLT (#00D94B) en acciones primarias y verde de enlace #008E47
// (contraste AA para texto pequeño sobre blanco).

import type { ThemeConfig } from "antd";

const INTER =
  "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif";

export const lightTheme: ThemeConfig = {
  token: {
    colorPrimary: "#008E47",
    colorSuccess: "#008E47",
    colorWarning: "#BD7720",
    colorError: "#B4432E",
    colorInfo: "#008E47",
    colorBgBase: "#F5F8F6",
    colorBgLayout: "#F5F8F6",
    colorBgContainer: "#FFFFFF",
    colorBgElevated: "#FFFFFF",
    colorText: "#182922",
    colorTextSecondary: "#6E7E77",
    colorTextTertiary: "#8B9A93",
    colorTextQuaternary: "#A9B6B0",
    colorBorder: "#E4EBE8",
    colorBorderSecondary: "#EDF2EF",
    borderRadius: 11,
    borderRadiusLG: 17,
    borderRadiusSM: 9,
    fontFamily: INTER,
    fontSize: 13.5,
    fontSizeHeading1: 32,
    fontSizeHeading2: 20,
    fontSizeHeading3: 16,
    fontSizeHeading4: 14,
    fontSizeLG: 15,
    fontSizeSM: 12,
    controlHeight: 38,
    controlHeightSM: 30,
    boxShadow: "0 14px 42px rgba(13, 35, 26, 0.06)",
    boxShadowSecondary: "0 6px 20px rgba(13, 35, 26, 0.05)",
    wireframe: false,
  },
  components: {
    Layout: {
      headerBg: "#FFFFFF",
      bodyBg: "#F5F8F6",
      siderBg: "#101719",
    },
    Card: {
      borderRadiusLG: 17,
      headerBg: "transparent",
      paddingLG: 23,
    },
    Button: {
      primaryShadow: "0 9px 20px rgba(0, 217, 75, 0.12)",
      defaultShadow: "none",
      fontWeight: 650,
    },
    Input: {
      activeShadow: "0 0 0 3px #DCF8E5",
      hoverBorderColor: "#00C85A",
      activeBorderColor: "#00C85A",
      borderRadius: 10,
    },
    Table: {
      headerBg: "#F2F7F4",
      headerColor: "#80958A",
      rowHoverBg: "#F5FBF7",
      borderColor: "#EFF3F0",
      headerSplitColor: "transparent",
    },
    Tag: {
      borderRadiusSM: 99,
    },
  },
};
