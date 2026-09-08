import { defineWombatailConfig } from 'babel-plugin-wombatail/runtime'

// Single source of truth: the Babel plugin reads themes/breakpoints from this
// file at build time, and defineWombatailConfig configures Unistyles at runtime.
const config = defineWombatailConfig({
  themes: {
    light: {
      colors: {
        background: '#F7F7F8',
        surface: '#FFFFFF',
        foreground: '#17171B',
        mutedForeground: '#6E6E78',
        primary: '#6750A4',
        onPrimary: '#FFFFFF',
        border: '#E4E4E7',
        danger: '#D92D20',
      },
    },
    dark: {
      colors: {
        background: '#101014',
        surface: '#18181D',
        foreground: '#F7F7F8',
        mutedForeground: '#A1A1AA',
        primary: '#D0BCFF',
        onPrimary: '#2B1748',
        border: '#303038',
        danger: '#FF716A',
      },
    },
  },
  breakpoints: { xs: 0, sm: 360, md: 768, lg: 1024, xl: 1280 },
  settings: { adaptiveThemes: true },
})

export default config

type WombatailThemes = (typeof config)['themes']
type WombatailBreakpoints = (typeof config)['breakpoints']

declare module 'react-native-unistyles' {
  export interface UnistylesThemes extends WombatailThemes {}
  export interface UnistylesBreakpoints extends WombatailBreakpoints {}
}
