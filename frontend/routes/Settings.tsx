import APIKeyForm from "@/frontend/components/APIKeyForm";
import { Link, useSearchParams } from "react-router";
import { buttonVariants } from "../components/ui/button";
import { ArrowLeftIcon } from "lucide-react";

export default function Settings() {
  const [searchParams] = useSearchParams();
  const chatId = searchParams.get("from");
  return (
    <section className="flex w-full h-full">
      <Link
        to={chatId ? `/chat/${chatId}` : "/chat"}
        className={buttonVariants({
          variant: "default",
          className: "w-fit fixed top-10 left-40 z-10",
        })}
      >
        <ArrowLeftIcon className="w-4 h-4" />
        Tillbaks till Bärta
      </Link>
      <div className="flex items-center justify-center w-full h-full pt-24 pb-44 mx-auto">
        <APIKeyForm />
      </div>
    </section>
  );
}
