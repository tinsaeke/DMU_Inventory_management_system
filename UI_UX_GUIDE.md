# UI/UX Design System - DMU Inventory Management System

## Color Palette

### Status Colors
```css
/* Success States */
--success-bg: bg-green-50
--success-text: text-green-700
--success-border: border-green-200

/* Warning States */
--warning-bg: bg-yellow-50
--warning-text: text-yellow-700
--warning-border: border-yellow-200

/* Error/Destructive States */
--error-bg: bg-red-50
--error-text: text-red-700
--error-border: border-red-200

/* Info States */
--info-bg: bg-blue-50
--info-text: text-blue-700
--info-border: border-blue-200

/* Neutral States */
--neutral-bg: bg-gray-50
--neutral-text: text-gray-700
--neutral-border: border-gray-200
```

### Urgency Colors
- **Critical**: `bg-red-100 text-red-800`
- **High**: `bg-orange-100 text-orange-800`
- **Medium**: `bg-yellow-100 text-yellow-800`
- **Low**: `bg-green-100 text-green-800`

### Item Status Colors
- **Available**: `bg-green-100 text-green-800`
- **Allocated**: `bg-blue-100 text-blue-800`
- **Under Maintenance**: `bg-yellow-100 text-yellow-800`
- **Damaged**: `bg-red-100 text-red-800`

## Typography

### Headings
- **Page Title**: `text-2xl font-bold text-gray-900`
- **Section Title**: `text-lg font-semibold text-gray-900`
- **Card Title**: `text-sm font-semibold text-foreground`
- **Subsection**: `text-base font-medium text-gray-900`

### Body Text
- **Primary**: `text-sm text-gray-900`
- **Secondary**: `text-sm text-gray-600`
- **Muted**: `text-xs text-muted-foreground`
- **Label**: `text-xs font-medium text-gray-500 uppercase tracking-wider`

## Spacing

### Padding
- **Compact**: `px-2 py-1` (Tables, dense lists)
- **Normal**: `px-4 py-2` (Buttons, inputs)
- **Comfortable**: `px-4 py-3` (Cards, sections)
- **Spacious**: `px-6 py-4` (Dialogs, modals)

### Margins
- **Tight**: `gap-1` or `space-y-1`
- **Normal**: `gap-2` or `space-y-2`
- **Comfortable**: `gap-4` or `space-y-4`
- **Spacious**: `gap-6` or `space-y-6`

## Component Sizes

### Buttons
- **Small**: `h-6 text-xs px-2` (Table actions)
- **Default**: `h-9 text-sm px-4` (Forms, primary actions)
- **Large**: `h-11 text-base px-6` (Hero actions)

### Icons
- **Small**: `h-3 w-3` (Inline with small text)
- **Default**: `h-4 w-4` (Buttons, labels)
- **Medium**: `h-5 w-5` (Section headers)
- **Large**: `h-6 w-6` (Empty states)

### Badges
- **Small**: `text-[10px] px-1.5 py-0.5`
- **Default**: `text-xs px-2 py-1`

## Tables

### Standard Table Structure
```tsx
<table className="w-full">
  <thead className="bg-gray-50 border-b">
    <tr>
      <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
        Column Header
      </th>
    </tr>
  </thead>
  <tbody className="bg-white divide-y divide-gray-200">
    <tr className="hover:bg-gray-50">
      <td className="px-2 py-1 text-sm">Cell Content</td>
    </tr>
  </tbody>
</table>
```

## Cards

### Standard Card
```tsx
<Card>
  <CardHeader>
    <CardTitle className="flex items-center gap-2">
      <Icon className="h-5 w-5" />
      Title ({count})
    </CardTitle>
  </CardHeader>
  <CardContent>
    {/* Content */}
  </CardContent>
</Card>
```

## Forms

### Form Field Structure
```tsx
<FormField
  control={form.control}
  name="fieldName"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Field Label</FormLabel>
      <FormControl>
        <Input {...field} />
      </FormControl>
      <FormMessage />
    </FormItem>
  )}
/>
```

## Loading States

### Consistent Loading Messages
- Tables: `"Loading [resource]..."`
- Empty States: `"No [resource] found"`
- Error States: `"Failed to load [resource]"`

## Toast Notifications

### Success Toast
```tsx
toast({
  title: "Success",
  description: "Action completed successfully",
});
```

### Error Toast
```tsx
toast({
  title: "Error Title",
  description: "Detailed error message",
  variant: "destructive",
});
```

## Dialogs/Modals

### Standard Dialog Structure
```tsx
<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogContent className="sm:max-w-[500px]">
    <DialogHeader>
      <DialogTitle>Dialog Title</DialogTitle>
      <DialogDescription>
        Brief description of the dialog purpose
      </DialogDescription>
    </DialogHeader>
    {/* Content */}
    <DialogFooter>
      <Button variant="outline" onClick={onClose}>Cancel</Button>
      <Button onClick={onSubmit}>Confirm</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

## Pagination

### Standard Pagination
- Default page size: 25
- Options: [10, 25, 50, 100]
- Always show total count
- Consistent placement at bottom of tables

## Empty States

### Standard Empty State
```tsx
<div className="flex flex-col items-center justify-center py-8 text-gray-500">
  <Icon className="h-8 w-8 mb-2 opacity-50" />
  <p>No [resource] found</p>
</div>
```

## Accessibility

### Required Attributes
- All buttons: `aria-label` or visible text
- All inputs: Associated `<label>` elements
- All icons: `aria-hidden="true"` if decorative
- Loading states: `aria-busy="true"`
- Disabled states: `disabled` attribute

## Responsive Design

### Breakpoints
- Mobile: `< 640px`
- Tablet: `640px - 1024px`
- Desktop: `> 1024px`

### Grid Layouts
- Mobile: `grid-cols-1`
- Tablet: `md:grid-cols-2`
- Desktop: `lg:grid-cols-4`

## Animation & Transitions

### Standard Transitions
- Hover states: `transition-colors`
- Modal/Dialog: Built-in Radix UI animations
- Loading spinners: Use consistent spinner component

## Best Practices

1. **Consistency**: Use the same component for the same purpose across all pages
2. **Feedback**: Always provide user feedback for actions (toast, loading state)
3. **Clarity**: Use clear, descriptive labels and messages
4. **Accessibility**: Ensure keyboard navigation and screen reader support
5. **Performance**: Show loading states, avoid layout shifts
6. **Error Handling**: Display user-friendly error messages
7. **Validation**: Provide inline validation feedback
8. **Confirmation**: Ask for confirmation on destructive actions
