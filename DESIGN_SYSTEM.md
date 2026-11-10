# Design system

Polymath should feel like a serious independent technology publication that happens to be a working community. Dark, editorial, technical. Deep green is the room. Warm sand is the paper and the primary action. Copper is a mark, used rarely. White is the text colour on a dark field, not the field itself.

The dark theme is the product. Light-theme variables are named so they can exist later. They are not designed or shipped in V1.

## Principles

- Hierarchy comes from type size, weight no heavier than semibold, and the sand/green contrast. Not from boxes around every region.
- Borders separate large regions: sidebar, feed, rail. A card border is for a feed item or a person, not for a label inside it.
- Radius stays small. Controls use 6px. Feed items use 8px. Avatars are circular. Nothing uses a 24px radius.
- Shadow is a last resort. Dialogs and menus use the elevated surface colour and a 1px border. They do not float on a large blur.
- Motion is 150ms on colour and 200ms on dialogs. No page-transition choreography, no gradient animation, no decorative motion.
- Icons are Lucide, 16 or 18px, stroke 1.5. No emoji as icons.
- Uppercase is reserved for meta labels of a few words (status, deadline) at 11px with slight tracking. Headings are sentence case.
- The feed column is the widest content column on Home. The right rail is narrower than the feed and disappears before the feed is squeezed.

## Colour

Brand palette, used only through the semantic tokens below.

| Name | Hex | Role |
| --- | --- | --- |
| Deep Pine | `#102A24` | Sidebar, primary-button text |
| Forest Green | `#183C32` | Secondary fills, quiet emphasis |
| Muted Green | `#285B49` | Hover on forest surfaces, positive state |
| Accent Green | `#83A98A` | Links, focus ring, active nav marker |
| Warm Sand | `#E8E1D3` | Primary buttons, editorial highlights |
| Off White | `#F2F0E9` | Primary text |
| Charcoal | `#141817` | Page background |
| Surface Dark | `#1B211F` | Feed items, inputs |
| Elevated | `#222A26` | Dialogs, menus, rail panels |
| Border | `#303A34` | Hairline dividers |
| Muted text | `#A1AAA2` | Meta, placeholders |
| Secondary text | `#C2C9C1` | Bios, supporting copy |
| Copper | `#B87955` | Deadline inside 14 days, "seeking collaborators", the occasional editorial rule |

Functional colours, outside the brand palette, used only for their job:

| Token | Hex | Use |
| --- | --- | --- |
| Danger | `#9C4A42` | Destructive actions, form errors |
| Danger surface | `#2A1C1A` | Error banner background |

Do not introduce a blue link colour, a purple accent, or a gradient. Hover states lighten or darken within this set.

### Semantic tokens

Defined as CSS variables in `app/globals.css` and mapped into Tailwind v4 `@theme`. Components use the semantic names (`bg-background`, `text-foreground`, `bg-primary`). They do not use raw hex values or Tailwind palette names like `emerald-500`.

| Token | Dark value |
| --- | --- |
| `--background` | `#141817` |
| `--foreground` | `#F2F0E9` |
| `--card` | `#1B211F` |
| `--card-foreground` | `#F2F0E9` |
| `--popover` | `#222A26` |
| `--popover-foreground` | `#F2F0E9` |
| `--primary` | `#E8E1D3` |
| `--primary-foreground` | `#102A24` |
| `--secondary` | `#183C32` |
| `--secondary-foreground` | `#F2F0E9` |
| `--muted` | `#1B211F` |
| `--muted-foreground` | `#A1AAA2` |
| `--accent` | `#285B49` |
| `--accent-foreground` | `#F2F0E9` |
| `--destructive` | `#9C4A42` |
| `--border` | `#303A34` |
| `--input` | `#303A34` |
| `--ring` | `#83A98A` |
| `--sidebar` | `#102A24` |
| `--sidebar-foreground` | `#E8E1D3` |
| `--sidebar-muted` | `#A1AAA2` |
| `--text-secondary` | `#C2C9C1` |
| `--copper` | `#B87955` |
| `--positive` | `#83A98A` |
| `--radius` | `0.375rem` |

