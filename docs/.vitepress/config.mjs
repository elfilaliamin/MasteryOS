import { defineConfig } from 'vitepress';

export default defineConfig({
  title: 'MasteryOS',
  description: 'Production-grade Full-Stack Productivity, Gamification & Workflow Management Platform',
  base: '/Docs/',
  lang: 'en-US',
  lastUpdated: false,
  cleanUrls: true,

  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/Docs/favicon.svg' }],
    ['meta', { name: 'theme-color', content: '#0d8a72' }],
    ['meta', { name: 'author', content: 'elfilaliamin' }]
  ],

  themeConfig: {
    siteTitle: 'MasteryOS Docs',
    nav: [
      { text: 'Guide', link: '/getting-started/quickstart' },
      { text: 'Architecture', link: '/architecture/overview' },
      { text: 'Database', link: '/database/schema' },
      { text: 'API Reference', link: '/api/overview' },
      { text: 'Frontend', link: '/frontend/pages-components' },
      { text: 'Security', link: '/security/hardening' }
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/elfilaliamin/MasteryOS' }
    ],

    sidebar: {
      '/': [
        {
          text: 'Getting Started',
          collapsed: false,
          items: [
            { text: 'Quickstart & Installation', link: '/getting-started/quickstart' },
            { text: 'Environment Configuration', link: '/getting-started/configuration' }
          ]
        },
        {
          text: 'System Architecture',
          collapsed: false,
          items: [
            { text: 'Architecture Overview', link: '/architecture/overview' },
            { text: 'Docker Container Stack', link: '/architecture/docker-stack' },
            { text: 'Data Flow & Client Cache', link: '/architecture/data-flow' }
          ]
        },
        {
          text: 'Database & Storage',
          collapsed: false,
          items: [
            { text: 'PostgreSQL Relational Schema', link: '/database/schema' },
            { text: 'Persistence & Migrations', link: '/database/migrations' }
          ]
        },
        {
          text: 'REST API Reference',
          collapsed: false,
          items: [
            { text: 'API Conventions & Headers', link: '/api/overview' },
            { text: 'Authentication & Session', link: '/api/auth' },
            { text: 'Tasks & Categories', link: '/api/tasks' },
            { text: 'Strategic Goals', link: '/api/goals' },
            { text: 'Courses & Lessons', link: '/api/courses' },
            { text: 'Habits & Streaks Matrix', link: '/api/habits' },
            { text: 'File Upload & Analytics', link: '/api/upload-analytics' }
          ]
        },
        {
          text: 'Frontend & Gamification',
          collapsed: false,
          items: [
            { text: 'Pages & Design System', link: '/frontend/pages-components' },
            { text: 'Gamification Engine (XP & Ranks)', link: '/frontend/gamification' },
            { text: 'State Management (React Query)', link: '/frontend/state-management' }
          ]
        },
        {
          text: 'Security & Deployment',
          collapsed: false,
          items: [
            { text: 'Security Hardening & Multi-Tenant', link: '/security/hardening' },
            { text: 'Production Deployment & Cloudflare', link: '/deployment/production' }
          ]
        }
      ]
    },

    search: {
      provider: 'local'
    },

    footer: {
      message: 'MasteryOS • Distributed Productivity & Gamification Engine',
      copyright: 'Copyright © 2026 elfilaliamin/MasteryOS. Open source.'
    },

    editLink: {
      pattern: 'https://github.com/elfilaliamin/MasteryOS/edit/main/docs/:path',
      text: 'Edit this page on GitHub'
    }
  }
});
