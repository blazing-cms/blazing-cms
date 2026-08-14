# Media Library Specification

## Purpose

Enables users to upload, store, organize, and manage media assets (images, videos, documents) within the CMS, with a dedicated admin UI. All uploads go through the Firebase Storage client SDK; metadata is stored in Firestore.

## Requirements

### Requirement: Users can upload media assets

The system SHALL allow users to upload image, video, and document files through the admin UI via the Firebase Storage client SDK.

#### Scenario: Upload via admin UI

- **WHEN** user drags a file onto the media drop zone or clicks "Upload"
- **THEN** the file is uploaded to Firebase Storage via `uploadBytesResumable` and a media record is created in Firestore with the download URL

#### Scenario: Upload rejected for unauthenticated user

- **WHEN** an unauthenticated user attempts to upload
- **THEN** the Firebase Storage Security Rules reject the upload

#### Scenario: File type validation

- **WHEN** user uploads a file with an unsupported extension
- **THEN** the client rejects the upload before sending to Storage

### Requirement: Supported file types and size limits

The system SHALL support common image formats (JPEG, PNG, WebP, GIF, SVG, AVIF), video (MP4, WebM), and documents (PDF), with configurable max file size.

#### Scenario: Configurable max size

- **WHEN** an admin sets `media.maxFileSize` to 10MB in config
- **THEN** files larger than 10MB are rejected client-side before upload

#### Scenario: Default size limit

- **WHEN** no `media.maxFileSize` is configured
- **THEN** the default limit of 20MB applies

### Requirement: Images are accessible at multiple sizes

The system SHALL make uploaded images available at their original resolution. If transformed variants are needed, users upload pre-transformed versions or use Firebase Storage's built-in image resizing (if available via the client SDK).

#### Scenario: Thumbnail generation

- **WHEN** an admin configures automatic thumbnail generation
- **THEN** thumbnails are generated via a Firebase Storage Cloud Function (requires server-side component) or users upload thumbnails manually

#### Scenario: Request specific image size

- **WHEN** an image URL includes dimension parameters
- **THEN** the URL returns a resized version using Firebase Storage's image transformation (if configured) or the original is served at full size

### Requirement: Media can be organized

The system SHALL support folders and tags for organizing media assets.

#### Scenario: Create folder

- **WHEN** user creates a folder named "Banners" via the admin UI
- **THEN** a folder document is created in the Firestore `media_folders` collection and assets can be moved into it

#### Scenario: Tag assets

- **WHEN** user adds tags "hero" and "homepage" to a media asset
- **THEN** the tags are stored as an array field on the media Firestore document and assets can be filtered by tag

#### Scenario: Filter by folder

- **WHEN** user navigates to a folder in the media library
- **THEN** only assets in that folder are displayed (Firestore `where` filter)

### Requirement: Media can be searched

The system SHALL allow searching media by filename, alt text, caption, and tags.

#### Scenario: Search by filename

- **WHEN** user types "logo" into the media search bar
- **THEN** media documents matching "logo" in filename, alt text, caption, or tags are displayed via Firestore query

### Requirement: Media assets can be replaced and deleted

The system SHALL support replacing an asset's file while preserving its ID and metadata, and deleting assets.

#### Scenario: Replace file

- **WHEN** user replaces a file on an existing media record
- **THEN** the new file is uploaded to Firebase Storage (overwriting or creating a new path) and the download URL is updated in Firestore

#### Scenario: Delete asset

- **WHEN** user deletes a media asset
- **THEN** the file is removed from Firebase Storage via `deleteObject` and the Firestore record is deleted

### Requirement: Media library shows usage information

The system SHALL display where a media asset is referenced across collections.

#### Scenario: Show usage

- **WHEN** user views a media asset detail page
- **THEN** the system queries Firestore collections (by schema) for fields referencing this asset's ID

### Requirement: Media serves with CDN caching

Firebase Storage URLs SHALL be served via a CDN by default with appropriate cache headers; no custom API layer is needed.

#### Scenario: CDN-cached URLs

- **WHEN** a media file is accessed via its Firebase Storage download URL
- **THEN** the response includes Firebase's default Cache-Control headers
