import React, { FC, ReactNode } from "react";
import SideBar from "./SideBar";
import { useAuth } from "wasp/client/auth";
import { Navigate } from "react-router-dom";

type LayoutProps = {
  children: ReactNode;
};

const ProtectedLayout: FC<LayoutProps> = ({ children }) => {
  const {data, isLoading} = useAuth();
  if (isLoading) return <>Loading...</>
  if (!data) return <Navigate to={`/login?next=${location.pathname}`} />
  return (
    <main className="grid grid-cols-[15rem_auto] h-[calc(100vh-3.5rem)] ">
      <div className="bg-slate-900 h-[calc(100vh-3.5rem)] fix  text-white p-5 pt-10">
        <SideBar />
      </div>
      <div className="overflow-auto">{children}</div>
    </main>
  );
};

export default ProtectedLayout;
