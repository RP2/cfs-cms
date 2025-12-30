# shadcn-svelte Components Inventory

This document tracks which shadcn-svelte components have been installed for easy reference across AI models and development sessions.

**Last Updated**: December 29, 2025  
**Installation Command**: `npx shadcn-svelte@latest add [component-name]`

## ✅ Installed Components

### Data Display

- ✅ **card** - File/folder grid items, content containers
- ✅ **table** - Alternative list view for files

### Forms & Input

- ✅ **input** - Search bar, text inputs, form fields
- ✅ **select** - Dropdown selectors (⚠️ overwrites separator component)
- ✅ **dialog** - Modals for create, rename, delete, upload actions

### Navigation & Menus

- ✅ **button** - All interactive buttons throughout UI
- ✅ **dropdown-menu** - Workspace switcher, user menu, bulk actions
- ✅ **context-menu** - Right-click file/folder actions
- ✅ **breadcrumb** - Current path navigation (Home > Projects > 2025)

### Layout & Organization

- ✅ **tabs** - Grid/list view toggle
- ✅ **toggle-group** - Toggle button groups (grid/list view)
- ✅ **separator** - Visual dividers between sections
- ✅ **sidebar** - Collapsible responsive sidebar (sidebar-07 variant)

### Feedback & Indicators

- ✅ **checkbox** - Multi-select files/folders
- ✅ **badge** - Tag display on files
- ✅ **avatar** - User profile pictures in header
- ✅ **label** - Form labels in modals
- ✅ **scroll-area** - Scrollable folder trees
- ✅ **tooltip** - Hover hints on buttons
- ✅ **alert** - Error/success messages
- ✅ **skeleton** - Loading state placeholders
- ✅ **separator** - Visual dividers between sections

## Component Import Pattern

All components are in `src/lib/components/ui/` and exported from `src/lib/components/ui/index.ts`:

```typescript
import { Button } from '$lib/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
import { Input } from '$lib/components/ui/input';
```

## Usage Notes

- **Full Tailwind Customization**: All components use Tailwind and can be customized via the `cn()` utility
- **Copy-Paste Pattern**: Components are copied to your repo, not imported from npm
- **TypeScript**: All components are fully typed
- **No Hallucinations**: AI models are trained on shadcn patterns and won't generate invalid code

### ⚠️ Known Issues

- **Select Component**: Installing `select` overwrites the `separator` component. If you need both, reinstall `separator` after installing `select`:

  ```bash
  npx shadcn-svelte@latest add separator
  ```

## Related Utilities

- `$lib/utils.ts` - Contains `cn()` function for Tailwind class merging
- Tailwind CSS v4.1.17 - Styling foundation
- Bits UI v2.14.4 - Underlying component library

---

To add a new component:

```bash
npx shadcn-svelte@latest add [component-name]
```

Then update this file to track the addition.
