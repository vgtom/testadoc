import React, { FC } from "react";
import {
  MdAccountCircle,
  MdCircleNotifications,
  MdDashboard,
  MdSettings,
} from "react-icons/md";
import { Link, routes } from "wasp/client/router";
import { cn } from "../cn";
import { HiDocument } from "react-icons/hi2";
import { CgTemplate } from "react-icons/cg";

const sidebarContents = [
  {
    name: "Documents",
    to: routes.DocumentsRoute.to,
    icon: <HiDocument />,
  },
  {
    name: "Templates",
    to: routes.TemplatesRoute.to,
    icon: <CgTemplate />,
  },
  {
    name: "Contacts",
    to: routes.ContactsRoute.to,
    icon: <CgTemplate />,
  },
  {
    name: "Settings",
    to: routes.SettingsRoute.to,
    icon: <MdSettings />,
  },
];

const SideBar: FC = () => {
  const activePath = location.pathname;
  return (
    <aside className="grid grid-rows-[1fr_min-content] gap-4 h-full">
      <div>
        {sidebarContents.map((sidebarItem) => (
          <Link
            key={sidebarItem.to}
            className={cn(
              "flex items-center gap-3 p-3 rounded-md",
              activePath === sidebarItem.to
                ? "bg-slate-700"
                : "bg-slate-900 hover:bg-slate-800"
            )}
            to={sidebarItem.to}
          >
            {sidebarItem.icon}
            <p>{sidebarItem.name}</p>
          </Link>
        ))}
      </div>

      <Link
        className={cn(
          "flex items-center gap-3 p-3 rounded-md",
          activePath === routes.AccountRoute.to
            ? "bg-slate-700"
            : "bg-slate-900 hover:bg-slate-800"
        )}
        to={routes.AccountRoute.to}
      >
        <MdAccountCircle />
        <p>Account</p>
      </Link>

      {/* <Link
        className={cn(
          "flex items-center gap-3 p-3 rounded-md",
          activePath === routes.DocumentPreviewRoute.build({ params: { documentId: '1' } })
            ? "bg-slate-700"
            : "bg-slate-900 hover:bg-slate-800"
        )}
        to={routes.DocumentPreviewRoute.build({ params: { documentId: '1' } }) as any}
      >
        <MdDashboard />
        <p>Preview Doc</p>
      </Link> */}
    </aside>
  );
};

export default SideBar;
