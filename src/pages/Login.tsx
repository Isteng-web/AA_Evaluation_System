import { useAuth } from '../lib/auth';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { LogIn, ShieldCheck } from 'lucide-react';
import { Navigate } from 'react-router-dom';

export default function Login() {
  const { user, signIn } = useAuth();

  if (user) return <Navigate to="/" />;

  return (
    <div className="min-h-screen bg-[#E4E3E0] flex flex-col items-center justify-center p-4 font-sans text-[#141414]">
      <div className="absolute top-0 left-0 w-full p-8 border-b border-[#141414] flex justify-between items-center">
        <div className="flex items-center gap-2 font-mono font-bold uppercase tracking-tighter text-xl">
          <ShieldCheck className="w-6 h-6" />
          FACULTY_EVAL_v1.0
        </div>
        <div className="font-mono text-xs italic opacity-50 uppercase">
          SECURE_ACCESS_GATE
        </div>
      </div>

      <Card className="w-full max-w-md border-2 border-[#141414] shadow-[8px_8px_0px_0px_rgba(20,20,20,1)] bg-white rounded-none">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-mono uppercase font-black">Authentication</CardTitle>
          <CardDescription className="italic font-serif">
            Please authorize with your institutional identification.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 pt-4">
          <Button 
            onClick={signIn}
            className="w-full bg-[#141414] text-[#E4E3E0] hover:bg-white hover:text-[#141414] border border-[#141414] transition-all rounded-none font-mono py-6 text-lg uppercase font-bold"
          >
            <LogIn className="mr-2 h-5 w-5" />
            Authorize via Google
          </Button>
          <p className="text-xs text-center font-mono opacity-50 uppercase mt-4">
            Authorized roles: STUDENT | SUPERVISOR | FACULTY | ADMIN
          </p>
        </CardContent>
      </Card>
      
      <div className="mt-12 max-w-md text-center">
        <p className="text-[10px] font-mono leading-relaxed opacity-40 uppercase tracking-widest">
          This system is governed by the confidentiality protocols of the Academic Office. 
          All submissions are anonymous and encrypted for verification integrity.
        </p>
      </div>
    </div>
  );
}
