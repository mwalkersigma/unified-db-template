/** @type {import('next').NextConfig} */
import { PHASE_PRODUCTION_BUILD } from "next/constants.js";

export default (phase) => {
  let baseConfig = {
    reactStrictMode: true,
  }
  switch (phase) {
    case PHASE_PRODUCTION_BUILD:
      baseConfig.distDir = 'build'
      break;
    default:
      baseConfig.distDir = '.next'
      break;
  }

  return baseConfig;
};