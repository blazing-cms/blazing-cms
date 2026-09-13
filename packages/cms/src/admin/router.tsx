import { rootRoute } from "@/routes/__root";
import { analyticsRoute } from "@/routes/analytics";
import { appLayoutRoute } from "@/routes/app-layout";
import { collectionDetailRoute } from "@/routes/collections/$slug";
import { editEntryRoute } from "@/routes/collections/$slug.$id.edit";
import { entryRevisionsRoute } from "@/routes/collections/$slug.$id.revisions";
import { collectionsIndexRoute } from "@/routes/collections/index";
import { newEntryRoute } from "@/routes/collections/new.$slug";
import { globalDetailRoute } from "@/routes/globals/$slug";
import { globalRevisionsRoute } from "@/routes/globals/$slug.revisions";
import { globalsIndexRoute } from "@/routes/globals/index";
import { indexRoute } from "@/routes/index";
import { loginRoute } from "@/routes/login";
import { mediaDetailRoute } from "@/routes/media/$id";
import { mediaRoute } from "@/routes/media/index";
import { notFoundRoute } from "@/routes/not-found";
import { roleDetailRoute } from "@/routes/roles/$id";
import { rolesIndexRoute } from "@/routes/roles/index";
import { newRoleRoute } from "@/routes/roles/new";
import { schemaDetailRoute } from "@/routes/schemas/$type.$slug";
import { schemasIndexRoute } from "@/routes/schemas/index";
import { newSchemaRoute } from "@/routes/schemas/new";
import { contentToolsRoute } from "@/routes/settings/content";
import { settingsIndexRoute } from "@/routes/settings/index";
import { pluginsRoute } from "@/routes/settings/plugins";
import { userDetailRoute } from "@/routes/users/$id";
import { usersIndexRoute } from "@/routes/users/index";
import { newUserRoute } from "@/routes/users/new";

export const routeTree = rootRoute.addChildren([
  loginRoute,
  notFoundRoute,
  appLayoutRoute.addChildren([
    indexRoute,
    analyticsRoute,
    collectionsIndexRoute,
    collectionDetailRoute,
    newEntryRoute,
    editEntryRoute,
    entryRevisionsRoute,
    globalsIndexRoute,
    globalDetailRoute,
    globalRevisionsRoute,
    mediaRoute,
    mediaDetailRoute,
    usersIndexRoute,
    newUserRoute,
    userDetailRoute,
    rolesIndexRoute,
    newRoleRoute,
    roleDetailRoute,
    schemasIndexRoute,
    newSchemaRoute,
    schemaDetailRoute,
    settingsIndexRoute,
    pluginsRoute,
    contentToolsRoute,
  ]),
]);
