import { useState } from "react";
import { Link } from "react-router";
import { useForm, type RegisterOptions } from "react-hook-form";
import toast from "react-hot-toast";
import { ApiError } from "../../core/api/client";
import FormField from "../../core/ui/FormField";
import { inputClass, primaryButtonClass } from "../../core/ui/styles";
import AuthCard from "./AuthCard";
import { useAuth } from "./AuthContext";

type FormValues = { name: string; email: string; password: string };

const isFormField = (field: string): field is keyof FormValues =>
  field === "name" || field === "email" || field === "password";

// Password validation rules matching the backend schema
const passwordRules: RegisterOptions<FormValues, "password"> = {
  required: "Enter a password.",
  minLength: { value: 8, message: "Password must be at least 8 characters." },
  maxLength: { value: 72, message: "Password must be at most 72 characters." },
  validate: {
    hasLetter: (value) => /[A-Za-z]/.test(value) || "Password must contain at least one letter.",
    hasNumber: (value) => /[0-9]/.test(value) || "Password must contain at least one number.",
  },
};

function SignUpPage() {
  const { signUp } = useAuth();
  const [serverError, setServerError] = useState("");

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ defaultValues: { name: "", email: "", password: "" } });

  const onSubmit = async (values: FormValues) => {
    setServerError("");

    try {
      await signUp({
        name: values.name.trim(),
        email: values.email.trim(),
        password: values.password,
      });
      toast.success("Account created. Welcome!");
    } catch (error: unknown) {
  if (error instanceof ApiError && error.fieldErrors.length > 0) {
    error.fieldErrors.forEach(({ field, message }: { field: keyof FormValues; message: string }) => {
      if (isFormField(field)) setError(field, { type: "server", message });
    });
    return;
  }
  setServerError(error instanceof Error ? error.message : "Something went wrong");
}
  };

  return (
    <AuthCard
      title="Create your account"
      subtitle="Plan your team's work on shared boards."
      footer={
        <>
          Already registered?{' '}
          <Link to="/login" className="font-medium text-brand hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <FormField id="name" label="Full name" error={errors.name?.message}>
          <input
            id="name"
            type="text"
            autoComplete="name"
            autoFocus
            aria-invalid={errors.name ? true : undefined}
            className={inputClass}
            {...register("name", {
              required: "Enter your name.",
              minLength: { value: 2, message: "Name must be at least 2 characters." },
              maxLength: { value: 50, message: "Name must be at most 50 characters." },
            })}
          />
        </FormField>

        <FormField id="email" label="Email" error={errors.email?.message}>
          <input
            id="email"
            type="email"
            autoComplete="email"
            aria-invalid={errors.email ? true : undefined}
            className={inputClass}
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
          hint="At least 8 characters, with a letter and a number."
        >
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            aria-invalid={errors.password ? true : undefined}
            className={inputClass}
            {...register("password", passwordRules)}
          />
        </FormField>

        {serverError && (
          <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {serverError}
          </p>
        )}

        <button type="submit" disabled={isSubmitting} className={primaryButtonClass}>
          {isSubmitting ? "Creating account..." : "Create account"}
        </button>

        {isSubmitting && (
          <p className="text-center text-xs text-slate-500">The server may take a moment to wake up.</p>
        )}
      </form>
    </AuthCard>
  );
}

export default SignUpPage;
