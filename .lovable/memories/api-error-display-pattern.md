# API Error Display Pattern

## Rule
Whenever connecting any API endpoint, if the request fails, the UI **must** display:

1. **User-friendly alert** — translated title + description explaining what went wrong and what to do
2. **Collapsible "Системная информация" section** — showing:
   - The API endpoint that was called (e.g. `POST /transactions/register-aed-recipient/`)
   - The raw error message returned by the server

## Implementation Template

```tsx
{errorMessage && (
  <div className="bg-destructive/10 border border-destructive/30 rounded-2xl px-4 py-4 space-y-2">
    <p className="text-sm text-destructive font-semibold">
      ⚠️ {t("scope.errorTitle", "Человекочитаемый заголовок")}
    </p>
    <p className="text-xs text-destructive/80">
      {t("scope.errorDesc", "Описание что делать")}
    </p>
    <details className="mt-1">
      <summary className="text-[11px] text-muted-foreground cursor-pointer select-none">
        Системная информация
      </summary>
      <div className="mt-1 bg-muted/50 rounded-lg px-3 py-2 text-[11px] text-muted-foreground font-mono break-all space-y-0.5">
        <p>API: {apiEndpoint}</p>
        <p>Error: {errorMessage}</p>
      </div>
    </details>
  </div>
)}
```

## Notes
- "Системная информация" label does NOT need translation — it stays in Russian across all locales
- The user-friendly title and description MUST be translated to all supported languages
- Always store the raw error string from the API response to display in the system info section
