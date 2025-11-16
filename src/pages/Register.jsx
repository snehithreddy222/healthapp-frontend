import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import toast, { Toaster } from "react-hot-toast";
import { Link, useNavigate } from "react-router-dom";
import Card from "../components/common/Card";
import Input from "../components/common/Input";
import Button from "../components/common/Button";
import { authService } from "../services/authService";

const schema = z.object({
  firstName: z.string().min(1, "First name required"),
  lastName: z.string().min(1, "Last name required"),
  email: z.string().email("Enter a valid email"),
  username: z.string().min(3, "Username min 3 chars"),
  password: z.string().min(8, "Password min 8 chars"),
  confirm: z.string(),
  role: z.enum(["PATIENT","DOCTOR"])
}).refine((d) => d.password === d.confirm, { path: ["confirm"], message: "Passwords do not match" });

export default function Register() {
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors } } = useForm({ resolver: zodResolver(schema) });

  const onSubmit = async (form) => {
    const payload = {
      username: form.username,
      email: form.email,
      password: form.password,
      role: form.role
    };
    try {
      const out = await authService.register(payload);
      if (out?.success) {
        toast.success("Account created. Please log in.");
        navigate("/login");
      } else {
        toast.error(out?.message || "Registration failed");
      }
    } catch {
      toast.error("Registration error");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-right" />
      <header className="py-6">
        <div className="max-w-3xl mx-auto px-4 flex items-center gap-2">
          <div className="w-5 h-5 rounded bg-sky-600" />
          <span className="font-semibold">HealthApp</span>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-4 pb-16">
        <Card
          title="Create Your Account"
          subtitle="Join our secure healthcare portal to manage your health with ease."
        >
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm mb-1">First Name</label>
                <Input placeholder="Enter your first name" {...register("firstName")} />
                {errors.firstName && <p className="text-red-600 text-sm mt-1">{errors.firstName.message}</p>}
              </div>
              <div>
                <label className="block text-sm mb-1">Last Name</label>
                <Input placeholder="Enter your last name" {...register("lastName")} />
                {errors.lastName && <p className="text-red-600 text-sm mt-1">{errors.lastName.message}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm mb-1">Email Address</label>
              <Input type="email" placeholder="Enter your email address" {...register("email")} />
              {errors.email && <p className="text-red-600 text-sm mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-sm mb-1">Username</label>
              <Input placeholder="Create a username" {...register("username")} />
              {errors.username && <p className="text-red-600 text-sm mt-1">{errors.username.message}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm mb-1">Password</label>
                <Input type="password" placeholder="Create a password" {...register("password")} />
                <p className="text-xs text-gray-500 mt-1">8+ characters, one uppercase, one number.</p>
                {errors.password && <p className="text-red-600 text-sm mt-1">{errors.password.message}</p>}
              </div>
              <div>
                <label className="block text-sm mb-1">Confirm Password</label>
                <Input type="password" placeholder="Confirm your password" {...register("confirm")} />
                {errors.confirm && <p className="text-red-600 text-sm mt-1">{errors.confirm.message}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm mb-2">I am a...</label>
              <div className="grid grid-cols-2 gap-4">
                <label className="bg-white border border-gray-300 rounded-lg p-4 flex items-center gap-2 cursor-pointer">
                  <input type="radio" value="PATIENT" defaultChecked {...register("role")} />
                  <span>Patient</span>
                </label>
                <label className="bg-white border border-gray-300 rounded-lg p-4 flex items-center gap-2 cursor-pointer">
                  <input type="radio" value="DOCTOR" {...register("role")} />
                  <span>Clinician</span>
                </label>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <input type="checkbox" className="mt-1" />
              <p className="text-sm text-gray-600">
                By creating an account, you agree to our Terms of Service and Privacy Policy.
              </p>
            </div>

            <Button type="submit" className="w-full">Create Account</Button>

            <p className="text-center text-sm">
              Already have an account? <Link to="/login" className="text-sky-700 hover:underline">Log In</Link>
            </p>
          </form>
        </Card>
      </main>
    </div>
  );
}
