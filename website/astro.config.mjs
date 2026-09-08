// @ts-check
import { defineConfig } from 'astro/config'
import starlight from '@astrojs/starlight'

// GitHub Pages project site: https://thanhtamv2t.github.io/wombatail
export default defineConfig({
  site: 'https://thanhtamv2t.github.io',
  base: '/wombatail',
  trailingSlash: 'always',
  integrations: [
    starlight({
      title: 'Wombatail',
      description:
        'Compile-time Tailwind-like className for React Native, powered by react-native-unistyles v3.',
      customCss: [
        '@fontsource-variable/fredoka',
        '@fontsource-variable/nunito-sans',
        './src/styles/wombatail.css',
      ],
      logo: {
        src: './src/assets/wordmark.png',
        alt: 'Wombatail',
        replacesTitle: true,
      },
      social: [
        {
          icon: 'github',
          label: 'GitHub',
          href: 'https://github.com/thanhtamv2t/wombatail',
        },
      ],
      editLink: {
        baseUrl: 'https://github.com/thanhtamv2t/wombatail/edit/main/website/',
      },
      sidebar: [
        { label: 'Getting started', slug: 'getting-started' },
        {
          label: 'Guides',
          items: [
            { label: 'Syntax', slug: 'guides/syntax' },
            { label: 'Theming', slug: 'guides/theming' },
            { label: 'Switching themes', slug: 'guides/theme-switching' },
            { label: 'Style precedence', slug: 'guides/style-precedence' },
            { label: 'Limitations', slug: 'guides/limitations' },
            { label: 'TypeScript', slug: 'guides/typescript' },
          ],
        },
        {
          label: 'Reference',
          items: [
            { label: 'Plugin options', slug: 'reference/options' },
            { label: 'CLI', slug: 'reference/cli' },
            { label: 'Supported utilities', slug: 'reference/supported' },
            { label: 'Compatibility contract', slug: 'reference/compatibility' },
            { label: 'Architecture', slug: 'reference/architecture' },
          ],
        },
      ],
    }),
  ],
})
