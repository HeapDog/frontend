**PROMPT: Design a highly professional, futuristic, and FAANG-level user experience (UX) for an online assessment and pair-coding platform. The design language should favor clarity, efficiency, and subtle sophistication, evoking a mood of "high-performance engineering."**

### 1. The Color Palette: "Violet Horizon" & "Deep Space"

*   **Primary Brand Color:** **Electric Violet** (`#5E17EB` / `oklch(0.45 0.26 280)`).
    *   **Usage:** Primary CTAs, active states, focus rings, and key highlights.
    *   **Vibe:** Vibrant, energetic, and technical.

*   **Light Mode ("Violet Horizon"):**
    *   **Base Background:** A very subtle, crisp off-white with a hint of violet (`oklch(0.99 0.002 280)`). *Avoid clinical pure white backgrounds.*
    *   **Surfaces (Cards/Panels):** **Pure White** (`oklch(1 0 0)`). This creates depth and "pop" against the subtle background.
    *   **Text:** Deep charcoal with a violet undertone (`oklch(0.15 0.03 280)`), avoiding harsh pure black.
    *   **Borders:** Crisp, light violet-gray (`oklch(0.92 0.02 280)`).

*   **Dark Mode ("Deep Space Enhanced"):**
    *   **Base Background:** Deep, void-like violet-black (`oklch(0.10 0.02 280)`).
    *   **Surfaces (Cards/Panels):** Rich, slightly elevated dark violet-gray (`oklch(0.15 0.03 280)`).
    *   **Inputs/Slots:** Clearly defined, slightly lighter or darker than surface (`oklch(0.12 0.03 280)` or `oklch(0.18 0.03 280)`).
    *   **Text:** High-contrast white (`oklch(0.98 0.005 280)`) for headings, subtle gray-white (`oklch(0.85 0.01 280)`) for body.
    *   **Borders:** Visible but subtle interaction boundaries (`oklch(0.25 0.05 280)`).
    *   **Accents:** Glowing violet elements that pop against the dark void.

### 2. Core Design Principles

*   **Subtle Sophistication:** Use depth (layering) and subtle borders rather than heavy drop shadows. Shadows should be used sparingly for elevation (modals, dropdowns).
*   **Interactive Feedback:**
    *   **Cursor:** All interactive elements (buttons, clickable cards, list items) **MUST** show `cursor: pointer`.
    *   **Hover:** Instant, satisfying feedback. Use subtle background shifts (e.g., `bg-primary/10`) rather than drastic color changes.
    *   **Active/Focus:** Clear focus rings using the primary color to support accessibility and keyboard navigation.
*   **Motion:**
    *   Use `framer-motion` for structural changes (e.g., active tab pills, page transitions).
    *   Transitions should be fast and smooth (spring animations or `ease-out` ~200ms).
    *   **"Active Pill"**: For navigation sidebars, use a floating background "pill" that slides behind the active item.

### 3. Component Styling Guidelines

#### A. Typography
*   **Font Family:** `Geist Sans` for UI, `Geist Mono` for code/data.
*   **Headings:** High contrast, tight tracking (`tracking-tight`).
*   **Body:** highly readable, excellent line height (`1.5`+).

#### B. Navigation (Sidebar & Tabs)
*   **Style:** Modern, "ghost" button style for list items.
*   **Active State:**
    *   **Do not use underlines** for vertical navigation.
    *   Use a **background tint** (`bg-primary/10`) and **primary colored text**.
    *   Include a visual indicator (e.g., a vertical bar or "pill") to denote the active section clearly.
*   **Hover:** Subtle background fade (`hover:bg-muted` or `hover:bg-primary/5`).

#### B. Buttons
*   **Primary:** Solid Electric Violet background, white text. `hover:brightness-110`.
*   **Secondary/Outline:** Bordered with subtle background hover.
*   **Destructive:** Soft red with specific `oklch` values ensuring it doesn't clash with the violet theme.
*   **Radius:** `0.5rem` (rounded-md) for a modern, friendly but professional look.

#### C. Inputs & Forms
*   **Default:** Clean `1px` border (`oklch(0.92...)` light, `oklch(0.25...)` dark).
*   **Focus:** `ring-2` with Primary Color opacity.
*   **Background:** White (light mode) or deep charcoal (dark mode). Inputs should stand out from the card background in dark mode.

#### D. Layout & Structure
*   **Container:** Use `max-w-7xl` for main layouts to allow content to breathe.
*   **Spacing:** Generous whitespace. Section headers should have clear separation.
*   **Sticky Elements:** Sidebars should be sticky (`sticky top-24`) to maintain context during scrolling.

### 4. Accessibility
*   **Contrast:** Ensure text meets WCAG AA standards against the new violet-tinted backgrounds.
*   **Reduced Motion:** Respect user preferences for reduced motion in Framer Motion animations.
