import React, { FC } from "react";
import { makeColorTransparent } from "../../../lib/utils";
import { Signature } from "lucide-react";
import { PlacedObject } from "../types";

type TemSignProps = {
  placedAsset: PlacedObject;
  isValueEdittable?: boolean;
};

const TEM_Sign: FC<TemSignProps> = ({
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
        <img
          src={placedAsset.value}
          alt="Signature"
          className="w-full h-full object-contain"
        />
      ) : (
        <>
          <Signature />
          <span className="text-xs font-medium text-gray-700 tracking-wide">
            Signature
          </span>
        </>
      )}
    </div>
  );
};

export default TEM_Sign;