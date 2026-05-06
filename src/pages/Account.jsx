import { useEffect, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import {
  changePassword,
  getAuthErrorMessage,
  me,
  updateMe,
} from "../services/authApi";

function extractFieldErrors(error) {
  const responseData = error?.response?.data;
  const fieldErrors = {};
  let detail = null;

  if (typeof responseData === "string" && responseData.trim()) {
    detail = responseData.trim();
    return { fieldErrors, detail };
  }

  if (!responseData || typeof responseData !== "object") {
    return { fieldErrors, detail };
  }

  for (const [key, value] of Object.entries(responseData)) {
    if (key === "detail" && typeof value === "string" && value.trim()) {
      detail = value.trim();
      continue;
    }

    if (Array.isArray(value) && value.length > 0) {
      fieldErrors[key] = value.map((item) => String(item));
      continue;
    }

    if (typeof value === "string" && value.trim()) {
      fieldErrors[key] = [value.trim()];
    }
  }

  return { fieldErrors, detail };
}

function getFirstFieldError(fieldErrors, fieldName) {
  return fieldErrors?.[fieldName]?.[0] || null;
}

function InlineNotice({ tone = "default", children }) {
  const toneClasses =
    tone === "success"
      ? "border-emerald-400/20 bg-emerald-500/10 text-emerald-100"
      : tone === "danger"
        ? "border-red-400/20 bg-red-500/10 text-red-100"
        : "border-white/10 bg-white/[0.04] text-slate-100";

  return (
    <div
      className={`rounded-[24px] border px-4 py-3 text-sm leading-6 ${toneClasses}`}
      role="status"
    >
      {children}
    </div>
  );
}

function FieldError({ children }) {
  if (!children) {
    return null;
  }

  return <p className="mt-2 text-sm text-red-200">{children}</p>;
}

export default function Account() {
  const { family, profile, syncSession, user } = useAuth();

  const [profileForm, setProfileForm] = useState({
    username: "",
    first_name: "",
    last_name: "",
    email: "",
  });
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState(null);
  const [profileSuccess, setProfileSuccess] = useState(null);
  const [profileFieldErrors, setProfileFieldErrors] = useState({});

  const [passwordForm, setPasswordForm] = useState({
    current_password: "",
    new_password: "",
    new_password_confirm: "",
  });
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState(null);
  const [passwordSuccess, setPasswordSuccess] = useState(null);
  const [passwordFieldErrors, setPasswordFieldErrors] = useState({});

  useEffect(() => {
    let active = true;

    async function loadAccount() {
      try {
        setProfileLoading(true);
        setProfileError(null);
        setProfileSuccess(null);

        const data = await me();
        if (!active) {
          return;
        }

        syncSession(data);

        const nextUser = data?.user ?? {};
        setProfileForm({
          username: nextUser.username || user?.username || "",
          first_name: nextUser.first_name || "",
          last_name: nextUser.last_name || "",
          email: nextUser.email || "",
        });
      } catch (error) {
        if (!active) {
          return;
        }

        setProfileError(
          getAuthErrorMessage(error, "No se pudo cargar tu cuenta")
        );
      } finally {
        if (active) {
          setProfileLoading(false);
        }
      }
    }

    loadAccount();

    return () => {
      active = false;
    };
  }, [syncSession, user?.username]);

  function handleProfileChange(field) {
    return (event) => {
      const value = event.target.value;
      setProfileForm((current) => ({ ...current, [field]: value }));
      setProfileFieldErrors((current) => ({ ...current, [field]: null }));
      setProfileError(null);
      setProfileSuccess(null);
    };
  }

  function handlePasswordChange(field) {
    return (event) => {
      const value = event.target.value;
      setPasswordForm((current) => ({ ...current, [field]: value }));
      setPasswordFieldErrors((current) => ({ ...current, [field]: null }));
      setPasswordError(null);
      setPasswordSuccess(null);
    };
  }

  async function handleProfileSubmit(event) {
    event.preventDefault();
    setProfileError(null);
    setProfileSuccess(null);
    setProfileFieldErrors({});

    try {
      setProfileSaving(true);

      const payload = {
        first_name: profileForm.first_name.trim(),
        last_name: profileForm.last_name.trim(),
        email: profileForm.email.trim(),
      };

      const data = await updateMe(payload);
      syncSession(data);

      const nextUser = data?.user ?? {};
      setProfileForm({
        username: nextUser.username || profileForm.username,
        first_name: nextUser.first_name || "",
        last_name: nextUser.last_name || "",
        email: nextUser.email || "",
      });
      setProfileSuccess("Tus datos personales se actualizaron correctamente.");
    } catch (error) {
      const { fieldErrors, detail } = extractFieldErrors(error);
      setProfileFieldErrors(fieldErrors);
      setProfileError(
        detail || getAuthErrorMessage(error, "No se pudieron guardar tus datos")
      );
    } finally {
      setProfileSaving(false);
    }
  }

  async function handlePasswordSubmit(event) {
    event.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);
    setPasswordFieldErrors({});

    try {
      setPasswordSaving(true);

      const payload = {
        current_password: passwordForm.current_password,
        new_password: passwordForm.new_password,
        new_password_confirm: passwordForm.new_password_confirm,
      };

      const data = await changePassword(payload);
      setPasswordForm({
        current_password: "",
        new_password: "",
        new_password_confirm: "",
      });
      setPasswordSuccess(
        data?.detail || "La contraseña se actualizó correctamente."
      );
    } catch (error) {
      const { fieldErrors, detail } = extractFieldErrors(error);
      setPasswordFieldErrors(fieldErrors);
      setPasswordError(
        detail ||
          getAuthErrorMessage(error, "No se pudo cambiar la contraseña")
      );
    } finally {
      setPasswordSaving(false);
    }
  }

  const role = profile?.role || "member";
  const familyName = family?.name || "Sin familia";

  return (
    <section className="min-w-0 space-y-6 sm:space-y-8">
      <header className="space-y-3">
        <p className="text-[11px] uppercase tracking-[0.28em] text-slate-500">
          Configuración
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              Mi cuenta
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
              Gestiona tus datos personales y actualiza tu contraseña sin salir
              del entorno de la app.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-slate-200">
              {familyName}
            </span>
            <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-slate-200">
              {role}
            </span>
          </div>
        </div>
      </header>

      <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
        <article className="min-w-0 rounded-3xl border border-white/8 bg-white/[0.04] p-4 shadow-[0_18px_40px_rgba(0,0,0,0.22)] sm:p-6">
          <div className="mb-5 space-y-2">
            <h2 className="text-base font-semibold tracking-tight text-white sm:text-lg">
              Datos personales
            </h2>
            <p className="text-sm text-slate-400">
              Edita tu nombre, apellidos y correo electrónico.
            </p>
          </div>

          {profileLoading ? (
            <div className="rounded-[24px] border border-dashed border-white/10 bg-black/20 p-6 text-sm text-slate-400">
              Cargando tus datos...
            </div>
          ) : (
            <form className="space-y-5" onSubmit={handleProfileSubmit}>
              {profileError ? (
                <InlineNotice tone="danger">{profileError}</InlineNotice>
              ) : null}
              {profileSuccess ? (
                <InlineNotice tone="success">{profileSuccess}</InlineNotice>
              ) : null}

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-slate-200">
                    Usuario
                  </label>
                  <input
                    type="text"
                    value={profileForm.username}
                    readOnly
                    className="mt-2 w-full cursor-not-allowed rounded-[24px] border border-white/10 bg-black/30 px-4 py-3.5 text-sm text-slate-300 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-200">
                    Nombre
                  </label>
                  <input
                    type="text"
                    autoComplete="given-name"
                    value={profileForm.first_name}
                    onChange={handleProfileChange("first_name")}
                    className="mt-2 w-full rounded-[24px] border border-white/10 bg-black/20 px-4 py-3.5 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-blue-400/50"
                    placeholder="Tu nombre"
                  />
                  <FieldError>
                    {getFirstFieldError(profileFieldErrors, "first_name")}
                  </FieldError>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-200">
                    Apellidos
                  </label>
                  <input
                    type="text"
                    autoComplete="family-name"
                    value={profileForm.last_name}
                    onChange={handleProfileChange("last_name")}
                    className="mt-2 w-full rounded-[24px] border border-white/10 bg-black/20 px-4 py-3.5 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-blue-400/50"
                    placeholder="Tus apellidos"
                  />
                  <FieldError>
                    {getFirstFieldError(profileFieldErrors, "last_name")}
                  </FieldError>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-slate-200">
                    Email
                  </label>
                  <input
                    type="email"
                    autoComplete="email"
                    value={profileForm.email}
                    onChange={handleProfileChange("email")}
                    className="mt-2 w-full rounded-[24px] border border-white/10 bg-black/20 px-4 py-3.5 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-blue-400/50"
                    placeholder="tu@email.com"
                  />
                  <FieldError>
                    {getFirstFieldError(profileFieldErrors, "email")}
                  </FieldError>
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-slate-500">
                  Username, familia y rol se muestran como referencia de la sesión.
                </p>
                <button
                  type="submit"
                  disabled={profileSaving}
                  className="inline-flex items-center justify-center rounded-[24px] bg-blue-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {profileSaving ? "Guardando..." : "Guardar cambios"}
                </button>
              </div>
            </form>
          )}
        </article>

        <article className="min-w-0 rounded-3xl border border-white/8 bg-white/[0.04] p-4 shadow-[0_18px_40px_rgba(0,0,0,0.22)] sm:p-6">
          <div className="mb-5 space-y-2">
            <h2 className="text-base font-semibold tracking-tight text-white sm:text-lg">
              Cambio de contraseña
            </h2>
            <p className="text-sm text-slate-400">
              Introduce tu contraseña actual y define una nueva contraseña segura.
            </p>
          </div>

          <form className="space-y-5" onSubmit={handlePasswordSubmit}>
            {passwordError ? (
              <InlineNotice tone="danger">{passwordError}</InlineNotice>
            ) : null}
            {passwordSuccess ? (
              <InlineNotice tone="success">{passwordSuccess}</InlineNotice>
            ) : null}

            <div>
              <label className="block text-sm font-medium text-slate-200">
                Contraseña actual
              </label>
              <input
                type="password"
                autoComplete="current-password"
                value={passwordForm.current_password}
                onChange={handlePasswordChange("current_password")}
                className="mt-2 w-full rounded-[24px] border border-white/10 bg-black/20 px-4 py-3.5 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-blue-400/50"
                placeholder="Tu contraseña actual"
              />
              <FieldError>
                {getFirstFieldError(passwordFieldErrors, "current_password")}
              </FieldError>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-200">
                Nueva contraseña
              </label>
              <input
                type="password"
                autoComplete="new-password"
                value={passwordForm.new_password}
                onChange={handlePasswordChange("new_password")}
                className="mt-2 w-full rounded-[24px] border border-white/10 bg-black/20 px-4 py-3.5 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-blue-400/50"
                placeholder="Nueva contraseña"
              />
              <FieldError>
                {getFirstFieldError(passwordFieldErrors, "new_password")}
              </FieldError>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-200">
                Confirmar nueva contraseña
              </label>
              <input
                type="password"
                autoComplete="new-password"
                value={passwordForm.new_password_confirm}
                onChange={handlePasswordChange("new_password_confirm")}
                className="mt-2 w-full rounded-[24px] border border-white/10 bg-black/20 px-4 py-3.5 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-blue-400/50"
                placeholder="Repite la nueva contraseña"
              />
              <FieldError>
                {getFirstFieldError(passwordFieldErrors, "new_password_confirm")}
              </FieldError>
            </div>

            <div className="flex items-center justify-end">
              <button
                type="submit"
                disabled={passwordSaving}
                className="inline-flex items-center justify-center rounded-[24px] bg-emerald-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {passwordSaving ? "Actualizando..." : "Cambiar contraseña"}
              </button>
            </div>
          </form>
        </article>
      </div>
    </section>
  );
}
