import { useForm } from "react-hook-form";
import { useNavigate, Link } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import Input from "../components/common/Input";
import Button from "../components/common/Button";
import { useAuth } from "../context/AuthContext";
import { FiUser, FiLock, FiShield } from "react-icons/fi";

export default function Login() {
  const { register, handleSubmit } = useForm();
  const { login } = useAuth();
  const navigate = useNavigate();

  const onSubmit = async (data) => {
    try {
      const out = await login({ username: data.username, password: data.password });
      if (out?.success) {
        const stored = JSON.parse(localStorage.getItem("user"));
        const role = stored?.role;

        // Wait a tick so ProtectedRoute reads the new state/localStorage
        await Promise.resolve();

        if (role === "ADMIN") navigate("/admin/dashboard", { replace: true });
        else if (role === "DOCTOR") navigate("/doctor/dashboard", { replace: true });
        else navigate("/patient/dashboard", { replace: true });
      } else {
        toast.error(out?.message || "Login failed");
      }
    } catch (e) {
      const msg = e?.response?.data?.message || e?.message || "Network error";
      toast.error(msg);
    }
  };

  return (
    <div className="min-h-screen grid md:grid-cols-2">
      <Toaster position="top-right" />

      {/* LEFT PANEL */}
      <section className="hidden md:flex items-center justify-end pr-10 border-r border-gray-200">
        <div className="w-full max-w-xl pl-10">
          <div className="flex items-center gap-2 mb-8">
            <div className="w-6 h-6 rounded-md bg-sky-700" />
            <span className="text-xl font-semibold">HealthApp</span>
          </div>
          <h1 className="text-[36px] leading-tight font-extrabold">Welcome to HealthApp</h1>
          <p className="text-gray-600 mt-2 text-[16px]">Your Health Data, Secured and Simplified.</p>
        </div>
      </section>

      {/* RIGHT PANEL */}
      <section className="flex items-center justify-start md:pl-10 p-6">
        <div className="card w-full max-w-xl">
          <h2 className="text-[28px] font-extrabold">Secure Sign In</h2>
          <p className="text-gray-600 mt-1">Log in to your account to manage your healthcare.</p>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-5">
            <div>
              <label className="block text-sm mb-1">Username or Email</label>
              <Input
                placeholder="Enter your username or email"
                leftIcon={<FiUser size={18} />}
                {...register("username", { required: true })}
              />
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label className="block text-sm mb-1">Password</label>
                <a className="text-sm text-sky-700 hover:underline">Forgot Password?</a>
              </div>
              <Input
                type="password"
                placeholder="Enter your password"
                leftIcon={<FiLock size={18} />}
                {...register("password", { required: true })}
              />
            </div>

            <div className="h-[6px] w-full rounded bg-gray-200">
              <div className="h-full w-[88%] rounded bg-green-600" />
            </div>

            <div className="flex items-center gap-3 text-sm text-gray-700 mt-3">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-md border-2 border-green-600 text-green-700 bg-green-50">
                <FiShield size={14} />
              </span>
              <span>All your data is secure and encrypted.</span>
            </div>

            <Button type="submit">Sign In</Button>

            <p className="text-center text-sm">
              Don&apos;t have an account?{" "}
              <Link to="/register" className="text-sky-700 hover:underline">
                Sign up
              </Link>
            </p>

            <div className="pt-6 text-center text-xs text-gray-500">
              © {new Date().getFullYear()} HealthApp Inc. ·{" "}
              <a className="hover:underline">Privacy Policy</a> ·{" "}
              <a className="hover:underline">Terms of Service</a>
            </div>
          </form>
        </div>
      </section>
    </div>
  );
}
