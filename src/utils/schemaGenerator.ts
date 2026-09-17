// src/utils/schemaGenerator.ts
import { SchemaType } from '../types/rankmath';

export interface SchemaBuilderConfig {
  type: SchemaType;
  title: string;
  description: string;
  url: string;
  imageUrl?: string;
  publishedDate?: string;
  modifiedDate?: string;
  authorName?: string;
  authorRole?: string;
  // Specific extensions
  faqItems?: { question: string; answer: string }[];
  howToSteps?: { name: string; text: string }[];
  doctorSpecialty?: string;
  doctorCity?: string;
  clinicAddress?: string;
  eventDate?: string;
  eventLocation?: string;
  eventPrice?: number;
  productPrice?: number;
  ratingValue?: number;
  reviewCount?: number;
}

export function generateRankMathSchema(config: SchemaBuilderConfig): Record<string, any> {
  const {
    type,
    title,
    description,
    url,
    imageUrl = 'https://app.vernunt.com/vernunt-logo.png',
    publishedDate = '2026-01-15T08:00:00+05:30',
    modifiedDate = new Date().toISOString(),
    authorName = 'Dr. Radhika Sen, MD',
    authorRole = 'Pediatric Nutritionist & Child Health Specialist'
  } = config;

  const basePublisher = {
    '@type': 'Organization',
    name: 'Vernunt Health & Child Growth Network',
    url: 'https://app.vernunt.com',
    logo: {
      '@type': 'ImageObject',
      url: 'https://app.vernunt.com/vernunt-logo.png',
      width: 512,
      height: 512
    }
  };

  switch (type) {
    case 'Article':
    case 'MedicalWebPage': {
      return {
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': type === 'MedicalWebPage' ? ['Article', 'MedicalWebPage'] : 'Article',
            '@id': `${url}#article`,
            isPartOf: {
              '@type': 'WebSite',
              '@id': 'https://app.vernunt.com/#website',
              name: 'Vernunt',
              url: 'https://app.vernunt.com'
            },
            headline: title,
            description,
            url,
            mainEntityOfPage: url,
            datePublished: publishedDate,
            dateModified: modifiedDate,
            inLanguage: 'en-US',
            author: {
              '@type': 'Person',
              name: authorName,
              jobTitle: authorRole,
              url: `${url}#author`
            },
            publisher: basePublisher,
            image: {
              '@type': 'ImageObject',
              url: imageUrl,
              width: 1200,
              height: 630
            },
            ...(type === 'MedicalWebPage' ? {
              about: {
                '@type': 'MedicalSpecialty',
                name: 'Pediatrics & Pediatric Development'
              },
              aspect: 'Nutrition, Physical Health, Pediatric Guidelines'
            } : {})
          },
          {
            '@type': 'BreadcrumbList',
            '@id': `${url}#breadcrumb`,
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://app.vernunt.com' },
              { '@type': 'ListItem', position: 2, name: 'Knowledge Hub', item: 'https://app.vernunt.com/knowledge' },
              { '@type': 'ListItem', position: 3, name: title, item: url }
            ]
          }
        ]
      };
    }

    case 'FAQPage': {
      const faqs = config.faqItems || [
        {
          question: 'What are the main benefits of this parenting guide?',
          answer: 'This evidence-based guide provides pediatric-vetted daily meal routines, allergen safety protocols, and portion charts tailored to child age groups.'
        },
        {
          question: 'How does Vernunt ensure clinical accuracy?',
          answer: 'All guides are cross-referenced with Indian Academy of Pediatrics (IAP) and WHO developmental milestones and reviewed by verified pediatric specialists.'
        }
      ];

      return {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        '@id': `${url}#faqpage`,
        mainEntity: faqs.map(item => ({
          '@type': 'Question',
          name: item.question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: item.answer
          }
        }))
      };
    }

    case 'HowTo': {
      const steps = config.howToSteps || [
        { name: 'Step 1: Clinical Assessment', text: 'Screen for child nutritional deficiencies or developmental transition readiness.' },
        { name: 'Step 2: Nutrient-Dense Food Preparation', text: 'Incorporate prebiotic fiber, healthy fats, and cold-pressed purees.' },
        { name: 'Step 3: Gradual Introduction & Logging', text: 'Offer small portions for 3-5 days while monitoring digestion and energy levels.' }
      ];

      return {
        '@context': 'https://schema.org',
        '@type': 'HowTo',
        name: title,
        description,
        totalTime: 'PT15M',
        step: steps.map((s, idx) => ({
          '@type': 'HowToStep',
          position: idx + 1,
          name: s.name,
          text: s.text
        }))
      };
    }

    case 'Physician':
    case 'LocalBusiness': {
      return {
        '@context': 'https://schema.org',
        '@type': type === 'Physician' ? 'Physician' : 'LocalBusiness',
        '@id': `${url}#clinic`,
        name: config.authorName || 'Dr. Radhika Sen Clinic',
        description,
        url,
        telephone: '+91-80-4567-8900',
        priceRange: '₹₹',
        address: {
          '@type': 'PostalAddress',
          streetAddress: config.clinicAddress || '100 Feet Road, Indiranagar',
          addressLocality: config.doctorCity || 'Bangalore',
          addressRegion: 'Karnataka',
          postalCode: '560038',
          addressCountry: 'IN'
        },
        geo: {
          '@type': 'GeoCoordinates',
          latitude: 12.9716,
          longitude: 77.5946
        },
        openingHoursSpecification: [
          {
            '@type': 'OpeningHoursSpecification',
            dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
            opens: '09:00',
            closes: '19:00'
          }
        ],
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: config.ratingValue || 4.9,
          reviewCount: config.reviewCount || 142
        }
      };
    }

    case 'Event': {
      return {
        '@context': 'https://schema.org',
        '@type': 'Event',
        '@id': `${url}#event`,
        name: title,
        description,
        startDate: config.eventDate || '2026-10-10T10:00:00+05:30',
        endDate: '2026-10-10T12:30:00+05:30',
        eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
        eventStatus: 'https://schema.org/EventScheduled',
        location: {
          '@type': 'Place',
          name: config.eventLocation || 'Vernunt Community Hub, Indiranagar',
          address: {
            '@type': 'PostalAddress',
            addressLocality: 'Bangalore',
            addressRegion: 'KA',
            addressCountry: 'IN'
          }
        },
        organizer: basePublisher,
        offers: {
          '@type': 'Offer',
          url,
          price: config.eventPrice || 0,
          priceCurrency: 'INR',
          availability: 'https://schema.org/InStock',
          validFrom: '2026-01-01'
        }
      };
    }

    case 'Product': {
      return {
        '@context': 'https://schema.org',
        '@type': 'Product',
        '@id': `${url}#product`,
        name: title,
        description,
        image: imageUrl,
        brand: basePublisher,
        offers: {
          '@type': 'Offer',
          url,
          price: config.productPrice || 499,
          priceCurrency: 'INR',
          availability: 'https://schema.org/InStock'
        },
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: config.ratingValue || 4.9,
          reviewCount: config.reviewCount || 89
        }
      };
    }

    case 'BreadcrumbList': {
      return {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://app.vernunt.com' },
          { '@type': 'ListItem', position: 2, name: 'Knowledge', item: 'https://app.vernunt.com/knowledge' },
          { '@type': 'ListItem', position: 3, name: title, item: url }
        ]
      };
    }

    case 'Organization':
    default: {
      return basePublisher;
    }
  }
}
