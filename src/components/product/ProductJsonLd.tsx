import type { ProductDetail } from '@/types/product';

interface ProductJsonLdProps {
  product: ProductDetail;
}

export default function ProductJsonLd({ product }: ProductJsonLdProps) {
  const price = Number(product.priceRetail);
  const mainImage = product.images[0]?.pathFull || product.imagePath;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    sku: product.code,
    ...(product.content?.shortDescription && { description: product.content.shortDescription }),
    ...(mainImage && { image: mainImage }),
    offers: {
      '@type': 'Offer',
      price: price.toFixed(2),
      priceCurrency: 'UAH',
      availability: product.quantity > 0
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      ...(product.category && { seller: { '@type': 'Organization', name: 'Clean Shop' } }),
    },
    ...(product.category && {
      category: product.category.name,
    }),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
