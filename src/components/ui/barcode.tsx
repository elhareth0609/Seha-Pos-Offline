
"use client";
import React, { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';

interface BarcodeProps extends React.SVGProps<SVGSVGElement> {
  value: string;
  options?: JsBarcode.Options;
}

const Barcode: React.FC<BarcodeProps> = ({ value, options, ...props }) => {
  const ref = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (ref.current) {
      JsBarcode(ref.current, value, {
        displayValue: true,
        margin: 0,
        ...options
      });
    }
  }, [value, options]);

  return <svg ref={ref} {...props}></svg>;
};

export default Barcode;
