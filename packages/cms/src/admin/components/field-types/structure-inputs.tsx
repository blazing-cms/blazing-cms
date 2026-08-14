import type {
  FieldDefinition,
  SelectField,
  MultiSelectField,
  RadioField,
  RelationField,
  ComponentField,
  DynamicZoneField,
  ArrayField,
  ObjectField,
  GroupField,
  RepeaterField,
  TabsField,
  SlugField,
} from "@blazing-cms/types";
import type { ReactNode, ChangeEvent } from "react";

import { Plus, X, GripVertical } from "lucide-react";

import { getComponent } from "@/__generated__/schema-registry";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

export type RenderChild = (
  field: FieldDefinition,
  value: unknown,
  onChange: (value: unknown) => void,
) => ReactNode;

export function renderStructureInput(
  field: FieldDefinition,
  value: unknown,
  onChange: (v: unknown) => void,
  id?: string,
  renderChild?: RenderChild,
): ReactNode {
  switch (field.type) {
    case "select": {
      const f = field as SelectField;
      return (
        <Select
          id={id}
          value={String(value ?? "")}
          onChange={(e: ChangeEvent<HTMLSelectElement>) => onChange(e.target.value)}
        >
          <option value="">Select...</option>
          {f.options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </Select>
      );
    }

    case "multiSelect": {
      const f = field as MultiSelectField;
      const selected = Array.isArray(value) ? (value as string[]) : [];
      return (
        <div className="space-y-2">
          <Select
            value=""
            onChange={(e: ChangeEvent<HTMLSelectElement>) => {
              if (e.target.value && !selected.includes(e.target.value)) {
                onChange([...selected, e.target.value]);
              }
            }}
          >
            <option value="">Add...</option>
            {f.options
              .filter((o) => !selected.includes(o.value))
              .map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
          </Select>
          <div className="flex flex-wrap gap-2">
            {selected.map((s) => (
              <span
                key={s}
                className="inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-1 text-xs"
              >
                {s}
                <button onClick={() => onChange(selected.filter((v) => v !== s))}>
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        </div>
      );
    }

    case "radio": {
      const f = field as RadioField;
      return (
        <div className="space-y-2">
          {f.options.map((opt) => (
            <label key={opt.value} className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name={field.name}
                value={opt.value}
                checked={value === opt.value}
                onChange={() => onChange(opt.value)}
                className="text-primary"
              />
              {opt.label}
            </label>
          ))}
        </div>
      );
    }

    case "boolean":
    case "checkbox":
      return (
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={Boolean(value)}
            onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(e.target.checked)}
            className="rounded text-primary"
          />
          {field.label ?? field.name}
        </label>
      );

    case "slug": {
      const f = field as SlugField;
      return (
        <div className="space-y-1">
          <Input
            id={id}
            type="text"
            value={String(value ?? "")}
            onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
            placeholder={f.source ? `Auto-generated from ${f.source}...` : "slug-value"}
          />
        </div>
      );
    }

    case "array": {
      const f = field as ArrayField & { fields?: FieldDefinition[] };
      const items = Array.isArray(value) ? (value as unknown[]) : [];
      return (
        <div className="space-y-2 rounded-md border p-3">
          {items.map((item, idx) => (
            <div key={idx} className="flex items-start gap-2">
              <GripVertical className="mt-2 h-4 w-4 shrink-0 text-muted-foreground" />
              <div className="flex-1">
                {(f.fields ?? []).map(
                  (subField) =>
                    renderChild?.(
                      subField,
                      (item as Record<string, unknown>)?.[subField.name],
                      (v: unknown) => {
                        const newItems = [...items];
                        newItems[idx] = {
                          ...(newItems[idx] as Record<string, unknown>),
                          [subField.name]: v,
                        };
                        onChange(newItems);
                      },
                    ) ?? null,
                )}
              </div>
              <button onClick={() => onChange(items.filter((_, i) => i !== idx))}>
                <X className="h-4 w-4 text-destructive" />
              </button>
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={() => onChange([...items, {}])}>
            <Plus className="mr-1 h-3 w-3" /> Add item
          </Button>
        </div>
      );
    }

    case "object":
    case "group": {
      const g = field as (ObjectField | GroupField) & { fields?: FieldDefinition[] };
      const current = (value ?? {}) as Record<string, unknown>;
      return (
        <div className="space-y-3 rounded-md border p-3">
          {(g.fields ?? []).map(
            (subField) =>
              renderChild?.(subField, current[subField.name], (v: unknown) =>
                onChange({ ...current, [subField.name]: v }),
              ) ?? null,
          )}
        </div>
      );
    }

    case "repeater": {
      const r = field as RepeaterField;
      const items = Array.isArray(value) ? (value as Record<string, unknown>[]) : [];
      return (
        <div className="space-y-2">
          {items.map((item, idx) => (
            <div key={idx} className="rounded-md border p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">Item {idx + 1}</span>
                <button onClick={() => onChange(items.filter((_, i) => i !== idx))}>
                  <X className="h-3 w-3 text-destructive" />
                </button>
              </div>
              {r.fields.map(
                (subField) =>
                  renderChild?.(subField, item?.[subField.name], (v: unknown) => {
                    const newItems = [...items];
                    newItems[idx] = { ...(newItems[idx] ?? {}), [subField.name]: v };
                    onChange(newItems);
                  }) ?? null,
              )}
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={() => onChange([...items, {}])}>
            <Plus className="mr-1 h-3 w-3" /> Add item
          </Button>
        </div>
      );
    }

    case "tabs": {
      const t = field as TabsField;
      const vals = (value ?? {}) as Record<string, unknown>;
      return (
        <div className="space-y-4">
          {t.tabs.map((tab) => (
            <div key={tab.label} className="space-y-3">
              <h4 className="text-sm font-semibold text-muted-foreground">{tab.label}</h4>
              {tab.fields.map(
                (subField) =>
                  renderChild?.(subField, vals[subField.name], (v: unknown) =>
                    onChange({ ...vals, [subField.name]: v }),
                  ) ?? null,
              )}
            </div>
          ))}
        </div>
      );
    }

    case "dynamicZone": {
      const dz = field as DynamicZoneField;
      const items = Array.isArray(value) ? (value as Record<string, unknown>[]) : [];
      return (
        <div className="space-y-2">
          {items.map((item, idx) => {
            const compDef = getComponent(String(item.__component ?? ""));
            return (
              <div key={idx} className="rounded-md border p-3">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">
                    {compDef?.label ?? String(item.__component ?? "unknown")}
                  </span>
                  <button onClick={() => onChange(items.filter((_, i) => i !== idx))}>
                    <X className="h-3 w-3 text-destructive" />
                  </button>
                </div>
                {compDef?.fields.map(
                  (subField) =>
                    renderChild?.(
                      subField,
                      (item as Record<string, unknown>)?.[subField.name],
                      (v: unknown) => {
                        const newItems = [...items];
                        newItems[idx] = { ...(newItems[idx] ?? {}), [subField.name]: v };
                        onChange(newItems);
                      },
                    ) ?? null,
                )}
              </div>
            );
          })}
          <Select
            value=""
            onChange={(e: ChangeEvent<HTMLSelectElement>) => {
              if (e.target.value) {
                onChange([...items, { __component: e.target.value }]);
              }
            }}
          >
            <option value="">Add component...</option>
            {dz.components.map((c) => {
              const compDef = getComponent(c);
              return (
                <option key={c} value={c}>
                  {compDef?.label ?? c}
                </option>
              );
            })}
          </Select>
        </div>
      );
    }

    case "relation": {
      const f = field as RelationField;
      return (
        <div className="space-y-1">
          <Input
            id={id}
            type="text"
            value={String(value ?? "")}
            onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
            placeholder={`Related ${f.to} ID...`}
          />
          <p className="text-xs text-muted-foreground">
            Relation to: {f.to} ({f.kind ?? "oneToOne"})
          </p>
        </div>
      );
    }

    case "component": {
      const f = field as ComponentField;
      const obj = (value ?? {}) as Record<string, unknown>;
      const compDef = getComponent(f.component);
      const items = f.repeatable
        ? Array.isArray(value)
          ? (value as Record<string, unknown>[])
          : []
        : [obj];
      return (
        <div className="space-y-2">
          {items.map((item, idx) => (
            <div key={idx} className="rounded-md border p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">
                  {compDef?.label ?? f.component}
                </span>
                {f.repeatable && (
                  <button onClick={() => onChange(items.filter((_, i) => i !== idx))}>
                    <X className="h-3 w-3 text-destructive" />
                  </button>
                )}
              </div>
              {compDef?.fields.map(
                (subField) =>
                  renderChild?.(
                    subField,
                    (item as Record<string, unknown>)?.[subField.name],
                    (v: unknown) => {
                      if (!f.repeatable) {
                        onChange({ ...(item as Record<string, unknown>), [subField.name]: v });
                      } else {
                        const newItems = [...items];
                        newItems[idx] = { ...(newItems[idx] ?? {}), [subField.name]: v };
                        onChange(newItems);
                      }
                    },
                  ) ?? null,
              )}
            </div>
          ))}
          {f.repeatable && (
            <Button variant="outline" size="sm" onClick={() => onChange([...items, {}])}>
              <Plus className="mr-1 h-3 w-3" /> Add item
            </Button>
          )}
        </div>
      );
    }

    default:
      return null;
  }
}
