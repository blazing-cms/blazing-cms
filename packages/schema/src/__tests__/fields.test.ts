import { describe, it, expect } from "vitest";

import {
  text,
  textarea,
  number,
  boolean,
  date,
  datetime,
  email,
  password,
  url,
  json,
  richText,
  markdown,
  code,
  color,
  media,
  upload,
  select,
  multiSelect,
  radio,
  checkbox,
  relation,
  component,
  dynamicZone,
  array,
  object,
  tabs,
  group,
  repeater,
  slug,
} from "../fields.js";

describe("field helpers", () => {
  describe("scalar fields", () => {
    it("text returns TextField", () => {
      const f = text("title", { label: "Title" });
      expect(f).toEqual({ label: "Title", name: "title", type: "text" });
    });

    it("textarea returns TextareaField", () => {
      const f = textarea("bio", { validation: { required: true } });
      expect(f.name).toBe("bio");
      expect(f.type).toBe("textarea");
      expect(f.validation?.required).toBe(true);
    });

    it("number returns NumberField", () => {
      const f = number("age", { defaultValue: 0 });
      expect(f.type).toBe("number");
      expect(f.defaultValue).toBe(0);
    });

    it("boolean returns BooleanField", () => {
      const f = boolean("published", { defaultValue: true });
      expect(f.type).toBe("boolean");
      expect(f.defaultValue).toBe(true);
    });

    it("date returns DateField", () => {
      const f = date("birthday");
      expect(f.type).toBe("date");
    });

    it("datetime returns DateTimeField", () => {
      const f = datetime("publishedAt");
      expect(f.type).toBe("datetime");
    });

    it("email returns EmailField", () => {
      const f = email("contact");
      expect(f.type).toBe("email");
    });

    it("password returns PasswordField", () => {
      const f = password("secret");
      expect(f.type).toBe("password");
    });

    it("url returns UrlField", () => {
      const f = url("website");
      expect(f.type).toBe("url");
    });

    it("json returns JsonField", () => {
      const f = json("metadata");
      expect(f.type).toBe("json");
    });

    it("richText returns RichTextField", () => {
      const f = richText("content");
      expect(f.type).toBe("richText");
    });

    it("richText accepts toolbar preset", () => {
      const f = richText("content", { toolbar: "minimal" });
      expect(f.type).toBe("richText");
      expect(f.toolbar).toBe("minimal");
    });

    it("markdown returns MarkdownField", () => {
      const f = markdown("body");
      expect(f.type).toBe("markdown");
    });

    it("code returns CodeField", () => {
      const f = code("snippet");
      expect(f.type).toBe("code");
    });

    it("color accepts hex format", () => {
      const f = color("primary", { format: "hex" });
      expect(f.type).toBe("color");
      expect(f.format).toBe("hex");
    });

    it("color works without format option", () => {
      const f = color("accent");
      expect(f.type).toBe("color");
      expect(f.format).toBeUndefined();
    });
  });

  describe("media fields", () => {
    it("media returns MediaField", () => {
      const f = media("image", { allowedTypes: ["image", "video"], multiple: true });
      expect(f.type).toBe("media");
      expect(f.multiple).toBe(true);
      expect(f.allowedTypes).toEqual(["image", "video"]);
    });

    it("upload returns UploadField", () => {
      const f = upload("file");
      expect(f.type).toBe("upload");
    });
  });

  describe("choice fields", () => {
    const options = [
      { label: "Option A", value: "a" },
      { label: "Option B", value: "b" },
    ];

    it("select returns SelectField with options", () => {
      const f = select("choice", { label: "Pick", options });
      expect(f.type).toBe("select");
      expect(f.options).toHaveLength(2);
      expect(f.options[0].value).toBe("a");
    });

    it("multiSelect returns MultiSelectField", () => {
      const f = multiSelect("tags", { options });
      expect(f.type).toBe("multiSelect");
    });

    it("radio returns RadioField", () => {
      const f = radio("option", { options });
      expect(f.type).toBe("radio");
    });

    it("checkbox returns CheckboxField", () => {
      const f = checkbox("agree");
      expect(f.type).toBe("checkbox");
    });
  });

  describe("relational fields", () => {
    it("relation returns RelationField with to and kind", () => {
      const f = relation("author", { kind: "manyToOne", to: "users" });
      expect(f.type).toBe("relation");
      expect(f.to).toBe("users");
      expect(f.kind).toBe("manyToOne");
    });

    it("relation defaults kind when omitted", () => {
      const f = relation("author", { to: "users" });
      expect(f.kind).toBeUndefined();
    });
  });

  describe("structured fields", () => {
    it("component returns ComponentField", () => {
      const f = component("seoBlock", { component: "seo" });
      expect(f.type).toBe("component");
      expect(f.component).toBe("seo");
    });

    it("component with repeatable", () => {
      const f = component("cards", { component: "card", repeatable: true });
      expect(f.repeatable).toBe(true);
    });

    it("dynamicZone returns DynamicZoneField", () => {
      const f = dynamicZone("blocks", { components: ["hero", "cta"] });
      expect(f.type).toBe("dynamicZone");
      expect(f.components).toEqual(["hero", "cta"]);
    });

    it("array returns ArrayField with nested fields", () => {
      const f = array("items", { fields: [text("name")] });
      expect(f.type).toBe("array");
      expect(f.fields).toHaveLength(1);
    });

    it("object returns ObjectField", () => {
      const f = object("meta", { fields: [text("key")] });
      expect(f.type).toBe("object");
    });

    it("group returns GroupField with nested fields", () => {
      const f = group("address", { fields: [text("street"), text("city")] });
      expect(f.type).toBe("group");
      expect(f.fields).toHaveLength(2);
    });

    it("repeater returns RepeaterField", () => {
      const f = repeater("links", { fields: [text("url")] });
      expect(f.type).toBe("repeater");
    });

    it("tabs returns TabsField", () => {
      const f = tabs("settings", {
        tabs: [
          { fields: [text("name")], label: "General" },
          { fields: [text("title")], label: "SEO" },
        ],
      });
      expect(f.type).toBe("tabs");
      expect(f.tabs).toHaveLength(2);
    });

    it("slug returns SlugField", () => {
      const f = slug("slug", { source: "title", unique: true });
      expect(f.type).toBe("slug");
      expect(f.source).toBe("title");
      expect(f.unique).toBe(true);
    });

    it("slug works without options", () => {
      const f = slug("slug");
      expect(f.source).toBeUndefined();
      expect(f.unique).toBeUndefined();
    });
  });

  describe("options passthrough", () => {
    it("passes admin config", () => {
      const f = text("title", {
        admin: { description: "The title", order: 1, width: "50%" },
      });
      expect(f.admin?.description).toBe("The title");
      expect(f.admin?.order).toBe(1);
      expect(f.admin?.width).toBe("50%");
    });

    it("passes localized flag", () => {
      const f = text("title", { localized: true });
      expect(f.localized).toBe(true);
    });
  });
});
