import { cn } from "@/lib/utils";
import { Boxes } from "@/components/ui/background-boxes";
import SignupForm from "@/components/Auth/SignUpForm";

export default function Register() {
  return (
    <div className='min-h-screen relative w-full overflow-hidden bg-slate-900 flex flex-col items-center justify-center rounded-lg'>
      <div className='absolute inset-0 w-full h-full bg-slate-900 z-20 [mask-image:radial-gradient(transparent,white)] pointer-events-none' />

      <Boxes />
      <div className={cn("relative z-20 w-full md:w-1/2 mx-auto")}>
        <SignupForm />
      </div>
    </div>
  );
}
