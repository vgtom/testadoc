import { createContext, FC, ReactNode, useEffect, useState } from "react";
import { motion } from "motion/react";

type AuthPageLayoutProps = {
  title: string;
  subTitle: string;
  successMessage?: string;
  errorMessage?: string;
  children: ReactNode;
};
export const AuthPageLayout: FC<AuthPageLayoutProps> = ({
  title = "Welcome",
  subTitle = "Doc E-Signer",
  successMessage,
  errorMessage,
  children,
}) => {
  return (
    <div className="flex min-h-full flex-col justify-center px-4 pt-10 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <motion.div
          initial={{
            scale: 0.95,
            opacity: 0.5,
            y: 50,
          }}
          animate={{
            scale: 1,
            opacity: 1,
            y: 0,
            transition: { duration: 0.5 },
          }}
          className="bg-white py-8 px-4 sm:shadow-xl sm:ring-1 sm:ring-gray-900/10 sm:rounded-lg sm:px-10 dark:bg-white dark:text-gray-900"
        >
          <div className="-mt-8">
            <div className="w-full space-y-8">
              <div>
                <h2 className="mt-6 text-2xl sm:text-3xl font-semibold text-gray-900">
                  {title}
                </h2>
                <h2 className="text-lg sm:text-xl font-semibold text-gray-400">
                  {subTitle}
                </h2>
              </div>
              {successMessage && (
                <div className="bg-green-50 border border-green-900 rounded-sm p-5 font-medium text-sm text-green-900 text-center">
                  <p>{successMessage}</p>
                </div>
              )}
              {errorMessage && (
                <div className="bg-red-50 border border-red-900 rounded-sm p-5 font-medium text-sm text-red-900 text-center">
                  <p>{errorMessage}</p>
                </div>
              )}

              {children}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
