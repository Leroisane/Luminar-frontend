import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useNavigate } from "react-router-dom";
import { loginApi, getProfileApi } from "../api/authService";
import { getApiErrorMessage } from "../api/axiosClient";
import { useAuthStore } from "../store/useAuthStore";
import iconLuminar from "../assets/icon-luminar.png";

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

  const showDemoAccess =
    import.meta.env.DEV || import.meta.env.VITE_DEMO_MODE === "true";

  const onSubmit = async (data: LoginFormValues) => {
    setErrorMsg(null);
    try {
      const res = await loginApi(data);
      // Backend wraps in { message, data: { token, refresh_token, user } }
      const payload = res?.data;
      const accessToken = payload?.token;
      const refreshToken = payload?.refresh_token ?? null;

      if (!accessToken) {
        throw new Error("Access token tidak ditemukan pada respons server");
      }

      localStorage.setItem("access_token", accessToken);
      if (refreshToken) {
        localStorage.setItem("refresh_token", refreshToken);
      }

      let userData = payload?.user;
      if (!userData) {
        const profileRes = await getProfileApi();
        userData = profileRes?.data;
      }

      if (!userData) {
        throw new Error("Data user tidak ditemukan");
      }

      setAuth(userData, accessToken, refreshToken);

      const role = userData?.role?.toLowerCase();
      navigate(role === "admin" ? "/admin" : "/", { replace: true });
    } catch (err: unknown) {
      setErrorMsg(getApiErrorMessage(err));
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#F8F9FA] text-[#121212] flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-md bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sm:p-8 space-y-6">
        <div className="space-y-1">
          <img
            src={iconLuminar}
            alt="Logo Luminar"
            className="mb-3 size-11 object-contain"
          />
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
              <p className="text-xs text-red-600 mt-1">{errors.email.message}</p>
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
              <p className="text-xs text-red-600 mt-1">{errors.password.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 bg-[#2E5B3C] text-white text-sm font-semibold rounded-xl hover:bg-emerald-800 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
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

        {showDemoAccess && (
          <div className="pt-4 border-t border-gray-100 space-y-2.5">
            <p className="text-[11px] text-center text-gray-400">
              Mode Pratinjau (Akses Cepat Tanpa Backend)
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setAuth(
                    {
                      id: "demo-mhs-1",
                      name: "Muhammad Ihsan Fadillah",
                      email: "muhamadihsan2005@gmail.com",
                      role: "mahasiswa",
                    },
                    "dev-token-mhs",
                  );
                  navigate("/", { replace: true });
                }}
                className="whitespace-nowrap py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition cursor-pointer"
              >
                Demo: Mahasiswa
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuth(
                    {
                      id: "demo-admin-1",
                      name: "Admin Sarpras",
                      email: "admin@ub.ac.id",
                      role: "admin",
                    },
                    "dev-token-admin",
                  );
                  navigate("/admin", { replace: true });
                }}
                className="whitespace-nowrap py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition cursor-pointer"
              >
                Demo: Admin
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
