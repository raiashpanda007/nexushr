---
description: Fix Radix UI imports by installing @radix-ui/react-* packages and updating component imports
---

1. Install the scoped @radix-ui packages.
// turbo
2. Update `client/src/components/ui/dialog.tsx` to import `* as DialogPrimitive` from `@radix-ui/react-dialog`.
// turbo
3. Update `client/src/components/ui/button.tsx` to import `Slot` from `@radix-ui/react-slot`.
// turbo
4. Update `client/src/components/ui/label.tsx` to import `* as LabelPrimitive` from `@radix-ui/react-label`.
// turbo
5. Update `client/src/components/ui/select.tsx` to import `* as SelectPrimitive` from `@radix-ui/react-select`.
// turbo
6. Update `client/src/components/ui/popover.tsx` to import `* as PopoverPrimitive` from `@radix-ui/react-popover`.
// turbo
7. Update `client/src/components/ui/checkbox.tsx` to import `* as CheckboxPrimitive` from `@radix-ui/react-checkbox`.

Wait for installation to complete before editing files.
