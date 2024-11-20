import React, { useState } from 'react';
import { Button } from "./ui/button";
import { Copy, Check } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

const CodeBlock = ({ title, code, language = "python" }) => {
  const [showCheck, setShowCheck] = useState(false);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(code);
    setShowCheck(true);
    setTimeout(() => setShowCheck(false), 500);
  };

  return (
    <div id={title ? title.toLowerCase().replace(/\s+/g, '-') : 'code-block'} className="scroll-mt-16">
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <div className="relative">
        <div className="relative rounded-lg">
          <Button 
            variant="ghost" 
            size="sm" 
            className="absolute right-2 top-2 hover:bg-zinc-800 z-10"
            onClick={handleCopyCode}
          >
            {showCheck ? (
              <Check className="h-4 w-4 text-green-500" />
            ) : (
              <Copy className="h-4 w-4 text-muted-foreground" />
            )}
          </Button>
          <SyntaxHighlighter
            language={language}
            style={oneDark}
            customStyle={{
              margin: 0,
              borderRadius: '0.5rem',
            }}
          >
            {code}
          </SyntaxHighlighter>
        </div>
      </div>
    </div>
  );
};

export default CodeBlock;
