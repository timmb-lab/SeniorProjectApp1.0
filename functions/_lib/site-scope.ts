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
  brand_theme?: string | null;
}

export interface SiteResponse {
  tenantId: string;
  tenantName: string;
  siteId: string;
  siteName: string;
  schoolYear: string;
  brandTheme: SiteBrandTheme;
}

export type SiteBrandTheme = "default" | "east-tech" | "desert-valley" | "canyon-ridge" | "north-valley";

const SITE_BRAND_THEMES = new Set<SiteBrandTheme>([
  "default",
  "east-tech",
  "desert-valley",
  "canyon-ridge",
  "north-valley",
]);

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
  defaultSiteRoleIds = ["platform_admin", "global_admin", "admin"],
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
  const site = await env.DB.prepare(
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
  if (!site) return null;
  const themes = await loadSiteBrandThemesByIds(env, [site.id]);
  return { ...site, brand_theme: themes.get(site.id) || "default" };
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
  const sites = rows.results || [];
  const themes = await loadSiteBrandThemesByIds(env, sites.map((site) => site.id));
  return sites.map((site) => ({ ...site, brand_theme: themes.get(site.id) || "default" }));
}

export async function loadSiteBrandThemesByIds(env: Env, siteIds: string[]): Promise<Map<string, SiteBrandTheme>> {
  const themes = new Map<string, SiteBrandTheme>();
  if (!siteIds.length) return themes;
  try {
    const placeholders = siteIds.map(() => "?").join(", ");
    const rows = await env.DB.prepare(
      `SELECT site_id, theme_key
       FROM site_branding
       WHERE site_id IN (${placeholders})`,
    ).bind(...siteIds).all<{ site_id: string; theme_key: string }>();
    for (const row of rows.results || []) themes.set(row.site_id, cleanSiteBrandTheme(row.theme_key));
  } catch {
    // Older local fixtures can still render with the neutral theme before migration 0030 is applied.
  }
  return themes;
}

export async function loadSiteBrandTheme(env: Env, siteId: string): Promise<SiteBrandTheme> {
  return (await loadSiteBrandThemesByIds(env, siteId ? [siteId] : [])).get(siteId) || "default";
}

export function cleanSiteBrandTheme(value: unknown): SiteBrandTheme {
  const theme = String(value || "").trim() as SiteBrandTheme;
  return SITE_BRAND_THEMES.has(theme) ? theme : "default";
}

export function siteResponse(site: SiteRow): SiteResponse {
  return {
    tenantId: site.tenant_id,
    tenantName: site.tenant_name,
    siteId: site.id,
    siteName: site.name,
    schoolYear: site.school_year || "",
    brandTheme: cleanSiteBrandTheme(site.brand_theme),
  };
}

export function isReadOnlyViewer(roleIds: RoleId[]): boolean {
  const mutationRole = roleIds.some((roleId) => (
    roleId === "platform_admin"
    || roleId === "admin"
    || roleId === "global_admin"
    || roleId === "site_admin"
    || roleId === "administration"
    || roleId === "program_teacher"
  ));
  return roleIds.includes("viewer") && !mutationRole;
}

export function cleanId(value: string | null): string {
  const trimmed = String(value || "").trim();
  return /^[a-zA-Z0-9_.:-]+$/.test(trimmed) ? trimmed : "";
}
