import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useNavigate } from "react-router-dom";
import { registerApi } from "../api/authService";

const registerSchema = z
  .object({
    name: z.string().min(3, "Nama lengkap minimal 3 karakter"),
    nim: z.string().min(10, "NIM tidak valid"),
    email: z.string().email("Format email tidak valid"),
    password: z.string().min(6, "Password minimal 6 karakter"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Konfirmasi password tidak cocok",
    path: ["confirmPassword"],
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const navigate = useNavigate();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormValues) => {
    setErrorMsg(null);
    try {
      await registerApi({
        name: data.name,
        nim: data.nim,
        email: data.email,
        password: data.password,
      });
      navigate("/login", { replace: true });
    } catch (err: unknown) {
      const apiErr = err as {
        response?: { data?: { message?: string; error?: string } };
      };
      const message =
        apiErr?.response?.data?.message ||
        apiErr?.response?.data?.error ||
        "Registrasi gagal. Pastikan email/NIM belum terdaftar.";
      setErrorMsg(message);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#F8F9FA] text-[#121212] flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-md bg-white rounded-2xl border border-gray-200 shadow-sm p-8 space-y-6">
        <div className="space-y-1">
          <span className="inline-block px-2.5 py-1 bg-emerald-50 text-[#2E5B3C] text-xs font-bold rounded-md">
            Registrasi Mahasiswa
          </span>
          <h1 className="text-2xl font-extrabold text-[#121212] pt-1">
            Buat Akun Baru
          </h1>
          <p className="text-xs text-gray-500">
            Gunakan identitas mahasiswa FILKOM UB yang aktif
          </p>
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Nama Lengkap
            </label>
            <input
              type="text"
              placeholder="Muhammad Ihsan Fadillah"
              {...register("name")}
              className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-xl focus:outline-none focus:border-[#2E5B3C]"
            />
            {errors.name && (
              <p className="text-xs text-red-600 mt-1">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              NIM
            </label>
            <input
              type="text"
              placeholder="245150700111023"
              {...register("nim")}
              className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-xl focus:outline-none focus:border-[#2E5B3C]"
            />
            {errors.nim && (
              <p className="text-xs text-red-600 mt-1">{errors.nim.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              placeholder="nama@student.ub.ac.id"
              {...register("email")}
              className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-xl focus:outline-none focus:border-[#2E5B3C]"
            />
            {errors.email && (
              <p className="text-xs text-red-600 mt-1">
                {errors.email.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              placeholder="Minimal 6 karakter"
              {...register("password")}
              className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-xl focus:outline-none focus:border-[#2E5B3C]"
            />
            {errors.password && (
              <p className="text-xs text-red-600 mt-1">
                {errors.password.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Konfirmasi Password
            </label>
            <input
              type="password"
              placeholder="Ulangi password"
              {...register("confirmPassword")}
              className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-xl focus:outline-none focus:border-[#2E5B3C]"
            />
            {errors.confirmPassword && (
              <p className="text-xs text-red-600 mt-1">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 bg-[#2E5B3C] text-white text-sm font-semibold rounded-xl hover:bg-emerald-800 transition disabled:opacity-50 mt-2"
          >
            {isSubmitting ? "Mendaftarkan..." : "Daftar Sekarang"}
          </button>
        </form>

        <p className="text-center text-xs text-gray-500">
          Sudah punya akun?{" "}
          <Link
            to="/login"
            className="font-semibold text-[#2E5B3C] hover:underline"
          >
            Masuk di sini
          </Link>
        </p>
      </div>
    </div>
  );
}
