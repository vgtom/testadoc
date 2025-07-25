// withLayout.tsx
import React from "react";
import ProtectedLayout from "../layouts/ProtectedLayout";
import { Navigate } from "react-router-dom";

const withProtectedLayout = <P extends object>(
  WrappedComponent: React.ComponentType<P>,
  title?: string
) => {

  return (props: P) => (
    <ProtectedLayout>
      {title && (
        <header className="p-5 border-b">
          <h1 className="text-[2rem]">{title}</h1>
        </header>
      )}
      <main className="p-5">
        <WrappedComponent {...props} />
      </main>
    </ProtectedLayout>
  );
};

export default withProtectedLayout;
