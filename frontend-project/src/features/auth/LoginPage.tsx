import { useCallback, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useLocation, useNavigate } from "react-router";
import { Eye, EyeOff, ShieldAlert } from "lucide-react";
import toast from "react-hot-toast";
import { ApiError } from "../../core/api/client";
import FormField from "../../core/ui/FormField";
import { authInputClass, authLabelClass, authPrimaryButtonClass } from "../../core/ui/styles";
import AuthModal, { AuthDivider, GoogleButton } from "./AuthModal";
import { useAuth } from "./AuthContext";

type FormValues = { email: string; password: string };

const isFormField = (field: string): field is keyof FormValues =>
  field === "email" || field === "password";

function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [serverError, setServerError] = useState("");
  const [blockedReason, setBlockedReason] = useState<string | null | undefined>(undefined);
  const [showPassword, setShowPassword] = useState(false);
  const closeModal = useCallback(() => navigate("/"), [navigate]);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ defaultValues: { email: "", password: "" } });

  const onSubmit = async (values: FormValues) => {
    setServerError("");
    setBlockedReason(undefined);

    try {
      // GuestOnly sends the user onwards as soon as the session exists
      await login({ email: values.email.trim(), password: values.password });
      toast.success("Signed in");
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.code === "ACCOUNT_BLOCKED") {
          const reason = error.data.reason;
          setBlockedReason(typeof reason === "string" && reason ? reason : null);
          return;
        }

        if (error.fieldErrors.length > 0) {
          error.fieldErrors.forEach(({ field, message }) => {
            if (isFormField(field)) setError(field, { type: "server", message });
          });
          return;
        }
      }

      setServerError(error instanceof Error ? error.message : "Something went wrong");
    }
  };

  return (
    <AuthModal
      titleId="login-title"
      title="Welcome back to Taskboard"
      subtitle="Log in to pick up where you left off."
      onClose={closeModal}
      footer={
        <>
          New to Taskboard?{" "}
          <Link
            to="/signup"
            state={location.state}
            className="font-semibold text-[#2563eb] hover:underline"
          >
            Sign up for free
          </Link>
        </>
      }
    >
      <GoogleButton />
      <AuthDivider />

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="space-y-3.5">
          <FormField
            id="email"
            label="Email address"
            error={errors.email?.message}
            labelClassName={authLabelClass}
          >
            <input
              id="email"
              type="email"
              autoComplete="email"
              autoFocus
              placeholder="you@company.com"
              aria-invalid={errors.email ? true : undefined}
              aria-describedby={errors.email ? "email-error" : undefined}
              className={authInputClass}
              {...register("email", {
                required: "Enter your email address.",
                pattern: { value: /^\S+@\S+\.\S+$/, message: "Enter a valid email address." },
              })}
            />
          </FormField>

          <FormField
            id="password"
            label="Password"
            error={errors.password?.message}
            labelClassName={authLabelClass}
          >
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="Enter your password"
                aria-invalid={errors.password ? true : undefined}
                aria-describedby={errors.password ? "password-error" : undefined}
                className={`${authInputClass} pr-10`}
                {...register("password", { required: "Enter your password." })}
              />
              <button
                type="button"
                onClick={() => setShowPassword((visible) => !visible)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-[#9aa4b2] transition-colors hover:text-[#475569]"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </FormField>
        </div>

        <div className="mt-3 flex items-center justify-between gap-2">
          <label className="flex items-center gap-1.5 text-[11px] text-[#64748b]">
            <input
              type="checkbox"
              defaultChecked
              className="h-3.5 w-3.5 rounded border-[#cfd6e2] accent-[#2563eb]"
            />
            Remember me
          </label>
          <button
            type="button"
            onClick={() => toast("Password reset is not available yet.")}
            className="text-[11px] font-semibold text-[#2563eb] hover:underline"
          >
            Forgot password?
          </button>
        </div>

        {blockedReason !== undefined && (
          <div
            role="alert"
            className="mt-3 flex gap-2.5 rounded-md border border-red-200 bg-red-50 p-3 text-xs text-red-800"
          >
            <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <p className="font-semibold">Your account has been blocked.</p>
              {blockedReason && <p className="mt-1">Reason: {blockedReason}</p>}
            </div>
          </div>
        )}

        {serverError && (
          <p role="alert" className="mt-3 rounded-md bg-red-50 px-3 py-2 text-xs text-red-700">
            {serverError}
          </p>
        )}

        <button type="submit" disabled={isSubmitting} className={`${authPrimaryButtonClass} mt-4`}>
          {isSubmitting ? "Logging in..." : "Log in"}
        </button>

        {isSubmitting && (
          <p className="mt-2 text-center text-[10px] text-[#9aa4b2]">
            The server may take a moment to wake up.
          </p>
        )}
      </form>
    </AuthModal>
  );
}

export default LoginPage;
