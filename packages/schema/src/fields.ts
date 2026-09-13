import type {
  TextField,
  TextareaField,
  NumberField,
  BooleanField,
  DateField,
  DateTimeField,
  EmailField,
  PasswordField,
  UrlField,
  JsonField,
  RichTextField,
  MarkdownField,
  CodeField,
  ColorField,
  MediaField,
  UploadField,
  SelectField,
  MultiSelectField,
  RadioField,
  CheckboxField,
  RelationField,
  ComponentField,
  DynamicZoneField,
  ArrayField,
  ObjectField,
  TabsField,
  GroupField,
  RepeaterField,
  SlugField,
  FieldDefinition,
  FieldBase,
  SelectOption,
} from "@blazing-cms/types";

type FieldOptions = Partial<Omit<FieldBase, "name" | "type">>;

export function text(name: string, options?: FieldOptions): TextField {
  return { name, type: "text", ...options };
}

export function textarea(name: string, options?: FieldOptions): TextareaField {
  return { name, type: "textarea", ...options };
}

export function number(name: string, options?: FieldOptions): NumberField {
  return { name, type: "number", ...options };
}

export function boolean(name: string, options?: FieldOptions): BooleanField {
  return { name, type: "boolean", ...options };
}

export function date(name: string, options?: FieldOptions): DateField {
  return { name, type: "date", ...options };
}

export function datetime(name: string, options?: FieldOptions): DateTimeField {
  return { name, type: "datetime", ...options };
}

export function email(name: string, options?: FieldOptions): EmailField {
  return { name, type: "email", ...options };
}

export function password(name: string, options?: FieldOptions): PasswordField {
  return { name, type: "password", ...options };
}

export function url(name: string, options?: FieldOptions): UrlField {
  return { name, type: "url", ...options };
}

export function json(name: string, options?: FieldOptions): JsonField {
  return { name, type: "json", ...options };
}

export function richText(name: string, options?: FieldOptions): RichTextField {
  return { name, type: "richText", ...options };
}

export function markdown(name: string, options?: FieldOptions): MarkdownField {
  return { name, type: "markdown", ...options };
}

export function code(name: string, options?: FieldOptions): CodeField {
  return { name, type: "code", ...options };
}

export function color(
  name: string,
  options?: FieldOptions & { format?: "hex" | "rgb" | "rgba" | "hsl" },
): ColorField {
  return { name, type: "color", ...options };
}

export function media(
  name: string,
  options?: FieldOptions & {
    multiple?: boolean;
    allowedTypes?: Array<"image" | "video" | "audio" | "document">;
  },
): MediaField {
  return { name, type: "media", ...options };
}

export function upload(
  name: string,
  options?: FieldOptions & {
    multiple?: boolean;
    allowedTypes?: Array<"image" | "video" | "audio" | "document">;
  },
): UploadField {
  return { name, type: "upload", ...options };
}

export function select(
  name: string,
  options: FieldOptions & { options: SelectOption[] },
): SelectField {
  return { name, type: "select", ...options };
}

export function multiSelect(
  name: string,
  options: FieldOptions & { options: SelectOption[] },
): MultiSelectField {
  return { name, type: "multiSelect", ...options };
}

export function radio(
  name: string,
  options: FieldOptions & { options: SelectOption[] },
): RadioField {
  return { name, type: "radio", ...options };
}

export function checkbox(name: string, options?: FieldOptions): CheckboxField {
  return { name, type: "checkbox", ...options };
}

export function relation(
  name: string,
  options: FieldOptions & {
    to: string;
    kind?: "oneToOne" | "oneToMany" | "manyToOne" | "manyToMany";
  },
): RelationField {
  return { name, type: "relation", ...options };
}

export function component(
  name: string,
  options: FieldOptions & { component: string; repeatable?: boolean },
): ComponentField {
  return { name, type: "component", ...options };
}

export function dynamicZone(
  name: string,
  options: FieldOptions & { components: string[] },
): DynamicZoneField {
  return { name, type: "dynamicZone", ...options };
}

export function array(
  name: string,
  options: FieldOptions & { fields: FieldDefinition[] },
): ArrayField {
  return { name, type: "array", ...options };
}

export function object(
  name: string,
  options: FieldOptions & { fields: FieldDefinition[] },
): ObjectField {
  return { name, type: "object", ...options };
}

export function tabs(
  name: string,
  options: FieldOptions & { tabs: Array<{ label: string; fields: FieldDefinition[] }> },
): TabsField {
  return { name, type: "tabs", ...options };
}

export function group(
  name: string,
  options: FieldOptions & { fields: FieldDefinition[] },
): GroupField {
  return { name, type: "group", ...options };
}

export function repeater(
  name: string,
  options: FieldOptions & { fields: FieldDefinition[] },
): RepeaterField {
  return { name, type: "repeater", ...options };
}

export function slug(
  name: string,
  options?: FieldOptions & { source?: string; unique?: boolean },
): SlugField {
  return { name, type: "slug", ...options };
}
