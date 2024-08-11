import React from 'react';
import { Button } from '../components/ui/button';
import { SurferHeader } from '../components/header/SurferHeader';
import { Card, CardContent } from '../components/ui/card';
import { Download } from 'lucide-react';
import { toast } from '../components/ui/use-toast';

// Import logos
import SurferLogo from 'assets/Surfer.png';

const Integrations: React.FC = () => {
  const integrations = [
    { name: 'Open Interpreter', logo: SurferLogo },
    { name: 'Friend', logo: SurferLogo },
    { name: 'SuperMemory.ai', logo: SurferLogo },
  ];

  const handleConnect = (integrationName: string) => {
    toast({
      title: "Not Yet Implemented",
      description: `The ${integrationName} integration is not yet coded. We will integrate it soon!`,
      duration: 3000,
    });
  };

  return (
    <div className="h-screen flex flex-col w-full bg-background">
      <SurferHeader className="flex-shrink-0 h-[55px] w-full" />
      <div className="flex-grow flex flex-col items-center justify-center p-4">
        <div className="flex flex-wrap justify-center gap-8">
          {integrations.map((integration) => (
            <Card key={integration.name} className="w-64 p-4 flex flex-col items-center">
              <CardContent className="flex flex-col items-center">
                <img
                  src={integration.logo}
                  alt={`${integration.name} logo`}
                  className="h-32 w-32 mb-4 object-contain"
                />
                <h3 className="text-lg font-medium mb-4 text-center">{integration.name}</h3>
                <Button
                  onClick={() => handleConnect(integration.name)}
                  className="w-full"
                  variant="outline"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Connect
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Integrations;
