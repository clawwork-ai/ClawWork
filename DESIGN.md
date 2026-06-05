---
version: alpha
name: ClawWork Operator Console
description: A dense local-first desktop workspace for OpenClaw tasks, sessions, messages, artifacts, and teams.
colors:
  primary: '#13131C'
  secondary: '#1A1A25'
  tertiary: '#8088FB'
  neutral: '#FBFAF7'
  elevated: '#1F1F2C'
  hover: '#292936'
  light-page: '#F4F3EF'
  light-elevated: '#FFFFFF'
  light-hover: '#E9E8E2'
  light-accent: '#5860EA'
  legacy-green: '#19E31D'
  text-primary: '#F1F1F8'
  text-secondary: '#B0B0BF'
  text-primary-light: '#17171C'
  text-secondary-light: '#3A3A42'
  text-muted-light: '#6E6E7A'
  danger: '#F07079'
  warning: '#E6B35A'
  info: '#6AA9ED'
typography:
  page-title:
    fontFamily: Inter Variable
    fontSize: 24px
    fontWeight: 600
    lineHeight: 32px
    letterSpacing: -0.02em
  dialog-title:
    fontFamily: Inter Variable
    fontSize: 20px
    fontWeight: 600
    lineHeight: 28px
    letterSpacing: -0.02em
  section-title:
    fontFamily: Inter Variable
    fontSize: 16px
    fontWeight: 600
    lineHeight: 24px
    letterSpacing: -0.02em
  label:
    fontFamily: Inter Variable
    fontSize: 14px
    fontWeight: 500
    lineHeight: 20px
    letterSpacing: -0.011em
  body:
    fontFamily: Inter Variable
    fontSize: 14px
    fontWeight: 420
    lineHeight: 20px
    letterSpacing: -0.011em
  support:
    fontFamily: Inter Variable
    fontSize: 13px
    fontWeight: 420
    lineHeight: 18px
    letterSpacing: -0.011em
  meta:
    fontFamily: Inter Variable
    fontSize: 11px
    fontWeight: 500
    lineHeight: 16px
    letterSpacing: 0.08em
  badge:
    fontFamily: Inter Variable
    fontSize: 11px
    fontWeight: 600
    lineHeight: 16px
    letterSpacing: 0.08em
  code:
    fontFamily: JetBrains Mono Variable
    fontSize: 13px
    fontWeight: 400
    lineHeight: 18px
    letterSpacing: -0.011em
rounded:
  xs: 3px
  sm: 4px
  md: 6px
  lg: 8px
  xl: 12px
  input: 24px
  full: 999px
spacing:
  hairline: 1px
  xs: 4px
  sm: 8px
  md: 12px
  lg: 16px
  xl: 20px
  panel: 16px
  toolbar-height: 44px
  control-sm: 32px
  control: 36px
  control-lg: 40px
  avatar: 32px
