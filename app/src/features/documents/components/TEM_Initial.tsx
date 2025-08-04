import React, { FC } from "react";
import { makeColorTransparent } from "../../../lib/utils";
import { Text } from "lucide-react";
import { PlacedObject } from "../types";

type TemInitialProps = {
  placedAsset: PlacedObject;
  isValueEdittable?: boolean;
};

const TEM_Initial: FC<TemInitialProps> = ({
  placedAsset,
  isValueEdittable = false,
}) => {
  return (
    <div
      className={`w-full h-full flex flex-col items-center justify-center border-2 border-dashed border-slate-300 ${
        isValueEdittable ? "cursor-pointer hover:border-blue-500" : ""
      }`}
      style={{
        backgroundColor:
          makeColorTransparent(
            placedAsset.color || "#ffffff",
            placedAsset.value ? 10 : 60
          ) || "#ffffff",
      }}
    >
      {placedAsset.value ? (
        <div>{placedAsset.value}</div>
      ) : (
        <>
          <Text className="w-4 h-4 text-gray-700" />
          <span className="text-xs font-medium text-gray-700 tracking-wide">
            Initial
          </span>
        </>
      )}
    </div>
  );
};

export default TEM_Initial;