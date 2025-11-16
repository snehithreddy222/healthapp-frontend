// src/pages/Login.jsx
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, Link, useLocation } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import { FiUser, FiLock, FiShield } from "react-icons/fi";

import Input from "../components/common/Input";
import Button from "../components/common/Button";
import { useAuth } from "../context/AuthContext";
import { patientService } from "../services/patientService";

const HEALTHAPP_LOGIN_DOMAIN = "@healthapp";
const LAST_USERNAME_KEY = "lastLoginUsername";

export default function Login() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
  } = useForm();
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [authError, setAuthError] = useState("");

  const usernameValue = watch("username") || "";

  useEffect(() => {
    const fromState = location.state?.username;
    const fromStorage = localStorage.getItem(LAST_USERNAME_KEY);
    const initial = fromState || fromStorage || "";
    if (initial) {
      setValue("username", initial);
    }
  }, [location.state, setValue]);

  const onSubmit = async (data) => {
    setAuthError("");
    try {
      let identifier = (data.username || "").trim();

      if (
        identifier
          .toLowerCase()
          .endsWith(HEALTHAPP_LOGIN_DOMAIN.toLowerCase())
      ) {
        identifier = identifier.slice(
          0,
          -HEALTHAPP_LOGIN_DOMAIN.length
        );
      }

      const out = await login({
        username: identifier,
        password: data.password,
      });

      if (out?.success) {
        if (identifier) {
          const idWithDomain = `${identifier}${HEALTHAPP_LOGIN_DOMAIN}`;
          localStorage.setItem(LAST_USERNAME_KEY, idWithDomain);
        }

        const stored = JSON.parse(localStorage.getItem("user"));
        const role = stored?.role;

        await Promise.resolve();

        if (role === "ADMIN") {
          navigate("/admin/dashboard", { replace: true });
          return;
        }

        if (role === "DOCTOR") {
          navigate("/doctor/dashboard", { replace: true });
          return;
        }

        if (role === "PATIENT") {
          // Check if this patient already has a profile
          try {
            const me = await patientService.meOrNull();
            if (!me || !me.id) {
              navigate("/patient/onboarding", { replace: true });
            } else {
              navigate("/patient/dashboard", { replace: true });
            }
          } catch {
            // If anything weird happens, at least let them into dashboard
            navigate("/patient/dashboard", { replace: true });
          }
          return;
        }

        // Fallback if role is something unexpected
        navigate("/patient/dashboard", { replace: true });
      } else {
        const msg = out?.message || "Invalid username or password.";
        setAuthError(msg);
        toast.error(msg);
      }
    } catch (e) {
      const msg =
        e?.response?.data?.message || e?.message || "Unable to sign in.";
      setAuthError(msg);
      toast.error(msg);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:grid md:grid-cols-2">
      <Toaster position="top-right" />

      <section className="relative hidden md:flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-sky-700 via-sky-600 to-cyan-500" />
        <div className="absolute -left-20 -bottom-24 h-80 w-80 rounded-full bg-cyan-400/30 blur-3xl" />
        <div className="absolute -right-10 -top-10 h-72 w-72 rounded-full bg-sky-400/30 blur-3xl" />

        <div className="relative z-10 w-full max-w-lg px-10">
          <div className="flex items-center gap-3 mb-8">
            <div className="h-9 w-9 rounded-xl bg-white/10 border border-white/30 grid place-items-center">
              <div className="h-5 w-5 rounded-lg bg-white" />
            </div>
            <span className="text-xl font-semibold text-white tracking-tight">
              HealthApp
            </span>
          </div>

          <h1 className="text-4xl md:text-[40px] leading-tight font-extrabold text-white">
            Welcome to HealthApp
          </h1>
          <p className="mt-3 text-sky-100 text-[15px] max-w-md">
            Securely access your health records, manage appointments, view
            bills, and stay connected with your care team.
          </p>

          <div className="mt-8 grid grid-cols-3 gap-4 text-sm text-sky-50">
            <div className="backdrop-blur-sm bg-white/10 border border-white/20 rounded-2xl px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-sky-100">
                Security
              </p>
              <p className="font-semibold mt-1">
                End to end
                <br />
                encryption
              </p>
            </div>
            <div className="backdrop-blur-sm bg-white/10 border border-white/20 rounded-2xl px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-sky-100">
                Access
              </p>
              <p className="font-semibold mt-1">
                24x7
                <br />
                availability
              </p>
            </div>
            <div className="backdrop-blur-sm bg-white/10 border border-white/20 rounded-2xl px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-sky-100">
                Trusted
              </p>
              <p className="font-semibold mt-1">
                Clinician
                <br />
                approved
              </p>
            </div>
          </div>
        </div>
      </section>

      <header className="md:hidden px-6 pt-8 pb-5 bg-gradient-to-r from-sky-700 to-cyan-500 text-white">
        <div className="flex items-center gap-2 mb-4">
          <div className="h-7 w-7 rounded-lg bg-white/10 border border-white/30 grid place-items-center">
            <div className="h-4 w-4 rounded-md bg-white" />
          </div>
          <span className="text-lg font-semibold tracking-tight">
            HealthApp
          </span>
        </div>
        <h1 className="text-2xl font-extrabold">Welcome back</h1>
        <p className="text-sm text-sky-100 mt-1">
          Sign in to manage your healthcare securely.
        </p>
      </header>

      <section className="flex items-center justify-center px-6 py-10 md:px-10">
        <div className="w-full max-w-md">
          <div className="bg-white shadow-lg shadow-slate-200/60 rounded-2xl border border-slate-100 px-6 sm:px-8 py-7">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-sky-100 text-sky-700 grid place-items-center">
                <FiShield size={18} />
              </div>
              <div>
                <h2 className="text-[24px] font-extrabold text-slate-900">
                  Secure Sign In
                </h2>
                <p className="text-sm text-slate-500">
                  Log in to manage appointments, bills, and records.
                </p>
              </div>
            </div>

            {authError && (
              <div className="mt-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
                <p className="font-medium">Unable to sign in</p>
                <p className="mt-1">{authError}</p>
              </div>
            )}

            <form
              onSubmit={handleSubmit(onSubmit)}
              className="mt-6 space-y-5"
              noValidate
            >
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Username or Email
                </label>
                <Input
                  placeholder="Enter your HealthApp ID or email"
                  leftIcon={<FiUser size={18} />}
                  autoComplete="username"
                  {...register("username", {
                    required: "Username or email is required",
                  })}
                />
                {usernameValue && (
                  <p className="mt-1 text-xs text-slate-500">
                    Your HealthApp ID:
                    <span className="ml-1 font-mono text-slate-700">
                      {usernameValue.toLowerCase().includes(
                        HEALTHAPP_LOGIN_DOMAIN
                      )
                        ? usernameValue
                        : `${usernameValue}${HEALTHAPP_LOGIN_DOMAIN}`}
                    </span>
                  </p>
                )}
                {errors.username && (
                  <p className="mt-1 text-xs text-rose-600">
                    {errors.username.message}
                  </p>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-sm font-medium text-slate-700">
                    Password
                  </label>
                  <button
                    type="button"
                    className="text-xs font-medium text-sky-700 hover:underline"
                  >
                    Forgot password
                  </button>
                </div>
                <Input
                  type="password"
                  placeholder="Enter your password"
                  leftIcon={<FiLock size={18} />}
                  autoComplete="current-password"
                  {...register("password", {
                    required: "Password is required",
                  })}
                />
                {errors.password && (
                  <p className="mt-1 text-xs text-rose-600">
                    {errors.password.message}
                  </p>
                )}
              </div>

              <div className="pt-1">
                <div className="h-[6px] w-full rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full w-[88%] bg-gradient-to-r from-emerald-500 to-lime-400" />
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-600 mt-3">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-md border-2 border-emerald-500 text-emerald-600 bg-emerald-50">
                    <FiShield size={14} />
                  </span>
                  <span>
                    All activity is encrypted and monitored for your safety.
                  </span>
                </div>
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-2"
              >
                {isSubmitting ? "Signing in..." : "Sign In"}
              </Button>

              <p className="text-center text-sm text-slate-600">
                Do not have an account{" "}
                <Link
                  to="/register"
                  className="text-sky-700 font-medium hover:underline"
                >
                  Sign up
                </Link>
              </p>

              <div className="pt-5 text-center text-[11px] text-slate-400">
                © {new Date().getFullYear()} HealthApp Inc.{" "}
                <button type="button" className="hover:underline">
                  Privacy Policy
                </button>{" "}
                ·{" "}
                <button type="button" className="hover:underline">
                  Terms of Service
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}