components:
  app-shell:
    backgroundColor: '{colors.primary}'
    textColor: '{colors.text-primary}'
    typography: '{typography.body}'
  left-nav:
    backgroundColor: '{colors.secondary}'
    textColor: '{colors.text-secondary}'
    typography: '{typography.label}'
    width: 260px
  main-area:
    backgroundColor: '{colors.primary}'
    textColor: '{colors.text-primary}'
    typography: '{typography.body}'
  surface-card:
    backgroundColor: '{colors.secondary}'
    textColor: '{colors.text-primary}'
    rounded: '{rounded.xl}'
    padding: '{spacing.lg}'
  surface-elevated:
    backgroundColor: '{colors.elevated}'
    textColor: '{colors.text-primary}'
    rounded: '{rounded.xl}'
    padding: '{spacing.lg}'
  nav-hover:
    backgroundColor: '{colors.hover}'
    textColor: '{colors.text-secondary}'
    typography: '{typography.label}'
    rounded: '{rounded.md}'
    height: '{spacing.control}'
  button-primary:
    backgroundColor: '{colors.tertiary}'
    textColor: '{colors.primary}'
    typography: '{typography.label}'
    rounded: '{rounded.lg}'
    height: '{spacing.control}'
    padding: '{spacing.md}'
  button-soft:
    backgroundColor: '{colors.elevated}'
    textColor: '{colors.tertiary}'
    typography: '{typography.label}'
    rounded: '{rounded.lg}'
    height: '{spacing.control-sm}'
    padding: '{spacing.md}'
  input-command:
    backgroundColor: '{colors.elevated}'
    textColor: '{colors.text-primary}'
    typography: '{typography.body}'
    rounded: '{rounded.input}'
    padding: '{spacing.xl}'
  status-badge:
    backgroundColor: '{colors.hover}'
    textColor: '{colors.text-secondary}'
    typography: '{typography.badge}'
    rounded: '{rounded.sm}'
    padding: '{spacing.xs}'
  live-signal:
    backgroundColor: '{colors.primary}'
    textColor: '{colors.legacy-green}'
    typography: '{typography.badge}'
    rounded: '{rounded.full}'
    padding: '{spacing.xs}'
  danger-status:
    backgroundColor: '{colors.danger}'
    textColor: '{colors.primary}'
    typography: '{typography.badge}'
    rounded: '{rounded.sm}'
    padding: '{spacing.xs}'
  warning-status:
    backgroundColor: '{colors.warning}'
    textColor: '{colors.primary}'
    typography: '{typography.badge}'
    rounded: '{rounded.sm}'
    padding: '{spacing.xs}'
  info-status:
    backgroundColor: '{colors.info}'
    textColor: '{colors.primary}'
    typography: '{typography.badge}'
    rounded: '{rounded.sm}'
    padding: '{spacing.xs}'
  light-shell:
    backgroundColor: '{colors.light-page}'
    textColor: '{colors.text-primary-light}'
    typography: '{typography.body}'
  light-panel:
    backgroundColor: '{colors.neutral}'
    textColor: '{colors.text-secondary-light}'
    typography: '{typography.body}'
    rounded: '{rounded.xl}'
    padding: '{spacing.lg}'
  light-elevated:
    backgroundColor: '{colors.light-elevated}'
    textColor: '{colors.text-primary-light}'
    rounded: '{rounded.xl}'
    padding: '{spacing.lg}'
  light-hover:
    backgroundColor: '{colors.light-hover}'
    textColor: '{colors.text-secondary-light}'
    typography: '{typography.label}'
    rounded: '{rounded.md}'
  light-muted-label:
    backgroundColor: '{colors.light-page}'
    textColor: '{colors.text-muted-light}'
    typography: '{typography.support}'
    rounded: '{rounded.md}'
  light-button-primary:
    backgroundColor: '{colors.light-accent}'
    textColor: '{colors.neutral}'
    typography: '{typography.label}'
    rounded: '{rounded.lg}'
    height: '{spacing.control}'
    padding: '{spacing.md}'
---

## Overview

ClawWork is an operator console, not a marketing surface. It should feel like a quiet desktop control room for parallel OpenClaw work: persistent Tasks in the left rail, the active Message stream in the center, and Task-scoped operational context around it.

The visual reference is a local-first agent workspace with terminal-adjacent density and macOS desktop restraint. The product can show Teams, usage, tool calls, artifacts, scheduled Tasks, and search without turning into a dashboard collage. Hierarchy comes from panels, muted text, exact spacing, and sparse accent, not from decorative illustration.

Dark mode is the primary expression. Light mode keeps the same geometry and contrast relationships but swaps to warm paper surfaces. Both modes should preserve the same calm, work-focused rhythm.

## Colors

The palette is built from near-black violet surfaces, warm light surfaces, and a single violet-blue accent. Older screenshots and keynote assets also show a bright green operational accent for Team selection, running indicators, and selected command rows; treat it as a narrow live-state signal, not as a second brand color.

- **Primary** {colors.primary} is the dark application floor.
- **Secondary** {colors.secondary} is used for persistent rails and standard dark surfaces.
- **Elevated** {colors.elevated} is reserved for inputs, popovers, dialogs, and surfaces that sit above the page.
- **Tertiary** {colors.tertiary} is the primary action, focus, selected, and link color in the desktop renderer.
- **Legacy green** {colors.legacy-green} is a narrow operational signal for active Team mode, command focus, and running-state meters.
- **Text primary** is high-contrast but slightly softened; avoid pure white or pure black.
- **Muted text** carries timestamps, inactive navigation, placeholders, and secondary metadata.
- **Danger, warning, and info** are semantic status colors only.

In application code, all UI colors should come through CSS variables. Do not introduce raw feature-level hex values in renderer components.

## Typography

ClawWork uses Inter Variable for interface text and JetBrains Mono Variable for inline code, command data, token counts, paths, IDs, and compact technical metadata.

Type is intentionally modest. Page titles are only 24px; section titles are 16px; most working UI text sits at 14px or 13px. The product should read like a desktop tool that expects repeated use, not a landing page trying to impress a first-time visitor.

