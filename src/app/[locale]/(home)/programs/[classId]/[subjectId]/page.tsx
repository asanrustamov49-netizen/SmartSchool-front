import { ProgramPage } from "@/components/pages/programs/ProgramPage";

// Класс и предмет читаются на клиенте через useParams: программа загружается в браузере.
const page = () => {
  return <ProgramPage />;
};

export default page;
