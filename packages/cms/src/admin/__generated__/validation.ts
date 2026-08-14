import { z } from "zod";

export const ArraySchema = z.object({
  id: z.string().optional(),
  title: z.string(),
  field: z.unknown().optional(),
});

export type ArrayInput = z.infer<typeof ArraySchema>;

export const BooleanSchema = z.object({
  id: z.string().optional(),
  title: z.string(),
  field: z.boolean().optional(),
});

export type BooleanInput = z.infer<typeof BooleanSchema>;

export const ComponentSchema = z.object({
  id: z.string().optional(),
  title: z.string(),
  field: z.unknown().optional(),
});

export type ComponentInput = z.infer<typeof ComponentSchema>;

export const DateSchema = z.object({
  id: z.string().optional(),
  title: z.string(),
  field: z.string().optional(),
});

export type DateInput = z.infer<typeof DateSchema>;

export const DynamicZoneSchema = z.object({
  id: z.string().optional(),
  title: z.string(),
  field: z.unknown().optional(),
});

export type DynamicZoneInput = z.infer<typeof DynamicZoneSchema>;

export const GroupSchema = z.object({
  id: z.string().optional(),
  title: z.string(),
  field: z.unknown().optional(),
});

export type GroupInput = z.infer<typeof GroupSchema>;

export const MediaTestSchema = z.object({
  id: z.string().optional(),
  title: z.string(),
  field: z.string().optional(),
});

export type MediaTestInput = z.infer<typeof MediaTestSchema>;

export const NumberSchema = z.object({
  id: z.string().optional(),
  title: z.string(),
  field: z.number().optional(),
});

export type NumberInput = z.infer<typeof NumberSchema>;

export const PostsSchema = z.object({
  id: z.string().optional(),
  title: z.string(),
  slug: z.string().optional(),
  excerpt: z.string().optional(),
  content: z.string().optional(),
  published: z.boolean().optional(),
  publishedAt: z.string().optional(),
  category: z.string().optional(),
  author: z.string().optional(),
});

export type PostsInput = z.infer<typeof PostsSchema>;

export const RelationSchema = z.object({
  id: z.string().optional(),
  title: z.string(),
  field: z.string().optional(),
});

export type RelationInput = z.infer<typeof RelationSchema>;

export const RepeaterSchema = z.object({
  id: z.string().optional(),
  title: z.string(),
  field: z.unknown().optional(),
});

export type RepeaterInput = z.infer<typeof RepeaterSchema>;

export const RichTextSchema = z.object({
  id: z.string().optional(),
  title: z.string(),
  field: z.string().optional(),
});

export type RichTextInput = z.infer<typeof RichTextSchema>;

export const SelectSchema = z.object({
  id: z.string().optional(),
  title: z.string(),
  field: z.string().optional(),
});

export type SelectInput = z.infer<typeof SelectSchema>;

export const TextSchema = z.object({
  id: z.string().optional(),
  title: z.string(),
  field: z.string().optional(),
});

export type TextInput = z.infer<typeof TextSchema>;

