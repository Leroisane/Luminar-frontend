import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useNavigate } from "react-router-dom";
import { loginApi, getProfileApi } from "../api/authService";
import { useAuthStore } from "../store/useAuthStore";

const loginSchema = z.object({
  email: z.string().email("Format email tidak valid"),
  password: z.string().min(6, "Password minimal 6 karakter"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormValues) => {
    setErrorMsg(null);
    try {
      const res = await loginApi(data);
      const token =
        res?.data?.access_token ||
        res?.data?.token ||
        res?.access_token ||
        res?.token;

      if (!token) {
        throw new Error("Token tidak ditemukan pada respons server");
      }

      // Simpan token sementara agar interceptor Axios bisa memanggil /auth/me
      localStorage.setItem("access_token", token);

      let userData = res?.data?.user || res?.user;
      if (!userData) {
        const profileRes = await getProfileApi();
        userData = profileRes?.data || profileRes;
      }

      setAuth(userData, token);

      // Arahkan sesuai role
      const role = userData?.role?.toLowerCase();
      navigate(role === "admin" ? "/admin" : "/", { replace: true });
    } catch (err: unknown) {
      const apiErr = err as {
        response?: { data?: { message?: string; error?: string } };
      };
      const message =
        apiErr?.response?.data?.message ||
        apiErr?.response?.data?.error ||
        "Login gagal. Periksa kembali email dan password kamu.";
      setErrorMsg(message);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#F8F9FA] text-[#121212] flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-md bg-white rounded-2xl border border-gray-200 shadow-sm p-8 space-y-6">
        <div className="space-y-1">
          <span className="inline-block px-2.5 py-1 bg-emerald-50 text-[#2E5B3C] text-xs font-bold rounded-md">
            FILKOM UB • Luminar
          </span>
          <h1 className="text-2xl font-extrabold text-[#121212] pt-1">
            Masuk ke Akun
          </h1>
          <p className="text-xs text-gray-500">
            Sistem Peminjaman Ruang, Laboratorium, dan Barang Akademik
          </p>
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Email UB / Terdaftar
            </label>
            <input
              type="email"
              placeholder="nama@student.ub.ac.id"
              {...register("email")}
              className="w-full px-3.5 py-2.5 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2E5B3C]/20 focus:border-[#2E5B3C]"
            />
            {errors.email && (
              <p className="text-xs text-red-600 mt-1">
                {errors.email.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Password
            </label>
            <input
              type="password"
              placeholder="••••••••"
              {...register("password")}
              className="w-full px-3.5 py-2.5 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2E5B3C]/20 focus:border-[#2E5B3C]"
            />
            {errors.password && (
              <p className="text-xs text-red-600 mt-1">
                {errors.password.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 bg-[#2E5B3C] text-white text-sm font-semibold rounded-xl hover:bg-emerald-800 transition disabled:opacity-50"
          >
            {isSubmitting ? "Memproses..." : "Masuk"}
          </button>
        </form>

        <p className="text-center text-xs text-gray-500">
          Belum punya akun mahasiswa?{" "}
          <Link
            to="/register"
            className="font-semibold text-[#2E5B3C] hover:underline"
          >
            Daftar di sini
          </Link>
        </p>
      </div>
    </div>
  );
}
