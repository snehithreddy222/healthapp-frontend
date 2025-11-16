// src/pages/Register.jsx
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import toast, { Toaster } from "react-hot-toast";
import { Link, useNavigate } from "react-router-dom";
import { FiUser, FiMail, FiLock, FiShield } from "react-icons/fi";

import Card from "../components/common/Card";
import Input from "../components/common/Input";
import Button from "../components/common/Button";
import { authService } from "../services/authService";

const HEALTHAPP_LOGIN_DOMAIN = "@healthapp";
const LAST_USERNAME_KEY = "lastLoginUsername";

const schema = z
  .object({
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    email: z.string().email("Enter a valid email"),
    username: z.string().min(3, "Username must be at least 3 characters"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirm: z.string(),
    role: z.enum(["PATIENT", "DOCTOR"]),
    terms: z.literal(true, {
      errorMap: () => ({ message: "You must accept the terms to continue" }),
    }),
  })
  .refine((d) => d.password === d.confirm, {
    path: ["confirm"],
    message: "Passwords do not match",
  });

export default function Register() {
  const navigate = useNavigate();
  const [apiError, setApiError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
  } = useForm({
    resolver: zodResolver(schema),
  });

  const usernameValue = watch("username") || "";

  const onSubmit = async (form) => {
    setApiError("");

    const payload = {
      username: form.username,
      email: form.email,
      password: form.password,
      role: form.role,
    };

    try {
      const out = await authService.register(payload);
      if (out?.success) {
        const idWithDomain = `${form.username}${HEALTHAPP_LOGIN_DOMAIN}`;

        toast.success("Account created successfully. Please sign in.");

        // Save full HealthApp ID so login page input shows "username@healthapp"
        localStorage.setItem(LAST_USERNAME_KEY, idWithDomain);

        // Pass it via navigation state too
        navigate("/login", { state: { username: idWithDomain } });
      } else {
        const msg = out?.message || "Registration failed. Please try again.";
        setApiError(msg);
        toast.error(msg);
      }
    } catch (e) {
      const msg =
        e?.response?.data?.message ||
        e?.message ||
        "Unable to complete registration.";
      setApiError(msg);
      toast.error(msg);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Toaster position="top-right" />

      <header className="py-5 border-b border-slate-100 bg-white/70 backdrop-blur">
        <div className="max-w-5xl mx-auto px-4 flex items-center gap-3">
          <div className="h-7 w-7 rounded-lg bg-sky-600 grid place-items-center">
            <div className="h-4 w-4 rounded-md bg-white" />
          </div>
          <span className="text-lg font-semibold tracking-tight text-slate-900">
            HealthApp
          </span>
        </div>
      </header>

      <main className="flex-1 flex items-start md:items-center justify-center px-4 py-8">
        <div className="w-full max-w-3xl">
          <Card
            title={
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-sky-100 text-sky-700 grid place-items-center">
                  <FiShield size={18} />
                </div>
                <div>
                  <h1 className="text-[24px] md:text-[26px] font-extrabold text-slate-900">
                    Create Your Account
                  </h1>
                  <p className="text-sm text-slate-500">
                    Join our secure portal to manage appointments, records, and
                    bills in one place.
                  </p>
                </div>
              </div>
            }
          >
            {apiError && (
              <div className="mb-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
                <p className="font-medium">We could not create your account</p>
                <p className="mt-1">{apiError}</p>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    First Name
                  </label>
                  <Input
                    placeholder="Enter your first name"
                    leftIcon={<FiUser size={18} />}
                    autoComplete="given-name"
                    {...register("firstName")}
                  />
                  {errors.firstName && (
                    <p className="text-xs text-rose-600 mt-1">
                      {errors.firstName.message}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Last Name
                  </label>
                  <Input
                    placeholder="Enter your last name"
                    leftIcon={<FiUser size={18} />}
                    autoComplete="family-name"
                    {...register("lastName")}
                  />
                  {errors.lastName && (
                    <p className="text-xs text-rose-600 mt-1">
                      {errors.lastName.message}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Email Address
                </label>
                <Input
                  type="email"
                  placeholder="Enter your email address"
                  leftIcon={<FiMail size={18} />}
                  autoComplete="email"
                  {...register("email")}
                />
                {errors.email && (
                  <p className="text-xs text-rose-600 mt-1">
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Username
                </label>
                <Input
                  placeholder="Create a username"
                  leftIcon={<FiUser size={18} />}
                  autoComplete="username"
                  {...register("username")}
                />
                {usernameValue && (
                  <p className="text-xs text-slate-500 mt-1">
                    Your HealthApp ID:
                    <span className="ml-1 font-mono text-slate-700">
                      {usernameValue}
                      {HEALTHAPP_LOGIN_DOMAIN}
                    </span>
                  </p>
                )}
                {errors.username && (
                  <p className="text-xs text-rose-600 mt-1">
                    {errors.username.message}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Password
                  </label>
                  <Input
                    type="password"
                    placeholder="Create a password"
                    leftIcon={<FiLock size={18} />}
                    autoComplete="new-password"
                    {...register("password")}
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    At least 8 characters, with a mix of letters and numbers.
                  </p>
                  {errors.password && (
                    <p className="text-xs text-rose-600 mt-1">
                      {errors.password.message}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Confirm Password
                  </label>
                  <Input
                    type="password"
                    placeholder="Confirm your password"
                    leftIcon={<FiLock size={18} />}
                    autoComplete="new-password"
                    {...register("confirm")}
                  />
                  {errors.confirm && (
                    <p className="text-xs text-rose-600 mt-1">
                      {errors.confirm.message}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  I am a...
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 cursor-pointer hover:border-sky-500 transition">
                    <input
                      type="radio"
                      value="PATIENT"
                      defaultChecked
                      className="h-4 w-4 text-sky-600"
                      {...register("role")}
                    />
                    <div>
                      <p className="text-sm font-medium text-slate-900">
                        Patient
                      </p>
                      <p className="text-xs text-slate-500">
                        Access personal records and visit history.
                      </p>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 cursor-pointer hover:border-sky-500 transition">
                    <input
                      type="radio"
                      value="DOCTOR"
                      className="h-4 w-4 text-sky-600"
                      {...register("role")}
                    />
                    <div>
                      <p className="text-sm font-medium text-slate-900">
                        Clinician
                      </p>
                      <p className="text-xs text-slate-500">
                        Manage patient panels and schedules.
                      </p>
                    </div>
                  </label>
                </div>
                {errors.role && (
                  <p className="text-xs text-rose-600 mt-1">
                    {errors.role.message}
                  </p>
                )}
              </div>

              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                  {...register("terms")}
                />
                <p className="text-sm text-slate-600">
                  By creating an account, you agree to our{" "}
                  <button
                    type="button"
                    className="text-sky-700 underline-offset-2 hover:underline"
                  >
                    Terms of Service
                  </button>{" "}
                  and{" "}
                  <button
                    type="button"
                    className="text-sky-700 underline-offset-2 hover:underline"
                  >
                    Privacy Policy
                  </button>
                  .
                </p>
              </div>
              {errors.terms && (
                <p className="text-xs text-rose-600 -mt-2">
                  {errors.terms.message}
                </p>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Creating account..." : "Create Account"}
              </Button>

              <p className="text-center text-sm text-slate-600">
                Already have an account{" "}
                <Link
                  to="/login"
                  className="text-sky-700 font-medium hover:underline"
                >
                  Log In
                </Link>
              </p>
            </form>
          </Card>
        </div>
      </main>
    </div>
  );
}
