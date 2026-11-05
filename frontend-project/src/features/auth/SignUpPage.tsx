import { Link } from "react-router";
import AuthCard from "./AuthCard";

function SignUpPage() {
  return (
    <AuthCard
      title="Create your account"
      subtitle="This page is being built by Ubald."
      footer={
        <>
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-brand hover:text-brand-dark">
            Sign in
          </Link>
        </>
      }
    >
      <p className="rounded-lg border border-dashed border-slate-300 px-4 py-8 text-center text-sm text-slate-500">
        The sign-up form will live here.
      </p>
    </AuthCard>
  );
}

export default SignUpPage;
