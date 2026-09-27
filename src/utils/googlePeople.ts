export interface GoogleUserProfile {
  firstName: string;
  familyName: string;
  fullName: string;
  birthDate?: string; // YYYY-MM-DD
  locationName?: string;
  photoUrl?: string;
  email?: string;
}

export async function fetchGooglePeopleProfile(accessToken: string): Promise<GoogleUserProfile> {
  const url = 'https://people.googleapis.com/v1/people/me?personFields=names,birthdays,addresses,photos,emailAddresses';
  
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Google People API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();

  let firstName = '';
  let familyName = '';
  let fullName = '';
  let birthDate: string | undefined = undefined;
  let locationName: string | undefined = undefined;
  let photoUrl: string | undefined = undefined;
  let email: string | undefined = undefined;

  // Extract name
  if (data.names && data.names.length > 0) {
    const primaryName = data.names.find((n: any) => n.metadata?.primary) || data.names[0];
    firstName = primaryName.givenName || '';
    familyName = primaryName.familyName || '';
    fullName = primaryName.displayName || `${firstName} ${familyName}`.trim();
  }

  // Extract birthday
  if (data.birthdays && data.birthdays.length > 0) {
    const bday = data.birthdays.find((b: any) => b.date) || data.birthdays[0];
    if (bday?.date) {
      const year = bday.date.year || 2000;
      const month = String(bday.date.month || 1).padStart(2, '0');
      const day = String(bday.date.day || 1).padStart(2, '0');
      birthDate = `${year}-${month}-${day}`;
    }
  }

  // Extract address / location
  if (data.addresses && data.addresses.length > 0) {
    const primaryAddress = data.addresses.find((a: any) => a.metadata?.primary) || data.addresses[0];
    locationName = primaryAddress.city || primaryAddress.formattedValue || primaryAddress.region;
  }

  // Photos
  if (data.photos && data.photos.length > 0) {
    photoUrl = data.photos[0].url;
  }

  // Email
  if (data.emailAddresses && data.emailAddresses.length > 0) {
    email = data.emailAddresses[0].value;
  }

  return {
    firstName: firstName || fullName.split(' ')[0] || 'Athlete',
    familyName,
    fullName: fullName || 'Athlete',
    birthDate,
    locationName,
    photoUrl,
    email,
  };
}
