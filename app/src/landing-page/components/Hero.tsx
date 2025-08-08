import contractSigningImage from "../../client/static/contract-signing.png";
import { Button } from "../../components/ui/button";
import { MdRocketLaunch } from "react-icons/md";
import { useNavigate } from "react-router-dom";
import { routes } from "wasp/client/router";

export default function Hero() {
  const navigate = useNavigate();
  return (
    <div className="relative w-full bg-black h-[50vh] min-h-[600px] text-white px-10 flex justify-between flex-wrap overflow-hidden">
      <TopGradient />
      <BottomGradient />
      <div className="p-10 h-full grid pb-[80px] ">
        <div>
          <h1 className="text-[5rem] font-bold text-[#6dbdf4]">Jurito</h1>
          <p className="text-[4rem] -mt-4 leading-tight">
            Sign Contracts <br /> Securely
          </p>
        </div>
        <Button
          className="bg-[#0e7ec8] font-medium  p-7 hover:bg-[#1d6fa5] w-fit self-end group hover:rounded-xl"
          onClick={() => navigate(routes.LoginRoute.to)}
        >
          <MdRocketLaunch className="scale-150 group-hover:scale-[1.7] group-hover:translate-x-1 group-hover:-translate-y-1 transition-all" />{" "}
          <span className="group-hover:pl-2 transition-all text-xl">Get Started</span>
        </Button>
      </div>
      <img className="invert h-[50%]" src={contractSigningImage} alt="" />
    </div>
  );
}

function TopGradient() {
  return (
    <div
      className="absolute top-0 right-0 -z-10 transform-gpu overflow-hidden w-full blur-3xl sm:top-0"
      aria-hidden="true"
    >
      <div
        className="aspect-[1020/880] w-[55rem] flex-none sm:right-1/4 sm:translate-x-1/2 dark:hidden bg-gradient-to-tr from-amber-400 to-purple-300 opacity-40"
        style={{
          clipPath:
            "polygon(80% 20%, 90% 55%, 50% 100%, 70% 30%, 20% 50%, 50% 0)",
        }}
      />
    </div>
  );
}

function BottomGradient() {
  return (
    <div
      className="absolute inset-x-0 top-[calc(100%-40rem)] sm:top-[calc(100%-65rem)] -z-10 transform-gpu overflow-hidden blur-3xl"
      aria-hidden="true"
    >
      <div
        className="relative aspect-[1020/880] sm:-left-3/4 sm:translate-x-1/4 dark:hidden bg-gradient-to-br from-amber-400 to-purple-300  opacity-50 w-[72.1875rem]"
        style={{
          clipPath: "ellipse(80% 30% at 80% 50%)",
        }}
      />
    </div>
  );
}
