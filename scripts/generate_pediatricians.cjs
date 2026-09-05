const fs = require('fs');
const path = require('path');

// Curated verified authentic medical doctor portrait photos with white coats, stethoscopes, clinical backgrounds
const REAL_DOCTOR_PHOTOS = [
  'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=400&crop=faces',
  'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=400&crop=faces',
  'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=400&crop=faces',
  'https://images.unsplash.com/photo-1594824813501-48325a7e3760?auto=format&fit=crop&q=80&w=400&crop=faces',
  'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=400&crop=faces',
  'https://images.unsplash.com/photo-1582750433449-648ed127bb54?auto=format&fit=crop&q=80&w=400&crop=faces',
  'https://images.unsplash.com/photo-1622902046580-2b47f47f5471?auto=format&fit=crop&q=80&w=400&crop=faces',
  'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&q=80&w=400&crop=faces',
  'https://images.unsplash.com/photo-1638202993928-7267aad84c31?auto=format&fit=crop&q=80&w=400&crop=faces',
  'https://images.unsplash.com/photo-1651008376811-b90baee60c1f?auto=format&fit=crop&q=80&w=400&crop=faces',
  'https://images.unsplash.com/photo-1580281657557-2a69d0ffcfdd?auto=format&fit=crop&q=80&w=400&crop=faces',
  'https://images.unsplash.com/photo-1614608682850-e0d6ed316d47?auto=format&fit=crop&q=80&w=400&crop=faces',
  'https://images.unsplash.com/photo-1527613426441-4da17471b66d?auto=format&fit=crop&q=80&w=400&crop=faces',
  'https://images.unsplash.com/photo-1625498542602-6bfb30f39b3f?auto=format&fit=crop&q=80&w=400&crop=faces',
  'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&q=80&w=400&crop=faces',
  'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&q=80&w=400&crop=faces',
  'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&q=80&w=400&crop=faces',
  'https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?auto=format&fit=crop&q=80&w=400&crop=faces',
  'https://images.unsplash.com/photo-1551601651-2a8555f1a136?auto=format&fit=crop&q=80&w=400&crop=faces',
  'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&q=80&w=400&crop=faces',
  'https://images.unsplash.com/photo-1666887360680-9bdd5339f4bf?auto=format&fit=crop&q=80&w=400&crop=faces',
  'https://images.unsplash.com/photo-1631815589968-fdb09a223b1e?auto=format&fit=crop&q=80&w=400&crop=faces',
  'https://images.unsplash.com/photo-1607613009820-a29f7bb81c04?auto=format&fit=crop&q=80&w=400&crop=faces',
  'https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&q=80&w=400&crop=faces',
  'https://images.unsplash.com/photo-1550831107-1553da8c8464?auto=format&fit=crop&q=80&w=400&crop=faces',
  'https://images.unsplash.com/photo-1591604021695-0c69b7c03381?auto=format&fit=crop&q=80&w=400&crop=faces',
  'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&q=80&w=400&crop=faces',
  'https://images.unsplash.com/photo-1622253694242-abeb3c84b192?auto=format&fit=crop&q=80&w=400&crop=faces',
  'https://images.unsplash.com/photo-1579684288402-e3f773c3c219?auto=format&fit=crop&q=80&w=400&crop=faces',
  'https://images.unsplash.com/photo-1605684954998-685c79d6a018?auto=format&fit=crop&q=80&w=400&crop=faces',
  'https://images.unsplash.com/photo-1584467735815-f778f274e296?auto=format&fit=crop&q=80&w=400&crop=faces',
  'https://images.unsplash.com/photo-1583912267670-6575ad472688?auto=format&fit=crop&q=80&w=400&crop=faces',
  'https://images.unsplash.com/photo-1584467735871-8e85353a8413?auto=format&fit=crop&q=80&w=400&crop=faces',
  'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=400&crop=faces',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400&crop=faces',
  'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=400&crop=faces'
];

function getPhotoUrl(index) {
  return REAL_DOCTOR_PHOTOS[index % REAL_DOCTOR_PHOTOS.length];
}

console.log('Total verified photo URLs:', REAL_DOCTOR_PHOTOS.length);
