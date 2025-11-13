import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Lock, Database, CheckCircle } from "lucide-react";

export default function HowItWorksFeatures() {
  const features = [
    {
      icon: Shield,
      title: 'Blockchain Technology',
      description: 'A secure, transparent, and decentralized ledger that ensures data integrity and trust without intermediaries.',
      details: ['Immutable record keeping', 'Transparent transactions', 'Decentralized network']
    },
    {
      icon: Lock,
      title: 'Zero-Knowledge Proofs',
      description: 'Advanced cryptography that allows verification of data without revealing the actual information.',
      details: ['Privacy-preserving verification', 'Secure computation', 'Anonymous validation']
    },
    {
      icon: Database,
      title: 'Digital Wallets',
      description: 'Your secure digital identity that manages your data, tokens, and interactions on the blockchain.',
      details: ['Secure key management', 'Identity verification', 'Transaction control']
    }
  ];

  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12">Technology Fundamentals</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader>
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-teal-500 rounded-lg flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                  <CardDescription className="text-gray-600">
                    {feature.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {feature.details.map((detail, idx) => (
                      <li key={idx} className="flex items-center text-sm text-gray-600">
                        <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                        {detail}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}