- **Page title** {typography.page-title}: top-level screens and empty-state headings.
- **Dialog title** {typography.dialog-title}: modal and command-palette headings.
- **Section title** {typography.section-title}: panel headers and view headers.
- **Label** {typography.label}: controls, navigation, task rows, and buttons.
- **Body** {typography.body}: message UI, descriptions, table cells, and form content.
- **Support** {typography.support}: helper text and secondary labels.
- **Meta** {typography.meta}: uppercase chrome, shortcuts, counts, and table metadata.
- **Code** {typography.code}: code blocks, paths, model IDs, session keys, and numeric telemetry.

Use tight but readable tracking for Inter. Uppercase metadata may use wide tracking. Do not use display fonts, decorative serif faces, or oversized hero typography inside the application.

## Layout

The default desktop shape is a three-panel workspace: left navigation, central work area, and optional right context panel. The left rail is persistent and task-first. The center owns the active Task, file browser, Teams, cron, dashboard, or setup view. The right panel appears only when it adds Task-scoped context.

Use fixed desktop affordances where stability matters: a 44px toolbar, 32-40px controls, 32px avatars, 260px left navigation, and dense list rows. The message composer can be visually larger, but it should still behave as a tool surface with predictable controls and no marketing copy.

Spacing follows a small 4px-derived scale. Prefer 8px, 12px, 16px, and 20px increments. Avoid ornamental white space in operational screens; empty states can breathe, but task lists, command palettes, settings, and artifact views should be optimized for scanning.

## Elevation & Depth

Depth is real but restrained. Standard surfaces use subtle borders and low shadows. Popovers, dialogs, command palettes, and the message composer may use heavier elevation plus a focused glow.

The design allows glass-like surfaces, but they should remain legible and structural. A blurred or translucent surface must still read as a working panel. Do not use glass as decoration.

Focus states use an accent ring plus diffuse glow. Running tool states can pulse, but the animation should stay mechanical and low amplitude. Elevation should never make the UI feel like stacked marketing cards.

Motion is fast: 100ms for immediate feedback, 150ms for normal control transitions, 200ms for panel/list movement, and 300ms as the slow ceiling for ordinary UI. Respect reduced motion by collapsing transforms and nonessential movement.

## Shapes

ClawWork uses slightly rounded desktop geometry. Small badges and status tags use 3-4px radius. Buttons and compact controls use 8px. Cards and framed sections use 12px. The command composer can use a large 24px radius because it is a primary input surface, not a generic card.

Do not increase rounding globally to make the UI feel friendlier. The product should remain precise, dense, and operator-grade.

## Components

The component system is built around semantic surfaces and Radix/shadcn-style primitives.

- **Left navigation** is a durable task switcher. It should show search, primary navigation entries, grouped Tasks, status markers, and bottom system actions without changing modes unexpectedly.
- **Main area** is the work canvas. It should avoid nested cards and should let the active Task, file browser, Team flow, or dashboard own the available space.
- **Command palette** is a floating operational search surface. It uses strong focus glow, uppercase section labels, direct rows, and visible keyboard affordances.
- **Message composer** is the dominant action surface at the bottom of active work. It should expose attachment, model, thinking, voice, and send controls without crowding the text entry.
- **Tool call cards** are compact operational records. They should reveal status first, then details on expansion.
- **Status tags** are small uppercase badges. Use them for state, not decoration.
- **Settings and panels** should use dense rows, toggles, segmented controls, and restrained section cards.

Icons come from lucide-react. Use icons for tools and modes where a standard symbol exists. Text-only buttons are for clear commands, not for representing tools.

## Do's and Don'ts

- **Do** keep the app task-first: Task, Session, Message, Artifact, Gateway, Agent, Team, Room, Skill, Tool, and Workspace are product terms with specific meanings.
- **Do** use dark mode as the reference implementation and verify light mode preserves structure.
- **Do** keep accent use scarce enough that selected and running states remain obvious.
- **Do** prefer borders, muted text, and panel geometry over decorative cards.
- **Do** make command surfaces fast, dense, keyboard-friendly, and visually focused.
- **Do** use motion presets and CSS variables already present in the renderer.
- **Don't** create landing-page hero sections inside the app.
- **Don't** add decorative gradients, bokeh, ornamental blobs, or stock imagery.
- **Don't** use pure black, pure white, or raw hardcoded component colors.
- **Don't** make every surface glassy, glowing, or card-like.
- **Don't** enlarge typography beyond the current desktop scale unless the view is truly empty-state or onboarding.
- **Don't** introduce a second broad accent palette; green is for live operational signals only.
- **Don't** let Teams or orchestration views become colorful role dashboards. They are still part of the same operator workspace.
