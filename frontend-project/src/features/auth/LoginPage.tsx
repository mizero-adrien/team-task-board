import { Link } from "react-router";
import AuthCard from "./AuthCard";

function LoginPage() {
  return (
    <AuthCard
      title="Sign in"
      subtitle="This page is being built by Ubald."
      footer={
        <>
          No account?{" "}
          <Link to="/signup" className="font-medium text-brand hover:text-brand-dark">
            Create one
          </Link>
        </>
      }
    >
      <p className="rounded-lg border border-dashed border-slate-300 px-4 py-8 text-center text-sm text-slate-500">
        The sign-in form will live here.
      </p>
    </AuthCard>
  );
}

export default LoginPage;
