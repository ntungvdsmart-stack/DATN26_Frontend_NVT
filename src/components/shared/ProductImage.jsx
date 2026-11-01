import { useState } from 'react';
import { motion } from 'framer-motion';
import placeholder from '../../assets/product-placeholder.svg';

// Keep the fallback local so a failed external image host cannot break it too.
export default function ProductImage({ src, alt = '', animated = false, onError, ...props }) {
  const source = typeof src === 'string' ? src.trim() : '';
  const [failedSource, setFailedSource] = useState(null);
  const fallback = !source || failedSource === source;
  const Image = animated ? motion.img : 'img';
  return <Image {...props} src={fallback ? placeholder : source} alt={alt} onError={event => {
    if (!fallback) setFailedSource(source);
    onError?.(event);
  }} />;
}
