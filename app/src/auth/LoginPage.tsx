import { Link as WaspRouterLink, routes } from "wasp/client/router";
import { AuthPageLayout } from "./AuthPageLayout";
import { useForm, SubmitHandler } from "react-hook-form";
import { login, GoogleSignInButton, FormInput } from "wasp/client/auth";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Form, useNavigate } from "react-router-dom";
import { useState } from "react";

type LoginInputs = {
  email: string;
  password: string;
};

const LoginPage = () => {
  
  
  const [error, setError] = useState("");
  const queryParams = new URLSearchParams(location.search);
  const redirectRoute = queryParams.get("next");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInputs>();
  const navigate = useNavigate();

  const onSubmit: SubmitHandler<LoginInputs> = async (data) => {
    try {
      await login({ email: data.email, password: data.password });
      navigate("/dashboard");
    } catch (err: any) {
      setError(err.message || "Login failed");
      console.log(err);
    }
  };

  return (
    <AuthPageLayout
      title="Welcome"
      subTitle="Login to Doc E-Signer"
      errorMessage={error}
    >
      <div className="w-full space-y-8">
        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
            <GoogleSignInButton />

            <div className="flex items-center gap-5 py-5">
              <hr className="grow" />
              <p className="text-sm font-medium text-gray-700">OR</p>
              <hr className="grow" />
            </div>

            <div>
              <label htmlFor="email-address" className="sr-only">
                Email
              </label>
              <Input
                id="email"
                className="w-full"
                {...register("email", {
                  required: "Email is required",
                  pattern: {
                    value:
                      /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/,
                    message: "Invalid email format.",
                  },
                })}
                type="email"
                autoComplete="email"
                placeholder="Email"
              />
              {errors.email && (
                <p className="mt-1 text-xs font-medium text-red-600">
                  {errors.email.message}
                </p>
              )}
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <Input
                id="password"
                className="w-full"
                {...register("password", {
                  required: "Password is required",
                  minLength: {
                    value: 6,
                    message: "Password must be at least 6 characters",
                  },
                })}
                type="password"
                autoComplete="current-password"
                placeholder="Password"
              />
              {errors.password && (
                <p className="mt-1 text-xs font-medium text-red-600">
                  {errors.password.message}
                </p>
              )}
            </div>
          </div>

          <div>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <span className="flex items-center justify-center">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Logging in...
                </span>
              ) : (
                "Log in"
              )}
            </Button>
          </div>
        </form>
        <div className="text-sm text-center">
          <span className="text-gray-600">Don't have an account? </span>
          <WaspRouterLink
            to="/signup"
            className="font-medium text-gray-600 hover:text-gray-500"
          >
            Sign up
          </WaspRouterLink>

          <div className="text-sm text-center">
            <span className="text-gray-600">Forgot your password? </span>
            <WaspRouterLink
              to={routes.RequestPasswordResetRoute.to}
              className="font-medium text-gray-600 hover:text-gray-500"
            >
              Reset it
            </WaspRouterLink>
            .
          </div>
        </div>
      </div>
    </AuthPageLayout>
  );
};

export default LoginPage;