Primary buttons are sand with pine text. That is intentional: the environment is green, the action is paper-coloured, and the app does not become a set of green buttons on green cards. Secondary buttons are forest with off-white text, or ghost buttons with a border. Destructive buttons use the danger colour and require a confirmation dialog.

Focus rings use `--ring` at 2px, offset 2px, on every interactive control. Placeholders use muted text and are real examples ("A small robot that sorts recyclable metal"), not "Enter text here" repeated on every field.

Light theme: the same token names will be redefined under `[data-theme="light"]` in a later phase. V1 sets `color-scheme: dark` and does not ship a toggle.

## Typography

Loaded with `next/font`.

| Role | Family | Use |
| --- | --- | --- |
| Interface | Geist Sans | UI, body, navigation, forms |
| Meta | Geist Mono | Usernames, slugs, timestamps, skill tags, deadlines, counts |
| Editorial | Instrument Serif | A small number of page titles and the project name on the project page |

Scale:

| Token | Size | Line height | Use |
| --- | --- | --- | --- |
| meta | 12px | 16px | Timestamps, tags, mono labels |
| body-sm | 14px | 20px | Secondary copy, card descriptions |
| body | 16px | 24px | Post body, form fields |
| title | 18px | 26px | Card titles, section labels |
| page | 28px | 34px | Page headings in sans, semibold |
| editorial | 40px | 44px | Instrument Serif, at most one per page |

Weight: 400 for body, 500 for navigation and buttons, 600 for page headings. Do not use 700.

The editorial size appears on Discover ("What builders are making"), Opportunities ("Find something worth entering"), and the project page title. Home's feed heading is the page size in sans, because the feed is a tool the member uses every day, not a magazine cover on every visit.

Measure: body text inside a post or a project description maxes out at 68 characters. Do not stretch prose across the rail.

## Spacing and layout

Base unit 4px. Use 4, 8, 12, 16, 24, 32, 48, 64. Do not invent 13 or 18 except where an icon grid demands it.

Desktop, from 1100px:

| Region | Width |
| --- | --- |
| Sidebar | 232px, fixed, Deep Pine, full height |
| Gap | 24px |
| Feed | Flexible, max 680px, min 480px |
| Gap | 24px |
| Rail | 300px |

The page background is charcoal. The sidebar is the only full-height pine surface. The rail is not a stack of bordered widgets. It is three quiet groups — projects, people, opportunities — separated by 32px and a hairline, each with a 14px label and a short list.

Tablet, 760px to 1099px: sidebar collapses to 72px of icons with tooltips. The rail moves below the feed. The feed keeps its max width and centers.

Mobile, under 760px: no sidebar. A top bar with the wordmark and the notification entry. Content is a single column with 16px gutters. A bottom bar holds Home, Discover, Build, People, and Profile. Build is the sand button. Opportunities, Communities, Notifications, and Settings are reached from Profile and, where relevant, from Discover sections. The bottom bar is not a shrunk sidebar.

Safe areas are respected on the bottom bar. Targets are at least 44px.

## Content types

These share alignment, type, and the 8px radius. They differ in structure so a member can tell them apart while scrolling.

| Type | Visual structure |
| --- | --- |
| Project | Cover image at a 16:9 ratio when one exists. Name in the title size. One-line description. Creator and up to three team avatars. Mono skill tags. Status as a mono label. No cover means a pine band with the project name in serif, not a stock illustration. |
| Build log | No cover hero. A mono label "Build log" and the project name as a link. Title, then the update. A thin sand rule on the left edge of the text, 2px, so it reads as a notebook entry. |
| Idea | Mono label "Idea". Title and body. No status, no cover. |
| Help | Mono label "Looking for help" in copper. The ask in the first line. Skills requested as tags. |
| Achievement | Mono label "Milestone". One sentence of what happened and the project link. No trophy art, no confetti. |
| Opportunity | Organizer in meta. Name in the title size. Category, online or city, and eligibility in secondary text. Deadline in mono. A deadline inside 14 days is copper. A past deadline says "Closed" in muted text. A missing deadline says "See the official page". |
| Person | Avatar, name, @username in mono, city, two-line bio, up to four skills, one current project, follow button. No follower count. |

