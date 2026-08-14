# Media Library

The media library lets you upload, organize, search, and manage media assets
(images, videos, audio, documents). Files are stored in **Firebase Storage**;
metadata lives in Firestore's `media` collection.

## Enabling Media

Media is enabled by default. Configure it in `blazing-cms.config.ts`:

```ts
import { defineConfig } from "@blazing-cms/cms";

export default defineConfig({
  capabilities: {
    media: {
      enabled: true,
      maxFileSize: 25 * 1024 * 1024, // 25 MB
    },
  },
});
```

The default maximum upload size is **20 MB**.

## Upload Enforcement

Uploads are checked client-side before they are sent to Storage: files larger than
`maxFileSize` and unsupported mime types are rejected with an error. Storage
access can additionally be locked down in Firebase console Storage rules (only
allow authenticated users to read/write under `media/`).

## In the Admin Panel

### Upload

Drag and drop files onto the grid, or click **Upload** to open a file dialog.
Uploads show resumable progress. Unsupported file types are rejected before the
upload starts.

### Organize

- **Folders** — create folders from the sidebar tree and move assets between them
- **Tags** — add tags (e.g. `hero`, `homepage`) and filter by tag

### Search

Search matches filenames, alt text, captions, and tags.

### Manage

Each asset has a detail page with preview, metadata, and actions:

- Edit name, alt text, caption, tags, and folder
- **Replace** the file while keeping its ID and metadata
- **Delete** the asset (removes the binary from Storage and the record from Firestore)
- **Usage** — see which collections reference this asset

### Media Picker

The `media` and `upload` field types render a media picker in entry and global
forms, so you can reuse library assets without leaving the editor.

## SDK Usage

```ts
import { createBlazeClient } from "@blazing-cms/sdk";

const client = createBlazeClient({/* firebase config */});

// List assets in the root folder
const items = await client.media.list();

// List assets in a folder, filtered by tag and search
const heroes = await client.media.list({ folder: "banners", tag: "hero", search: "logo" });

// Upload with progress
const item = await client.media.upload(file, {
  folder: "banners",
  tags: ["hero"],
  onProgress: (percent) => console.log(`${percent}%`),
});

// Update metadata
await client.media.update(item.id, { altText: "Logo", caption: "Company logo" });

// Replace the file (keeps id/metadata)
await client.media.replace(item.id, newFile);

// Folders
const folders = await client.media.folders.list();
const folder = await client.media.folders.create("Banners", null);

// Where is this asset used?
const usage = await client.media.usage(item.id, ["posts", "pages"]);

// Delete
await client.media.remove(item.id);
```

## Data Model

| Firestore path           | Purpose                                                                                              |
| ------------------------ | ---------------------------------------------------------------------------------------------------- |
| `collections_media/{id}` | Asset metadata (name, url, storagePath, mimeType, size, folder, tags, altText, caption, dimensions). |
| `media_folders/{id}`     | Folder records (name, parent).                                                                       |
| Firebase Storage         | The binaries, under `media/` paths derived from the record.                                          |

## Disabling Media

When the `media` capability is disabled, the admin hides the media nav/route and
the SDK's `client.media` reads return empty results while writes throw
`CAPABILITY_DISABLED`.
