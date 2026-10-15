// theme/dark-theme.ts
// Tema oscuro IMVOLT (AntD) — panel lateral carbón y verde como acento vivo.

import type { ThemeConfig } from "antd";
import { brand } from "./brand";

const t = brand.dark;

export const darkTheme: ThemeConfig = {
  token: {
    colorPrimary: t.primary,
    colorSuccess: t.success,
    colorWarning: t.warning,
    colorError: t.error,
    colorInfo: t.primary,
    colorBgBase: t.bg,
    colorBgLayout: t.bg,
    colorBgContainer: t.bgContainer,
    colorBgElevated: t.bgElevated,
    colorText: t.text,
    colorTextSecondary: t.textSecondary,
    colorTextTertiary: t.textTertiary,
    colorTextQuaternary: "#5F6F6D",
    colorBorder: t.border,
    colorBorderSecondary: t.borderSecondary,
    borderRadius: 10,
    fontFamily:
      "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif",
    fontSize: 15,
    fontSizeHeading1: 40,
    fontSizeHeading2: 28,
    fontSizeHeading3: 22,
    fontSizeHeading4: 18,
    fontSizeHeading5: 16,
    colorLink: t.link,
    colorLinkHover: t.linkHover,
    colorLinkActive: t.primary,
    controlHeight: 38,
    controlHeightSM: 30,
    controlHeightLG: 46,
    marginXS: 8,
    marginSM: 12,
    margin: 16,
    marginMD: 20,
    marginLG: 24,
    marginXL: 32,
    padding: 16,
    paddingSM: 12,
    paddingXS: 8,
    paddingXXS: 4,
    boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.4), 0 1px 2px -1px rgba(0, 0, 0, 0.3)",
    boxShadowSecondary: "0 4px 6px -1px rgba(0, 0, 0, 0.5), 0 2px 4px -2px rgba(0, 0, 0, 0.4)",
  },
  components: {
    Layout: {
      headerBg: t.headerBg,
      siderBg: t.siderBg,
      bodyBg: t.bodyBg,
      headerHeight: 64,
      headerPadding: "0 24px",
    },
    Menu: {
      darkItemBg: t.siderBg,
      darkSubMenuItemBg: t.siderBg,
      darkItemSelectedBg: t.siderItemSelectedBg,
      darkItemColor: "rgba(242, 247, 244, 0.68)",
      darkItemSelectedColor: brand.verdeImvolt,
      darkItemHoverColor: "#FFFFFF",
      darkItemHoverBg: "rgba(255, 255, 255, 0.06)",
      itemHeight: 42,
      itemMarginInline: 8,
      itemPaddingInline: 16,
      iconSize: 16,
    },
    Card: {
      headerBg: "transparent",
      paddingLG: 24,
    },
    Table: {
      headerBg: t.tableHeaderBg,
      headerColor: t.text,
      rowHoverBg: t.tableRowHoverBg,
      borderColor: t.borderSecondary,
    },
    Button: {
      primaryShadow: "none",
      defaultShadow: "0 2px 0 rgba(0, 0, 0, 0.2)",
    },
    Input: {
      activeShadow: `0 0 0 2px ${brand.verdeImvolt}29`,
    },
    Breadcrumb: {
      separatorColor: t.textTertiary,
      itemColor: t.textTertiary,
      lastItemColor: t.text,
    },
  },
};
