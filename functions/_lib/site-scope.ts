import type { Env, RoleAssignment, RoleId, UserAccount } from "../_types.ts";
import { getAccessibleSiteIds } from "./permissions.ts";

export const DEMO_DEFAULT_SITE_ID = "site-desert-valley-high";

export interface SiteScopeContext {
  roles: RoleAssignment[];
  roleIds: RoleId[];
  primaryRole: RoleId | "role_pending";
}

export interface SiteRow {
  id: string;
  tenant_id: string;
  tenant_name: string;
  name: string;
  school_year: string | null;
}

export interface SiteResponse {
  tenantId: string;
  tenantName: string;
  siteId: string;
  siteName: string;
  schoolYear: string;
}

export type SiteSelection =
  | { kind: "ok"; site: SiteRow; accessibleSites: SiteResponse[]; selectionMode: string }
  | { kind: "denied"; reason: string; accessibleSites: SiteResponse[] }
  | { kind: "selectionRequired"; accessibleSites: SiteResponse[] };

export async function resolveSiteSelection({
  env,
  user,
  context,
  requestedSiteId,
  canViewSite,
  defaultSiteRoleIds = ["platform_admin", "global_admin", "admin", "org_admin"],
}: {
  env: Env;
  user: UserAccount;
  context: SiteScopeContext;
  requestedSiteId: string;
  canViewSite: (siteId: string) => Promise<boolean>;
  defaultSiteRoleIds?: Array<RoleId | "role_pending">;
}): Promise<SiteSelection> {
  const accessibleSiteIds = await getAccessibleSiteIds(env, user);
  const accessibleSites = (await loadSitesByIds(env, accessibleSiteIds)).map(siteResponse);

  if (requestedSiteId) {
    if (!await canViewSite(requestedSiteId)) {
      return { kind: "denied", reason: "site_not_accessible", accessibleSites };
    }
    const site = await loadSite(env, requestedSiteId);
    if (!site) return { kind: "denied", reason: "site_not_accessible", accessibleSites };
    return { kind: "ok", site, accessibleSites, selectionMode: "requested" };
  }

  if (accessibleSites.length === 0) {
    return { kind: "denied", reason: "no_accessible_sites", accessibleSites };
  }

  if (accessibleSites.length === 1) {
    const site = await loadSite(env, accessibleSites[0].siteId);
    if (!site) return { kind: "denied", reason: "site_not_accessible", accessibleSites };
    return { kind: "ok", site, accessibleSites, selectionMode: "single_accessible_site" };
  }

  if (
    defaultSiteRoleIds.includes(context.primaryRole)
    && accessibleSites.some((site) => site.siteId === DEMO_DEFAULT_SITE_ID)
  ) {
    const site = await loadSite(env, DEMO_DEFAULT_SITE_ID);
    if (site) return { kind: "ok", site, accessibleSites, selectionMode: "demo_default_site" };
  }

  return { kind: "selectionRequired", accessibleSites };
}

export async function loadSite(env: Env, siteId: string): Promise<SiteRow | null> {
  return env.DB.prepare(
    `SELECT
       sites.id,
       sites.tenant_id,
       tenants.name AS tenant_name,
       sites.name,
       sites.school_year
     FROM sites
     JOIN tenants ON tenants.id = sites.tenant_id
      AND tenants.status = 'active'
     WHERE sites.id = ?
      AND sites.status = 'active'
     LIMIT 1`,
  ).bind(siteId).first<SiteRow>();
}

export async function loadSitesByIds(env: Env, siteIds: string[]): Promise<SiteRow[]> {
  if (!siteIds.length) return [];
  const placeholders = siteIds.map(() => "?").join(", ");
  const rows = await env.DB.prepare(
    `SELECT
       sites.id,
       sites.tenant_id,
       tenants.name AS tenant_name,
       sites.name,
       sites.school_year
     FROM sites
     JOIN tenants ON tenants.id = sites.tenant_id
      AND tenants.status = 'active'
     WHERE sites.id IN (${placeholders})
      AND sites.status = 'active'
     ORDER BY sites.name`,
  ).bind(...siteIds).all<SiteRow>();
  return rows.results || [];
}

export function siteResponse(site: SiteRow): SiteResponse {
  return {
    tenantId: site.tenant_id,
    tenantName: site.tenant_name,
    siteId: site.id,
    siteName: site.name,
    schoolYear: site.school_year || "",
  };
}

export function isReadOnlyViewer(roleIds: RoleId[]): boolean {
  const mutationRole = roleIds.some((roleId) => (
    roleId === "platform_admin"
    || roleId === "admin"
    || roleId === "global_admin"
    || roleId === "org_admin"
    || roleId === "site_admin"
  ));
  return (roleIds.includes("viewer") || roleIds.includes("administration")) && !mutationRole;
}

export function cleanId(value: string | null): string {
  const trimmed = String(value || "").trim();
  return /^[a-zA-Z0-9_.:-]+$/.test(trimmed) ? trimmed : "";
}
