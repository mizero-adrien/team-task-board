import { useCallback, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useLocation, useNavigate } from "react-router";
import { Eye, EyeOff } from "lucide-react";
import toast from "react-hot-toast";
import { ApiError } from "../../core/api/client";
import FormField from "../../core/ui/FormField";
import { authInputClass, authLabelClass, authPrimaryButtonClass } from "../../core/ui/styles";
import AuthModal, { AuthDivider, GoogleButton } from "./AuthModal";
import { useAuth } from "./AuthContext";

type FormValues = {
  name: string;
  email: string;
  password: string;
  acceptTerms: boolean;
};

const isFormField = (field: string): field is "name" | "email" | "password" =>
  field === "name" || field === "email" || field === "password";

function SignUpPage() {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [serverError, setServerError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const closeModal = useCallback(() => navigate("/"), [navigate]);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    defaultValues: { name: "", email: "", password: "", acceptTerms: false },
  });

  const onSubmit = async (values: FormValues) => {
    setServerError("");

    try {
      // GuestOnly sends the user onwards as soon as the session exists
      await signUp({ name: values.name.trim(), email: values.email.trim(), password: values.password });
      toast.success("Account created");
    } catch (error) {
      if (error instanceof ApiError) {
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
      titleId="signup-title"
      title="Get started with Taskboard"
      subtitle="Create your free account and bring your team's work into one place."
      onClose={closeModal}
      footer={
        <>
          Already have an account?{" "}
          <Link
            to="/login"
            state={location.state}
            className="font-semibold text-[#2563eb] hover:underline"
          >
            Log in
          </Link>
        </>
      }
    >
      <GoogleButton />
      <AuthDivider />

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="space-y-3.5">
          <FormField
            id="name"
            label="Full name"
            error={errors.name?.message}
            labelClassName={authLabelClass}
          >
            <input
              id="name"
              type="text"
              autoComplete="name"
              autoFocus
              placeholder="Enter your full name"
              aria-invalid={errors.name ? true : undefined}
              aria-describedby={errors.name ? "name-error" : undefined}
              className={authInputClass}
              {...register("name", {
                required: "Enter your full name.",
                maxLength: { value: 100, message: "Name must be 100 characters or fewer." },
              })}
            />
          </FormField>

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
            hint="Use at least 8 characters."
            labelClassName={authLabelClass}
          >
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder="Create a password"
                aria-invalid={errors.password ? true : undefined}
                aria-describedby={errors.password ? "password-error" : "password-hint"}
                className={`${authInputClass} pr-10`}
                {...register("password", {
                  required: "Create a password.",
                  validate: {
                    length: (value) => value.length >= 8 || "Use at least 8 characters.",
                    lower: (value) => /[a-z]/.test(value) || "Use a lowercase letter.",
                    upper: (value) => /[A-Z]/.test(value) || "Use an uppercase letter.",
                    number: (value) => /\d/.test(value) || "Use a number.",
                  },
                })}
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

        <div className="mt-4 flex items-start gap-2">
          <input
            id="acceptTerms"
            type="checkbox"
            aria-invalid={errors.acceptTerms ? true : undefined}
            aria-describedby={errors.acceptTerms ? "acceptTerms-error" : undefined}
            className="mt-0.5 h-3.5 w-3.5 shrink-0 rounded border-[#cfd6e2] accent-[#2563eb]"
            {...register("acceptTerms", {
              required: "Please accept the Terms of Service and Privacy Policy.",
            })}
          />
          <div className="text-[11px] leading-relaxed text-[#64748b]">
            <label htmlFor="acceptTerms">I agree to the</label>{" "}
            <button
              type="button"
              onClick={() => toast("Terms of Service page is coming soon.")}
              className="font-semibold text-[#2563eb] hover:underline"
            >
              Terms of Service
            </button>{" "}
            and{" "}
            <button
              type="button"
              onClick={() => toast("Privacy Policy page is coming soon.")}
              className="font-semibold text-[#2563eb] hover:underline"
            >
              Privacy Policy
            </button>
            .
            {errors.acceptTerms?.message && (
              <p id="acceptTerms-error" role="alert" className="mt-1 text-xs text-red-600">
                {errors.acceptTerms.message}
              </p>
            )}
          </div>
        </div>

        {serverError && (
          <p role="alert" className="mt-3 rounded-md bg-red-50 px-3 py-2 text-xs text-red-700">
            {serverError}
          </p>
        )}

        <button type="submit" disabled={isSubmitting} className={`${authPrimaryButtonClass} mt-4`}>
          {isSubmitting ? "Creating account..." : "Create your free account"}
        </button>

        <p className="mt-2.5 text-center text-[10px] text-[#8a94a6]">
          Free to get started. No credit card required.
        </p>

        {isSubmitting && (
          <p className="mt-1 text-center text-[10px] text-[#9aa4b2]">
            The server may take a moment to wake up.
          </p>
        )}
      </form>
    </AuthModal>
  );
}

export default SignUpPage;
