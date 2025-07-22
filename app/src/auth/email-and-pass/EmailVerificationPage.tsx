import { Link as WaspRouterLink, routes } from "wasp/client/router";
import { verifyEmail, VerifyEmailForm } from "wasp/client/auth";
import { AuthPageLayout } from "../AuthPageLayout";
import { useEffect, useState } from "react";
import { Button } from "../../components/ui/button";
import { MdArrowForward } from "react-icons/md";
import { useNavigate } from "react-router-dom";

export function EmailVerificationPage() {
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const token = new URLSearchParams(location.search).get("token");
  const navigate = useNavigate();

  async function submitForm() {
    if (!token) {
      setErrorMessage(
        "The token is missing from the URL. Please check the link you received in your email."
      );
      return;
    }
    setIsLoading(true);
    setErrorMessage("");
    setSuccessMessage("");
    try {
      await verifyEmail({ token });
      setSuccessMessage("Your email has been verified. You can now log in.");
    } catch (error: any) {
      setErrorMessage(error.data?.data?.message);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    submitForm();
  }, [location]);
  return (
    <AuthPageLayout
      title="Welcome"
      subTitle="Email Verification"
      successMessage={successMessage}
      errorMessage={errorMessage}
    >


      {/* <VerifyEmailForm /> */}
      <br />
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
