import { useEffect, useState } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { GoogleSignInButton, signup, useAuth } from "wasp/client/auth";
import { Link } from "wasp/client/router";
import { AuthPageLayout } from "./AuthPageLayout";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { ErrorResponse, useNavigate } from "react-router-dom";

type SignupInputs = {
  email: string;
  password: string;
  repeatPassword: string;
};

const Signup = () => {
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
    watch,
  } = useForm<SignupInputs>();

  const password = watch("password");

  const onSubmit: SubmitHandler<SignupInputs> = async (data) => {
    try {
      const { repeatPassword, email, password } = data;
      await signup({ email, password, username: email, isAdmin: false });
      setSuccessMessage(
        `You've signed up successfully! Check your email for the confirmation link.`
      );
      reset();
      // navigate("/request-password-reset")
    } catch (err: any) {
      setErrorMessage(
        err.data.data.message || err.data.message || "Signup failed"
      );
    }
  };

  return (
    <AuthPageLayout
      title="Welcome"
      subTitle="Signup to Doc E-Signer"
      errorMessage={errorMessage}
      successMessage={successMessage}
    >
      <div className="w-full space-y-8">
        <div>
          <GoogleSignInButton />

          <div className="flex items-center gap-5 py-5">
            <hr className="grow" />
            <p className="text-sm font-medium text-gray-700">OR</p>
            <hr className="grow" />
          </div>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="sr-only">
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
                type="text"
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
                    value: 8,
                    message: "Password must be at least 8 characters",
                  },
                  pattern: {
                    value:
                      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s])[A-Za-z\d!@#$%^&*()_\-+=\[\]{}|\\;:'",.<>/?`~]{8,}$/,
                    message:
                      "Password must include uppercase, lowercase, number, and special character",
                  },
                })}
                type="password"
                autoComplete="new-password"
                placeholder="Password"
              />
              {errors.password && (
                <p className="mt-1 text-xs font-medium text-red-600">
                  {errors.password.message}
                </p>
              )}
            </div>
            <div>
              <label htmlFor="repeatPassword" className="sr-only">
                Repeat Password
              </label>
              <Input
                id="repeatPassword"
                className="w-full"
                {...register("repeatPassword", {
                  required: "Please confirm your password",
                  validate: (value) =>
                    value === password || "Passwords do not match",
                })}
                type="password"
                autoComplete="new-password"
                placeholder="Repeat Password"
              />
              {errors.repeatPassword && (
                <p className="mt-1 text-xs font-medium text-red-600">
                  {errors.repeatPassword.message}
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
                  Creating account...
                </span>
              ) : (
                "Create account"
              )}
            </Button>
          </div>
        </form>
        <div className="text-sm text-center">
          <span className="text-gray-600">Already have an account? </span>
          <Link
            to="/login"
            className="font-medium text-gray-600 hover:text-gray-500"
          >
            Log in
          </Link>
        </div>
      </div>
    </AuthPageLayout>
  );
};

export { Signup };
