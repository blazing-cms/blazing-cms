/* eslint-disable no-secrets/no-secrets */
// @vitest-environment jsdom
// packages/cms/src/admin/lib/import-export/formats/xml.test.ts

import { describe, expect, it } from "vitest";

import { xmlHandler } from "./xml";

function file(name: string, content: string): File {
  return new File([content], name, { type: "application/xml" });
}

describe("xmlHandler", () => {
  describe("parse", () => {
    it("parses valid XML document", async () => {
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
<export formatVersion="1" exportedAt="2026-01-01T00:00:00Z">
  <collections>
    <collection slug="posts">
      <entry id="abc">
        <title>Hello</title>
        <slug>hello-world</slug>
      </entry>
    </collection>
  </collections>
  <globals>
    <global slug="site">
      <name>My Site</name>
    </global>
  </globals>
</export>`;
      const result = await xmlHandler.parse(file("export.xml", xml));
      expect(result.formatVersion).toBe(1);
      expect(result.collections.posts!).toHaveLength(1);
      expect(result.collections.posts![0]!.title).toBe("Hello");
      expect(result.globals.site!.name).toBe("My Site");
    });

    it("throws on invalid XML", async () => {
      const xml = "<invalid><unclosed>";
      await expect(xmlHandler.parse(file("bad.xml", xml))).rejects.toThrow("Invalid XML");
    });

    it("throws when root is not <export>", async () => {
      const xml = `<?xml version="1.0"?><root></root>`;
      await expect(xmlHandler.parse(file("wrong.xml", xml))).rejects.toThrow(
        "Root element must be <export>",
      );
    });

    it("handles nested elements", async () => {
      const xml = `<?xml version="1.0"?>
<export formatVersion="1" exportedAt="2026-01-01T00:00:00Z">
  <collections>
    <collection slug="posts">
      <entry id="1">
        <meta>
          <title>SEO Title</title>
        </meta>
      </entry>
    </collection>
  </collections>
  <globals></globals>
</export>`;
      const result = await xmlHandler.parse(file("export.xml", xml));
      expect(result.collections.posts![0]!.meta).toEqual({ title: "SEO Title" });
    });

    it("handles repeated tags as arrays", async () => {
      const xml = `<?xml version="1.0"?>
<export formatVersion="1" exportedAt="2026-01-01T00:00:00Z">
  <collections>
    <collection slug="posts">
      <entry id="1">
        <tag>a</tag>
        <tag>b</tag>
        <tag>c</tag>
      </entry>
    </collection>
  </collections>
  <globals></globals>
</export>`;
      const result = await xmlHandler.parse(file("export.xml", xml));
      expect(result.collections.posts![0]!.tag).toEqual(["a", "b", "c"]);
    });
  });

  describe("serialize", () => {
    it("exports to valid XML structure", () => {
      const doc = {
        collections: {
          posts: [{ id: "1", title: "Hello" }],
        },
        exportedAt: "2026-01-01T00:00:00Z",
        formatVersion: 1,
        globals: {},
      };
      const result = xmlHandler.serialize(doc);
      expect(result.content).toContain('<?xml version="1.0" encoding="UTF-8"?>');
      expect(result.content).toContain('<export formatVersion="1"');
      expect(result.content).toContain('<collection slug="posts">');
      expect(result.content).toContain('<entry id="1">');
      expect(result.content).toContain("<title>Hello</title>");
    });

    it("escapes HTML content", () => {
      const doc = {
        collections: { posts: [{ content: "<p>Hello</p>", id: "1" }] },
        exportedAt: "2026-01-01T00:00:00Z",
        formatVersion: 1,
        globals: {},
      };
      const result = xmlHandler.serialize(doc);
      expect(result.content).toContain("&lt;p&gt;Hello&lt;/p&gt;");
    });

    it("handles nested objects", () => {
      const doc = {
        collections: { posts: [{ id: "1", meta: { title: "SEO" } }] },
        exportedAt: "2026-01-01T00:00:00Z",
        formatVersion: 1,
        globals: {},
      };
      const result = xmlHandler.serialize(doc);
      expect(result.content).toContain("<meta>");
      expect(result.content).toContain("<title>SEO</title>");
    });
  });
});
