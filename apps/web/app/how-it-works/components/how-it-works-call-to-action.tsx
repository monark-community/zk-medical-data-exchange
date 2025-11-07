import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useWeb3AuthLogin } from "@/hooks/useAuth";

export default function HowItWorksCallToAction() {
  const router = useRouter();
  const { login } = useWeb3AuthLogin();
  return (
    <section className="py-16 bg-gradient-to-r from-blue-600 to-teal-600">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-3xl font-bold text-white mb-4">Ready to Get Started?</h2>
        <p className="text-blue-100 text-lg mb-8 max-w-2xl mx-auto">
          Join the future of medical research with secure, privacy-preserving data collaboration
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button 
            size="lg" 
            variant="outline" 
            className="bg-white text-blue-600 hover:bg-blue-50"
            onClick={() => router.push("/research")}
          >
            Explore Research
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
          <Button 
            size="lg" 
            className="bg-blue-700 hover:bg-blue-800 text-white"
            onClick={login}
          >
            Connect Your Wallet
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </section>
  );
}