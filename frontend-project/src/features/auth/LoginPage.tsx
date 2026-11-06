import { useState } from "react";
import { Link } from "react-router";
import { useForm } from "react-hook-form";
import { ShieldAlert } from "lucide-react";
import toast from "react-hot-toast";
import { ApiError } from "../../core/api/client";
import FormField from "../../core/ui/FormField";
import { inputClass, primaryButtonClass } from "../../core/ui/styles";
import AuthCard from "./AuthCard";
import { useAuth } from "./AuthContext";

// ... (rest of file unchanged up to the forEach loop)

        error.fieldErrors.forEach((fieldError) => {
          if (isFormField(fieldError.field)) {
            setError(fieldError.field, { type: "server", message: fieldError.message });
          }
        });


type FormValues = { email: string; password: string };

const isFormField = (field: string): field is keyof FormValues =>
  field === "email" || field === "password";

function LoginPage() {
  const { login } = useAuth();
  const [serverError, setServerError] = useState("");
  const [blockedReason, setBlockedReason] = useState<string | null | undefined>(undefined);

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
    <AuthCard
      title="Sign in"
      subtitle="Welcome back. Sign in to see your boards."
      footer={
        <>
          New to TeamBoard?{' '}
          <Link to="/register" className="font-medium text-brand hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <FormField id="email" label="Email" error={errors.email?.message}>
          <input
            id="email"
            type="email"
            autoComplete="email"
            autoFocus
            aria-invalid={errors.email ? true : undefined}
            className={inputClass}
            {...register("email", {
              required: "Enter your email address.",
              pattern: { value: /^\S+@\S+\.\S+$/, message: "Enter a valid email address." },
            })}
          />
        </FormField>

        <FormField id="password" label="Password" error={errors.password?.message}>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            aria-invalid={errors.password ? true : undefined}
            className={inputClass}
            {...register("password", { required: "Enter your password." })}
          />
        </FormField>

        {blockedReason !== undefined && (
          <div role="alert" className="flex gap-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
            <ShieldAlert size={18} className="mt-0.5 shrink-0" />
            <div>
              <p className="font-medium">Your account has been blocked.</p>
              {blockedReason && <p className="mt-1">Reason: {blockedReason}</p>}
            </div>
          </div>
        )}

        {serverError && (
          <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {serverError}
          </p>
        )}

        <button type="submit" disabled={isSubmitting} className={primaryButtonClass}>
          {isSubmitting ? "Signing in..." : "Sign in"}
        </button>

        {isSubmitting && (
          <p className="text-center text-xs text-slate-500">The server may take a moment to wake up.</p>
        )}
      </form>
    </AuthCard>
  );
}

export default LoginPage;
