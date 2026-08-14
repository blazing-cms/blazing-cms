import type { FeatureFlags } from "@blazing-cms/types";

import { initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";

import type {
  AnalyticsApi,
  BlazeClientConfig,
  CollectionApi,
  GlobalApi,
  AuthApi,
  MediaApi,
  NotificationsApi,
  RbacApi,
  VersionsApi,
  WorkflowApi,
} from "./types.js";

import { createAnalyticsApi } from "./analytics.js";
import { createAuthApi } from "./auth.js";
import { createCollectionApi } from "./collection.js";
import { BlazeError } from "./errors.js";
import { createGlobalApi } from "./global.js";
import { createMediaApi } from "./media.js";
import { createNotificationsApi } from "./notifications.js";
import { createRbacApi } from "./rbac.js";
import { createVersionsApi } from "./versions.js";
import { createWorkflowApi } from "./workflow.js";

export interface BlazeClient {
  /** Access a Firestore collection by name */
  collection(name: string): CollectionApi;
  /** Globals API (single-document collections) */
  globals: GlobalApi;
  /** Firebase Auth API */
  auth: AuthApi;
  /** Dashboard analytics queries */
  analytics: AnalyticsApi;
  /** Media library: uploads, metadata, folders, usage */
  media: MediaApi;
  /** Roles, user-role assignments, and precomputed grants */
  rbac: RbacApi;
  /** Content versioning: snapshots, diffs, rollback, pruning */
  versions: VersionsApi;
  /** Content workflow: transitions, reviewer assignment, history */
  workflow: WorkflowApi;
  /** In-app notifications for the signed-in user */
  notifications: NotificationsApi;
  /** Raw Firebase instances for advanced use */
  app: FirebaseApp;
  db: Firestore;
  storage: FirebaseStorage;
}

let appSingleton: FirebaseApp | null = null;

const DEFAULT_FEATURES: FeatureFlags = {
  analytics: true,
  content: true,
  media: true,
  notifications: true,
  rbac: true,
  versioning: true,
  workflow: true,
};

function featuresOf(config: BlazeClientConfig): FeatureFlags {
  return { ...DEFAULT_FEATURES, ...config.features };
}

function disabled(label: string): () => void {
  let warned = false;
  return () => {
    if (!warned) {
      warned = true;
      console.warn(
        `[blazing-cms] The "${label}" capability is disabled. Read methods return empty results and writes throw.`,
      );
    }
  };
}

function disabledWrite(label: string): () => Promise<never> {
  const warn = disabled(label);
  return async () => {
    warn();
    throw new BlazeError(`The "${label}" capability is disabled.`, "CAPABILITY_DISABLED");
  };
}

function disabledCollectionApi(warn: () => void): CollectionApi {
  return {
    create: () => {
      warn();
      throw new BlazeError("The content capability is disabled.", "CAPABILITY_DISABLED");
    },
    delete: () => {
      warn();
      throw new BlazeError("The content capability is disabled.", "CAPABILITY_DISABLED");
    },
    findById: async () => null,
    findMany: async () => ({ data: [], hasMore: false }),
    update: () => {
      warn();
      throw new BlazeError("The content capability is disabled.", "CAPABILITY_DISABLED");
    },
  };
}

function disabledGlobalApi(warn: () => void): GlobalApi {
  return {
    get: async () => null,
    upsert: () => {
      warn();
      throw new BlazeError("The content capability is disabled.", "CAPABILITY_DISABLED");
    },
  };
}

function disabledMediaApi(warn: () => void): MediaApi {
  const write = disabledWrite("media");
  return {
    folders: {
      create: write,
      list: async () => {
        warn();
        return [];
      },
      remove: write,
      rename: write,
    },
    get: async () => {
      warn();
      return null;
    },
    list: async () => {
      warn();
      return [];
    },
    remove: write,
    replace: write,
    update: write,
    upload: write,
    usage: async () => {
      warn();
      return [];
    },
  };
}

function disabledRbacApi(warn: () => void): RbacApi {
  const write = disabledWrite("rbac");
  return {
    assignRoles: write,
    createRole: write,
    deleteRole: write,
    getRole: async () => {
      warn();
      return null;
    },
    getUserRoles: async () => {
      warn();
      return null;
    },
    listRoles: async () => {
      warn();
      return [];
    },
    updateRole: write,
  };
}

function disabledVersionsApi(warn: () => void): VersionsApi {
  const write = disabledWrite("versioning");
  return {
    diff: async () => {
      warn();
      return [];
    },
    get: async () => {
      warn();
      return null;
    },
    list: async () => {
      warn();
      return [];
    },
    prune: async () => {
      warn();
      return 0;
    },
    remove: write,
    restore: write,
  };
}

function disabledWorkflowApi(warn: () => void): WorkflowApi {
  const write = disabledWrite("workflow");
  return {
    assignReviewer: write,
    history: async () => {
      warn();
      return [];
    },
    transition: write,
  };
}

function disabledNotificationsApi(warn: () => void): NotificationsApi {
  return {
    list: async () => [],
    markRead: () => {
      warn();
      throw new BlazeError("The notifications capability is disabled.", "CAPABILITY_DISABLED");
    },
  };
}

export function createBlazeClient(config: BlazeClientConfig): BlazeClient {
  try {
    if (!appSingleton) {
      appSingleton = initializeApp(config);
    }
  } catch {
    appSingleton = initializeApp(config, "blazing-cms-sdk");
  }

  const app = appSingleton;
  const db = getFirestore(app);
  const auth = getAuth(app);
  const storage = getStorage(app);

  const features = featuresOf(config);
  const collections = new Map<string, CollectionApi>();

  return {
    analytics: createAnalyticsApi(db, {
      ...config.analytics,
      enabled: config.analytics?.enabled ?? features.analytics,
    }),
    app,
    auth: createAuthApi(auth),
    collection(name: string): CollectionApi {
      if (!features.content) {
        return disabledCollectionApi(disabled("content"));
      }
      let api = collections.get(name);
      if (!api) {
        api = createCollectionApi(db, name);
        collections.set(name, api);
      }
      return api;
    },
    db,
    globals: features.content ? createGlobalApi(db) : disabledGlobalApi(disabled("content")),
    media: features.media
      ? createMediaApi(db, storage, config.media)
      : disabledMediaApi(disabled("media")),
    notifications: features.notifications
      ? createNotificationsApi(db)
      : disabledNotificationsApi(disabled("notifications")),
    rbac: features.rbac ? createRbacApi(db) : disabledRbacApi(disabled("rbac")),
    storage,
    versions: features.versioning
      ? createVersionsApi(db)
      : disabledVersionsApi(disabled("versioning")),
    workflow: features.workflow ? createWorkflowApi(db) : disabledWorkflowApi(disabled("workflow")),
  };
}
