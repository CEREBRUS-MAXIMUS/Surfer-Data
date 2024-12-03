import { useState } from 'react';
import { Button } from "./ui/button";
import { Copy, Check } from 'lucide-react';
import MonacoEditor from '@monaco-editor/react';
import { getLanguageFromFilename } from '../helpers';

const CodeBlock = ({ run, code, filename }) => {
  const [showCheck, setShowCheck] = useState(false);

  const detectedLanguage = filename 
    ? getLanguageFromFilename(filename)
    : 'plaintext';

  const handleCopyCode = () => {
    navigator.clipboard.writeText(code);
    setShowCheck(true);
    setTimeout(() => setShowCheck(false), 500);
  };

  let formattedCode;

  if (detectedLanguage === 'python') {
    formattedCode = code.replace('platform-001', run.platformId);
  }
  else if (detectedLanguage === 'markdown') {
    formattedCode = code.replace('[insert-folder-path-of-your-choice-here]', run.exportPath);
  }
  else {
    formattedCode = code;
  }

  return (
    <div className="scroll-mt-16">
      <div className="relative">
        <div className="relative rounded-lg overflow-hidden">
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
          <MonacoEditor
            height="70vh"
            language={detectedLanguage}
            theme="vs-dark"
            value={formattedCode}
            options={{ 
              readOnly: true,
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              wordWrap: 'on',
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default CodeBlock;
