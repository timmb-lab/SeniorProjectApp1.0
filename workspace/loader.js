const WORKSPACE_FEATURE_SOURCES = Object.freeze({
  projects: "workspace/features/projects.js",
  staff: "workspace/features/staff.js",
  student: "workspace/features/student.js",
  "review-admin": "workspace/features/review-admin.js",
  actions: "workspace/features/actions.js",
});

const workspaceFeatureState = new Map();

function loadWorkspaceFeatureScript(name) {
  if (!WORKSPACE_FEATURE_SOURCES[name]) return Promise.reject(new Error(`Unknown workspace feature: ${name}`));
  if (workspaceFeatureState.get(name) === "loaded") return Promise.resolve();
  const current = workspaceFeatureState.get(name);
  if (current instanceof Promise) return current;
  const promise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = WORKSPACE_FEATURE_SOURCES[name];
    script.async = false;
    script.dataset.workspaceFeature = name;
    script.onload = () => {
      workspaceFeatureState.set(name, "loaded");
      resolve();
    };
    script.onerror = () => {
      workspaceFeatureState.delete(name);
      reject(new Error(`Could not load the ${name} workspace tools.`));
    };
    document.head.append(script);
  });
  workspaceFeatureState.set(name, promise);
  return promise;
}

async function ensureWorkspaceFeatureModules(names = []) {
  for (const name of [...new Set(names)]) await loadWorkspaceFeatureScript(name);
}

function workspaceFeatureNamesFor(user = null, section = "") {
  const roles = new Set((user?.roles || []).map((role) => role.role_id));
  const studentOnly = roles.size === 1 && roles.has("student");
  const features = new Set(["actions", "projects"]);
  if (studentOnly) features.add("student");
  else {
    features.add("staff");
    features.add("review-admin");
  }
  if (["student", "studentWork", "studentFeedback", "studentFinalChecklist"].includes(section)) features.add("student");
  if (["security", "adminUsers", "teacher", "mentor", "readiness"].includes(section)) features.add("review-admin");
  if (typeof viewAsStudentState !== "undefined" && viewAsStudentState?.studentId) features.add("student");
  return [...features];
}

function ensureWorkspaceModulesForSession(user = null, section = "") {
  return ensureWorkspaceFeatureModules(workspaceFeatureNamesFor(user, section));
}

function ensureWorkspaceModulesForSection(section = "", user = null) {
  return ensureWorkspaceFeatureModules(workspaceFeatureNamesFor(user, section));
}

function markWorkspaceFeaturesPreloaded(names = Object.keys(WORKSPACE_FEATURE_SOURCES)) {
  for (const name of names) workspaceFeatureState.set(name, "loaded");
}
