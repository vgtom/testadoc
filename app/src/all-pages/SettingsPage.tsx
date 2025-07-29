import React, { FC } from "react";
import withProtectedLayout from "../client/HOC/withProtectedLayout";

const SettingsPage: FC = () => {
  return <div>Settings</div>;
};

export default withProtectedLayout(SettingsPage,"Settings");
