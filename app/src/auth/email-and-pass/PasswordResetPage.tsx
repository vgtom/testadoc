import { Link as WaspRouterLink, routes } from "wasp/client/router";
import { resetPassword, ResetPasswordForm } from "wasp/client/auth";
import { AuthPageLayout } from "../AuthPageLayout";
import { useForm } from 'react-hook-form'
import { useLocation } from "react-router-dom";
import { useState } from "react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";


export function PasswordResetPage() {
  const [errorMessage, setErrorMessage ] = useState("")
  const [successMessage, setSuccessMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<{ password: string; passwordConfirmation: string }>();

  const location = useLocation();
  const token = new URLSearchParams(location.search).get("token");
  const onSubmit = async (data: { password: string; passwordConfirmation: string }) => {
    if (!token) {
      setErrorMessage("The token is missing from the URL. Please check the link you received in your email.");
      return;
    }

    if (!data.password || data.password !== data.passwordConfirmation) {
      setErrorMessage(`Passwords don't match!`);
      return;
    }

    setIsLoading(true);
    setErrorMessage("");
    setSuccessMessage("");
    try {
      await resetPassword({ password: data.password, token });
      reset();
      setSuccessMessage("Your password has been reset.");
    } catch (error: any) {
      setErrorMessage(error.data?.data?.message);
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <AuthPageLayout title="Welcome" subTitle="Reset password">
      <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
         
          <div className="space-y-4">



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
                    message: "Password must be at least 6 characters"
                  }
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


            <div>
              <label htmlFor="password-confirmation" className="sr-only">
                Password Confirmation
              </label>
              <Input
                id="password"
                className="w-full"
                {...register("passwordConfirmation", {
                  required: "Password Confirmation is required",
                  minLength: {
                    value: 6,
                    message: "Password confirmation must be at least 6 characters"
                  }
                })}
                type="password"
                autoComplete="current-password"
                placeholder="Password confirmation"
              />
              {errors.passwordConfirmation && (
                <p className="mt-1 text-xs font-medium text-red-600">
                  {errors.passwordConfirmation.message}
                </p>
              )}
            </div>
          </div>

          <div>
            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Logging in...
                </span>
              ) : (
                'Log in'
              )}
            </Button>
          </div>
        </form>
      <br />
      <span className="text-sm font-medium text-gray-900">
        If everything is okay,{" "}
        <WaspRouterLink to={routes.LoginRoute.to}>go to login</WaspRouterLink>
      </span>
    </AuthPageLayout>
  );
}
