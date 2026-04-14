import { doc, updateDoc, setDoc } from 'firebase/firestore';
import { db } from '../config';
import type { StylistSettingsForm } from '@/lib/schemas/stylist-settings';
import { calculateTimezoneFromLocation } from '../../utils/timezone-utils';

export async function updateStylistProfile(
  userId: string, 
  data: Partial<StylistSettingsForm>
) {
  // Check if location data is being updated
  const hasLocationData = data.city || data.state || data.zipCode || data.businessAddress;
  
  try {
    // Update stylist profile document
    const stylistRef = doc(db, 'stylists', userId);
    const profileUpdateData: Record<string, any> = { ...data };

    // If location is being updated, calculate and include timezone
    if (hasLocationData) {
      const calculatedTimezone = calculateTimezoneFromLocation(
        data.city,
        data.state,
        data.zipCode
      );
      
      console.log(`✓ Calculated timezone: ${calculatedTimezone}`);
      profileUpdateData.calculatedTimezone = calculatedTimezone;
    }

    // Add update timestamp
    profileUpdateData.updatedAt = new Date().toISOString();

    // Update stylist profile
    await updateDoc(stylistRef, profileUpdateData);
    console.log('✓ Stylist profile updated');

    // If location changed, also update the schedule settings document with timezone
    if (hasLocationData && profileUpdateData.calculatedTimezone) {
      const scheduleRef = doc(db, 'stylists', userId, 'settings', 'schedule');
      
      await setDoc(
        scheduleRef,
        {
          timezone: profileUpdateData.calculatedTimezone,
          calculatedTimezone: profileUpdateData.calculatedTimezone,
          updatedAt: new Date().toISOString(),
        },
        { merge: true } // Merge with existing data instead of overwriting
      );
      
      console.log('✓ Schedule timezone updated');
    }

  } catch (error) {
    console.error('Error updating stylist profile:', error);
    throw error;
  }
}