# Global Theme Components

This folder contains reusable, themed components that maintain a consistent design language across the entire work-time-calculator application.

## 📁 Components

### ThemeDialog

A glassmorphism-styled dialog component that wraps shadcn's Dialog with our custom styling.

**Features:**
- Consistent backdrop blur and glass effect (`bg-gray-800/10 backdrop-blur-md`)
- Custom border styling (`border border-gray-700`)
- Rounded corners (`rounded-3xl`)
- White text color
- Supports title, description, and custom footer

**Usage:**

```jsx
import { ThemeDialog } from '@/components/global/ThemeDialog';
import { ThemeButton } from '@/components/global/ThemeButton';

function MyComponent() {
  const [open, setOpen] = useState(false);
  
  return (
    <ThemeDialog
      open={open}
      onOpenChange={setOpen}
      title="Dialog Title"
      description="Optional description text"
      footer={
        <>
          <ThemeButton variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </ThemeButton>
          <ThemeButton variant="primary" onClick={handleSave}>
            Save
          </ThemeButton>
        </>
      }
    >
      {/* Your dialog content */}
      <div>Content goes here</div>
    </ThemeDialog>
  );
}
```

**Props:**

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `open` | boolean | Yes | Controls dialog visibility |
| `onOpenChange` | function | Yes | Callback when dialog state changes |
| `title` | string | Yes | Dialog title text |
| `description` | string | No | Optional description text |
| `children` | ReactNode | Yes | Dialog content |
| `footer` | ReactNode | No | Optional footer content (usually buttons) |
| `contentClassName` | string | No | Additional classes for DialogContent |
| `titleClassName` | string | No | Additional classes for DialogTitle |
| `descriptionClassName` | string | No | Additional classes for DialogDescription |

---

### ThemeButton

A themed button component with predefined style variants matching the app's design system.

**Features:**
- Multiple style variants (primary, outline, destructive, ghost)
- Consistent rounded corners (`rounded-full` by default)
- Hover states
- Built on shadcn Button component

**Usage:**

```jsx
import { ThemeButton } from '@/components/global/ThemeButton';

// Primary button (default)
<ThemeButton onClick={handleSave}>
  Save Changes
</ThemeButton>

// Outline/Secondary button
<ThemeButton variant="outline" onClick={handleCancel}>
  Cancel
</ThemeButton>

// Destructive button
<ThemeButton variant="destructive" onClick={handleDelete}>
  Delete All
</ThemeButton>

// Ghost button
<ThemeButton variant="ghost" size="icon">
  <Icon />
</ThemeButton>
```

**Variants:**

| Variant | Style | Use Case |
|---------|-------|----------|
| `primary` | Cyan background (`bg-cyan-900 hover:bg-cyan-600`) | Main action buttons |
| `outline` / `secondary` | Gray border (`border-gray-600`) | Secondary actions, cancel buttons |
| `destructive` | Red background (`bg-red-600 hover:bg-red-700`) | Delete, remove, dangerous actions |
| `ghost` | Transparent (`hover:bg-gray-700/40`) | Icon buttons, subtle actions |

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | 'primary' \| 'secondary' \| 'outline' \| 'destructive' \| 'ghost' | 'primary' | Button style variant |
| `fullRounded` | boolean | true | Whether to apply rounded-full |
| `className` | string | - | Additional CSS classes |
| `children` | ReactNode | - | Button content |
| ...rest | - | - | All other Button props from shadcn |

---

## 🎨 Design System

### Color Palette

- **Primary (Cyan)**: `bg-cyan-900`, `hover:bg-cyan-600`, `text-cyan-200`
- **Secondary (Gray)**: `border-gray-600`, `hover:bg-gray-700`, `text-gray-300`
- **Destructive (Red)**: `bg-red-600`, `hover:bg-red-700`, `text-rose-100`
- **Glass Background**: `bg-gray-800/10 backdrop-blur-md border border-gray-700`

### Typography

- **Dialog Title**: `text-xl font-semibold text-white`
- **Dialog Description**: `text-gray-300`

### Borders & Corners

- **Dialog**: `rounded-3xl`
- **Buttons**: `rounded-full`
- **Border**: `border-gray-700`

---

## 🚀 Adding New Components

When creating new themed components:

1. **Follow the naming convention**: `Theme[ComponentName]`
2. **Use the design tokens** defined above
3. **Wrap shadcn components** for consistency
4. **Add comprehensive JSDoc** comments
5. **Export from index.js** for easy importing
6. **Update this README** with usage examples

### Example Template:

```jsx
"use client";

import React from "react";
import { ShadcnComponent } from "../ui/shadcn-component";
import { cn } from "@/lib/utils";

/**
 * ThemeComponentName - Description
 * 
 * @param {object} props - Component props
 */
export const ThemeComponentName = ({ className, ...props }) => {
  return (
    <ShadcnComponent
      className={cn(
        "bg-gray-800/10 backdrop-blur-md border border-gray-700 text-white rounded-3xl",
        className
      )}
      {...props}
    />
  );
};
```

---

## 📦 Import Methods

### Individual imports:
```jsx
import { ThemeDialog } from '@/components/global/ThemeDialog';
import { ThemeButton } from '@/components/global/ThemeButton';
```

### Batch import:
```jsx
import { ThemeDialog, ThemeButton } from '@/components/global';
```

---

## ✅ Migration Checklist

When migrating existing components to use theme components:

- [ ] Replace `Dialog` imports with `ThemeDialog`
- [ ] Replace `Button` custom styling with `ThemeButton` variants
- [ ] Move footer buttons to the `footer` prop of `ThemeDialog`
- [ ] Remove duplicated className strings
- [ ] Test all interactive states (hover, focus, etc.)

---

## 🎯 Benefits

1. **Consistency**: All dialogs and buttons look and feel the same
2. **Maintainability**: Update styles in one place, affects all components
3. **Developer Experience**: Simple API, less boilerplate
4. **Scalability**: Easy to add new variants or components
5. **Type Safety**: Full TypeScript/JSDoc support

---

**Last Updated**: December 2024
**Maintainer**: Faizan Ahmed
