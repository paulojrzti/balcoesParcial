import SimpleMenu from "@/components/SimpleMenu";
import Image from "next/image";

export function Menu() {
  return (
    <nav className="w-screen py-10 px-30 flex items-center justify-between relative">
      <div className="flex items-center">
        <Image src="/logo.svg" alt="Logo" width={200} height={50} />
      </div>
      <SimpleMenu />
    </nav>
  );
}
