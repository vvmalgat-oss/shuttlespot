# ShuttleSpot — Design Direction

## Core Principles

- **Clean, white, professional** — not playful or cartoonish
- Inspired by tennis.com.au's court hire flow, adapted for badminton
- Trust signals, venue avatars, booking badges (like a real booking platform)
- Design work paused — major UI changes should be designed in Figma first

## Colours

- Blue primary: shadcn default oklch blue
- White backgrounds
- Minimal accent colours

## Components

- shadcn/ui for all UI components (consistency + accessibility)
- Radix primitives under the hood
- Nova preset for fonts (Inter)

## Layout Patterns

- Split layout (list + map) for search/venues/social pages
- Accordion-style expansion for venue time slots
- Slide-over panel for booking time slot selection
- Dialog modals for forms (post availability, etc.)

## Mobile

- Navbar has hamburger menu for mobile
- Map panels hidden on mobile (toggle needed — see KNOWN_ISSUES.md)
