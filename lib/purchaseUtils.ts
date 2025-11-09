import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { db } from './firebase';

export async function checkUserPurchase(userId: string, courseId: string): Promise<boolean> {
  try {
    const q = query(
      collection(db, 'purchases'),
      where('userId', '==', userId),
      where('courseId', '==', courseId)
    );
         
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  } catch (error) {
    console.error('Error checking purchase:', error);
    return false;
  }
}

// Record a new purchase
export async function recordPurchase(userId: string, courseId: string): Promise<void> {
  try {
    await addDoc(collection(db, 'purchases'), {
      userId,
      courseId,
      purchaseDate: new Date(),
      status: 'completed'
    });
    console.log('Purchase recorded successfully:', { userId, courseId });
  } catch (error) {
    console.error('Error recording purchase:', error);
    throw error;
  }
}