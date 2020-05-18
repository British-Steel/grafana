import React, { FunctionComponent } from 'react';
import { SvgProps } from './types';

export const Grafana: FunctionComponent<SvgProps> = ({ size, ...rest }) => {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 85.12 92.46" height={size} width={size} {...rest}>
      <defs>
        <linearGradient id="SVGID_1_" gradientUnits="userSpaceOnUse" x1="42.562" y1="113.2595" x2="42.562" y2="28.7828">
          <stop offset="0" style={{ stopColor: '#FFF200' }} />
          <stop offset="1" style={{ stopColor: '#F15A29' }} />
        </linearGradient>
      </defs>
    </svg>
  );
};
