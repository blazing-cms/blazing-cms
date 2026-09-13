# AGENTS.md

## Code Field

Use `code()` for embedded code snippets with syntax highlighting.

```typescript
code("snippet", { language: "javascript" });
code("css", { language: "css" });
code("html", { language: "html" });
```

**Options:**

- `language`: Syntax highlighting language (e.g., 'javascript', 'css', 'html', 'python')

---

## Admin Description

Every field builder accepts an `admin.description` option for help text shown in the CMS panel.

```typescript
text("title", { admin: { description: "The main heading for this content" } });
textarea("summary", { admin: { description: "Brief summary shown in listings" } });
```

---

## Validation Options

All fields accept a `validation` object with these options:

```typescript
text("title", {
  validation: {
    required: true, // Field is required
    unique: true, // Must be unique
    minLength: 10, // Minimum string length
    maxLength: 100, // Maximum string length
    pattern: "^[A-Z]", // Regex pattern
    message: "Custom error message",
  },
});
```

**Per-type options:**

| Field Type     | Available Options                               |
| -------------- | ----------------------------------------------- |
| text, textarea | required, unique, minLength, maxLength, pattern |
| number         | required, unique, min, max                      |
| email, url     | required, unique, pattern                       |
| richText       | required, minLength, maxLength                  |
| boolean        | required                                        |
| select, radio  | required                                        |
| datetime       | required                                        |

---

## Default Values

All fields accept a `defaultValue` option applied when creating new entries.

```typescript
text('title', { defaultValue: 'Untitled' })
number('order', { defaultValue: 0 })
boolean('published', { defaultValue: false })
select('status', { options: [...], defaultValue: 'draft' })
```
