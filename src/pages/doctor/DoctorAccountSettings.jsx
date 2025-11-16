// src/pages/doctor/DoctorSettings.jsx
import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { authService } from "../../services/authService";
import http from "../../services/http";

export default function DoctorSettings() {
  const { user: ctxUser } = useAuth();
  const localUser = authService.getCurrentUser?.() || {};
  const currentUser = ctxUser || localUser || {};

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changingPw, setChangingPw] = useState(false);

  const [doctorId, setDoctorId] = useState("");
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: currentUser?.email || "",
    phoneNumber: "",
    specialization: "",
  });

  const [pw, setPw] = useState({ current: "", next: "", confirm: "" });

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        setLoading(true);

        // Expect backend: GET /api/doctors/me (wired under /doctors in http baseURL)
        const res = await http.get("/doctors/me");
        const me = res?.data?.data || res?.data || {};

        if (!mounted) return;

        setDoctorId(me.id);
        const email = currentUser?.email || me?.user?.email || "";

        setForm({
          firstName: me.firstName || "",
          lastName: me.lastName || "",
          email,
          phoneNumber: me.phoneNumber || "",
          specialization: me.specialization || "",
        });
      } catch (e) {
        console.error("Failed to load doctor profile", e);
        alert(
          e?.response?.data?.message ||
            e.message ||
            "Failed to load your profile"
        );
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.email]);

  const onChangeField = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const onSave = async (e) => {
    e.preventDefault();
    if (!doctorId) return;

    try {
      setSaving(true);

      // Expect backend: PUT /api/doctors/:id
      await http.put(`/doctors/${doctorId}`, {
        firstName: form.firstName,
        lastName: form.lastName,
        phoneNumber: form.phoneNumber,
        specialization: form.specialization,
      });

      alert("Profile updated");
    } catch (e) {
      console.error("Failed to update doctor profile", e);
      alert(
        e?.response?.data?.message ||
          e.message ||
          "Failed to update profile"
      );
    } finally {
      setSaving(false);
    }
  };

  const onChangePw = async (e) => {
    e.preventDefault();
    if (!pw.next || pw.next !== pw.confirm) {
      alert("New passwords do not match");
      return;
    }

    try {
      setChangingPw(true);
      await authService.changePassword(pw.current, pw.next);
      setPw({ current: "", next: "", confirm: "" });
      alert("Password updated");
    } catch (e) {
      console.error("Failed to change password", e);
      alert(
        e?.response?.data?.message ||
          e.message ||
          "Failed to change password"
      );
    } finally {
      setChangingPw(false);
    }
  };

  return (
    <div className="mx-auto max-w-[960px] px-2 sm:px-4 py-6">
      <h1 className="text-[28px] font-bold tracking-tight text-gray-900 mb-4">
        Account Settings
      </h1>

      {/* Personal Info */}
      <section className="card-soft p-6 mb-8">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900">
            Profile information
          </h2>
          <p className="text-sm text-gray-500">
            Keep your contact details and specialty up to date so patients see
            the correct information.
          </p>
        </div>

        {loading ? (
          <div className="text-gray-500">Loading…</div>
        ) : (
          <form
            onSubmit={onSave}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                First name
              </label>
              <input
                name="firstName"
                value={form.firstName}
                onChange={onChangeField}
                className="input w-full focus:ring-[var(--ring-soft)] focus:border-sky-400"
                placeholder="First name"
                autoComplete="given-name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Last name
              </label>
              <input
                name="lastName"
                value={form.lastName}
                onChange={onChangeField}
                className="input w-full focus:ring-[var(--ring-soft)] focus:border-sky-400"
                placeholder="Last name"
                autoComplete="family-name"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email address
              </label>
              <input
                type="email"
                name="email"
                value={form.email}
                readOnly
                className="input w-full bg-gray-50 focus:ring-[var(--ring-soft)] focus:border-sky-300"
                placeholder="name@example.com"
                autoComplete="email"
              />
              <p className="mt-1 text-xs text-gray-500">
                Email is managed by the administrator and cannot be changed
                here.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone number
              </label>
              <input
                name="phoneNumber"
                value={form.phoneNumber}
                onChange={onChangeField}
                className="input w-full focus:ring-[var(--ring-soft)] focus:border-sky-400"
                placeholder="(555) 123-4567"
                autoComplete="tel"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Specialization
              </label>
              <input
                name="specialization"
                value={form.specialization}
                onChange={onChangeField}
                className="input w-full focus:ring-[var(--ring-soft)] focus:border-sky-400"
                placeholder="e.g. Cardiology, Orthopedics"
                autoComplete="off"
              />
            </div>

            <div className="md:col-span-2 mt-2">
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 rounded-lg bg-[var(--brand-600)] text-white hover:bg-[var(--brand-700)] focus:outline-none focus:ring-2 focus:ring-[var(--ring-soft)] disabled:opacity-60"
              >
                {saving ? "Saving…" : "Save changes"}
              </button>
            </div>
          </form>
        )}
      </section>

      {/* Change Password */}
      <section className="card-soft p-6">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900">
            Change password
          </h2>
          <p className="text-sm text-gray-500">
            Use a strong password that you do not reuse on other sites.
          </p>
        </div>

        <form
          onSubmit={onChangePw}
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Current password
            </label>
            <input
              type="password"
              name="current"
              value={pw.current}
              onChange={(e) =>
                setPw((prev) => ({ ...prev, current: e.target.value }))
              }
              className="input w-full focus:ring-[var(--ring-soft)] focus:border-sky-400"
              placeholder="Current password"
              autoComplete="current-password"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              New password
            </label>
            <input
              type="password"
              name="next"
              value={pw.next}
              onChange={(e) =>
                setPw((prev) => ({ ...prev, next: e.target.value }))
              }
              className="input w-full focus:ring-[var(--ring-soft)] focus:border-sky-400"
              placeholder="New password"
              autoComplete="new-password"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirm new password
            </label>
            <input
              type="password"
              name="confirm"
              value={pw.confirm}
              onChange={(e) =>
                setPw((prev) => ({ ...prev, confirm: e.target.value }))
              }
              className="input w-full focus:ring-[var(--ring-soft)] focus:border-sky-400"
              placeholder="Confirm new password"
              autoComplete="new-password"
            />
          </div>

          <div className="md:col-span-2 mt-2">
            <button
              type="submit"
              disabled={changingPw}
              className="px-4 py-2 rounded-lg bg-[var(--brand-600)] text-white hover:bg-[var(--brand-700)] focus:outline-none focus:ring-2 focus:ring-[var(--ring-soft)] disabled:opacity-60"
            >
              {changingPw ? "Updating…" : "Update password"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