Reaction row, in order: Interesting, Inspired, Build, Contribute, then Save and Comment. Counts sit next to the verb in mono, and a count of zero shows the verb alone. Share copies the canonical URL. It does not open a fake share sheet of networks we have not integrated.

## Components

Build these in Phase 1, on top of shadcn/ui, restyled to the tokens. Add a component only when a screen needs it.

| Component | Behaviour |
| --- | --- |
| Button | Variants: primary (sand), secondary (forest), ghost, destructive. Sizes: default 36px, large 44px. Loading replaces the label with a quiet spinner and disables the control. |
| Input, textarea, select | Surface background, border, sand caret, ring on focus. Error text below in the danger colour, associated with `aria-describedby`. |
| Dropdown menu | Elevated surface. Used for account, share, and card overflow. |
| Dialog | Elevated surface, for compose steps that must be completed or cancelled, and for confirmations. Confirmations name the object ("Withdraw request to Orbit") and the consequence. |
| Avatar | Image or initials on pine. Sizes 24, 32, 40, 64. |
| Badge | Mono, 12px, border, no fill, for status and skills. Copper border only for seeking and closing soon. |
| Tabs | Text tabs with an accent-green underline. Not a pill group. |
| Tooltip | Used on collapsed sidebar icons and on icon-only buttons. |
| Toast | Sonner, elevated surface, one line. Success, error, or neutral. |
| Skeleton | A block on the surface colour, no shimmer gradient. Used for feed, profile, and project loading. |
| Empty state | Title, one sentence, one action. No illustration pack. |
| Logo | Wordmark component: "Polymath" in Instrument Serif, sand colour, with a 8px pine square mark in front of it. Replaced later by a real logo without editing call sites. |

Navigation:

- Desktop sidebar: wordmark, the seven destinations, a create action, and the member's avatar with their name linking to their profile. Active item uses sand text and a 2px accent-green bar on the left. Inactive items use secondary text.
- Create opens a small menu: project, build log, idea, help, achievement. Each entry goes to a real form once that form exists. Until then the entry is absent, not disabled with a tooltip that apologizes.
- Mobile top bar and bottom bar as specified in the layout section.

## Writing

- Sentence case.
- Address the member as "you".
- Buttons are verbs: "Publish project", "Follow", "Save", "Send request".
- Empty and error copy tells the member what to do next.
- Demo content, when shown in local development, carries the word "Demo" in a badge. Production hides those rows.
- Do not write "Welcome to the future of building" or any line that could sit on a generic AI landing page. The Opportunities heading is fixed: "Find something worth entering." Discover can use "What builders are making." Home's heading is "Home".

## Accessibility

- Colour is not the only status signal. A closing deadline also says the date. A project status also says the word.
- Contrast target is WCAG AA for text on charcoal, surface, pine, and sand. Sand buttons use pine text, which clears comfortably. Muted text at 12px is for supplementary meta, not for the only copy in a control.
- Every form control has a visible label.
- Dialogs trap focus and close on Escape.
- Images have alt text. A cover's alt is the project name. Decorative marks are `alt=""`.
- The feed, sidebar, and rail are landmark regions (`main`, `nav`, `complementary`).

## Responsive behaviour checklist

Used at the end of every phase that changes a page:

- 1440px: sidebar, feed, rail, no horizontal scroll.
- 1100px: the boundary where the rail still fits.
- 768px: icon sidebar, rail below, no overlapping chrome.
- 390px: bottom bar, single column, composer usable, no control under the bar.

## Anti-patterns

These are rejected in review:

- Purple, blue, or multicolour gradients.
- Glass blur panels.
- Large rounded rectangles nested inside other large rounded rectangles.
- A border and a shadow and a background tint on the same element.
- Decorative circles, grids of dots, or glowing orbs.
- Fake charts, fake activity, fake totals.
- Identical cards repeated with only the title changed, when the content types should differ as specified above.
- Emoji, exclamation marks in headings, and all-caps section titles.
- A spinner that replaces an entire page when a skeleton would hold the layout.
