
"use client";

import * as React from 'react';
import { Button } from './button';
import { Card, CardContent } from './card';

export function CalculatorComponent() {
  const [input, setInput] = React.useState('');
  const [result, setResult] = React.useState<string | null>(null);

  const handleButtonClick = (value: string) => {
    if (result !== null) {
      setInput(value);
      setResult(null);
    } else {
      setInput(input + value);
    }
  };

  const handleClear = () => {
    setInput('');
    setResult(null);
  };

  const handleCalculate = () => {
    try {
        // Use a function constructor for safe evaluation
        const calculatedResult = new Function('return ' + input)();
        if (isNaN(calculatedResult) || !isFinite(calculatedResult)) {
           setResult('خطأ');
        } else {
           setResult(String(calculatedResult));
           setInput(String(calculatedResult));
        }
    } catch (error) {
      setResult('خطأ');
    }
  };

  const buttons = [
    '7', '8', '9', '/',
    '4', '5', '6', '*',
    '1', '2', '3', '-',
    '0', '.', '=', '+'
  ];

  return (
    <Card className="w-64 bg-background/80 backdrop-blur-sm">
      <CardContent className="p-4">
        <div className="mb-4 h-12 rounded-md border bg-muted p-2 text-right text-2xl font-mono">
          {(result ?? input) || '0'}
        </div>
        <div className="grid grid-cols-4 gap-2">
            <Button variant="destructive" className="col-span-4" onClick={handleClear}>
                مسح
            </Button>
          {buttons.map((btn) => (
            <Button
              key={btn}
              variant={['/', '*', '-', '+', '='].includes(btn) ? 'secondary' : 'outline'}
              className="h-14 text-xl"
              onClick={() => (btn === '=' ? handleCalculate() : handleButtonClick(btn))}
            >
              {btn}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
