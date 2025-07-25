import React, { FC } from "react";
import ProtectedLayout from "../layouts/ProtectedLayout";
import withProtectedLayout from "../HOC/withProtectedLayout";

const SettingsPage: FC = () => {
  return <div>Settings</div>;
};

export default withProtectedLayout(SettingsPage,"Settings");
