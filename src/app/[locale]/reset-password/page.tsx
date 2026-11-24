import { Suspense } from "react";
import ResetPassword from "@/components/pages/login/ResetPassword";

// Токен читается из адреса (useSearchParams), поэтому форма внутри Suspense.
const page = () => {
  return (
    <Suspense>
      <ResetPassword />
    </Suspense>
  );
};

export default page;
