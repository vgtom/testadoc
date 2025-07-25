import { ForgotPasswordForm, requestPasswordReset } from "wasp/client/auth";
import { AuthPageLayout } from "../AuthPageLayout";
import { Button } from "../../components/ui/button";
import { useState } from "react";
import { Input } from "../../components/ui/input";
import { useForm, SubmitHandler } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { routes } from "wasp/client/router";
import { MdArrowForward } from "react-icons/md";

export function RequestPasswordResetPage() {
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<{ email: string }>();
  const navigate = useNavigate();

  const onSubmit = async (data: { email: string }) => {
    setIsLoading(true);
    setErrorMessage("");
    setSuccessMessage("");
    try {
      await requestPasswordReset(data);
      reset();
      setSuccessMessage("Check your email for a password reset link.");
    } catch (error: any) {
      setErrorMessage(error.data?.data?.message);
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <AuthPageLayout
      title="Welcome"
      subTitle="Reset Password"
      errorMessage={errorMessage}
      successMessage={successMessage}
    >

      <form className=" space-y-6" onSubmit={handleSubmit(onSubmit)}>
        {errorMessage && (
          <div className="rounded-md bg-red-50 p-4">
            <div className="text-sm text-red-700">{errorMessage}</div>
          </div>
        )}
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
        </div>

        <div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
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
                Submitting...
              </span>
            ) : (
              "Submit"
            )}
          </Button>
        </div>
      </form>
      <div className="flex items-end">
        <Button
          onClick={() => navigate(routes.LoginRoute.to)}
          variant={"link"}
          className="p-0 ml-auto mr-0"
        >
          Go to login page <MdArrowForward />{" "}
        </Button>
      </div>
    </AuthPageLayout>
  );
}
