import type { Preview } from "@storybook/react-vite"
import React from "react"
import "../src/styles/base.css"
import "../src/styles/tokens.css"

const mobileDevices = {
  "iphone-se": {
    title: "iPhone SE",
    width: 375,
    height: 667,
  },
  "iphone-pro": {
    title: "iPhone Pro",
    width: 393,
    height: 852,
  },
  "iphone-promax": {
    title: "iPhone Pro Max",
    width: 430,
    height: 932,
  },
} as const

const preview: Preview = {
  globalTypes: {
    locale: {
      name: "Language",
      description: "Story language",
      defaultValue: "zh-CN",
      toolbar: {
        icon: "globe",
        items: [
          { value: "zh-CN", title: "中文" },
          { value: "en", title: "English" },
        ],
      },
    },
    themeName: {
      name: "Theme",
      description: "Blueprint UI theme",
      defaultValue: "together-blueprint",
      toolbar: {
        icon: "paintbrush",
        items: [
          { value: "together-blueprint", title: "Together Blueprint" },
          { value: "control-grid", title: "Control Grid" },
          { value: "signal-nocturne", title: "Signal Nocturne" },
          { value: "command-amber", title: "Command Amber" },
        ],
      },
    },
    platform: {
      name: "Platform",
      description: "Desktop or mobile shell",
      defaultValue: "desktop",
      toolbar: {
        icon: "browser",
        items: [
          { value: "desktop", title: "Desktop" },
          { value: "mobile", title: "Mobile" },
        ],
      },
    },
    mobileDevice: {
      name: "Device",
      description: "Mobile preview device",
      defaultValue: "iphone-pro",
      toolbar: {
        icon: "mobile",
        dynamicTitle: true,
        items: [
          { value: "iphone-se", title: "iPhone SE" },
          { value: "iphone-pro", title: "iPhone Pro" },
          { value: "iphone-promax", title: "iPhone Pro Max" },
        ],
      },
    },
  },
  decorators: [
    (Story, context) => {
      const selectedDevice =
        mobileDevices[
          context.globals.mobileDevice as keyof typeof mobileDevices
        ] ?? mobileDevices["iphone-pro"]
      const story = (
        <div
          data-bp-theme={context.globals.themeName}
          data-bp-locale={context.globals.locale}
          className="bp-story-root"
        >
          <Story />
        </div>
      )

      if (context.globals.platform !== "mobile") {
        return (
          <div className="bp-desktop-shell">
            <div className="bp-desktop-canvas">{story}</div>
          </div>
        )
      }

      return (
        <div className="bp-mobile-shell-stage">
          <div
            className="bp-mobile-shell"
            style={{ width: `${selectedDevice.width + 18}px` }}
          >
            <div className="bp-mobile-notch" />
            <div
              className="bp-mobile-screen"
              style={{
                width: `${selectedDevice.width}px`,
                minHeight: `${selectedDevice.height}px`,
              }}
            >
              {story}
            </div>
          </div>
        </div>
      )
    },
  ],
  parameters: {
    layout: "fullscreen",
    backgrounds: {
      default: "night-grid",
      values: [
        { name: "night-grid", value: "#07111f" },
        { name: "deep-slate", value: "#020617" },
      ],
    },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
  tags: ["autodocs"],
}

export default preview
